-- ============================================
-- Enforce per-plan project limits (was advertised, never enforced).
-- Starter 1 · Builder 5 · Pro / BAM unlimited — must match PLANS.maxProjects
-- in src/lib/stripe.ts (src/lib/project-limits.test.ts fails if they drift).
--
-- Enforced in the database because the dashboard inserts projects directly
-- from the browser; an API-only check would be bypassable.
-- Existing projects are never touched: users already over a limit keep them
-- (e.g. after a downgrade) but cannot create more until they are under it.
-- Idempotent.
-- ============================================

-- Plan → max projects. NULL = unlimited.
create or replace function public.plan_project_limit(p_plan text)
returns int
language sql
immutable
as $$
  select case coalesce(p_plan, 'starter')
    when 'starter' then 1
    when 'builder' then 5
    when 'pro' then null
    when 'bam' then null
    else 1
  end
$$;

-- The caller's own quota, for the UI. Uses auth.uid(), takes no user id,
-- so it cannot be used to probe other accounts.
create or replace function public.my_project_quota()
returns table (used int, max_projects int, plan text)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::int from public.projects p where p.user_id = auth.uid()) as used,
    public.plan_project_limit(uc.plan) as max_projects,
    coalesce(uc.plan, 'starter') as plan
  from (select auth.uid() as uid) me
  left join public.user_credits uc on uc.user_id = me.uid
$$;

-- Postgres grants EXECUTE to PUBLIC by default; revoke that too (anon could call it).
revoke all on function public.my_project_quota() from public, anon;
grant execute on function public.my_project_quota() to authenticated, service_role;
revoke all on function public.plan_project_limit(text) from public, anon;
grant execute on function public.plan_project_limit(text) to authenticated, service_role;

-- BEFORE INSERT guard on projects.
create or replace function public.enforce_project_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit int;
  v_used int;
begin
  -- Only end users are limited. Service role (webhooks, seeds, admin) and
  -- direct SQL as postgres bypass the check.
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  -- Serialize concurrent inserts for the same user so two parallel requests
  -- cannot both see "under the limit".
  perform pg_advisory_xact_lock(hashtext('project_limit:' || new.user_id::text));

  select plan into v_plan from public.user_credits where user_id = new.user_id;
  v_limit := public.plan_project_limit(v_plan);
  if v_limit is null then
    return new;
  end if;

  select count(*) into v_used from public.projects where user_id = new.user_id;
  if v_used >= v_limit then
    raise exception 'project_limit_reached: your % plan allows % project%',
      coalesce(v_plan, 'starter'), v_limit, case when v_limit = 1 then '' else 's' end
      using errcode = 'P0001',
            hint = 'Upgrade your plan to create more projects.';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_enforce_limit on public.projects;
create trigger projects_enforce_limit
  before insert on public.projects
  for each row execute function public.enforce_project_limit();
