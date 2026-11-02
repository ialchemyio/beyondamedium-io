-- ============================================================
-- Run this whole file once in Supabase → Beyond A Medium.IO →
-- SQL Editor → New query → paste → Run. Safe to re-run.
-- Combines, in order:
--   1. 20260527_credit_functions.sql   (AI + billing; fixed permissions)
--   2. 20260720_storage_assets.sql      (image uploads bucket)
--   3. 20260527_tighten_experiment_rls.sql
--   4. 20261102_project_limits.sql      (re-run for permission fix)
-- ============================================================


-- >>>>>>>>>> supabase/migrations/20260527_credit_functions.sql

-- ============================================
-- Atomic credit + plan provisioning functions
-- Fixes the read-then-write race in lib/credits.ts and gives the
-- Stripe webhook a safe, idempotent way to grant plans / credit packs.
-- Safe to run multiple times (create or replace).
-- ============================================

-- Atomically deduct credits under a row lock. Purchased pool first, then monthly.
-- Raises 'insufficient_credits' / 'no_credits_record' which the caller maps to a 402/404.
create or replace function public.deduct_credits(p_user_id uuid, p_amount int, p_action text)
returns public.user_credits
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.user_credits;
  from_purchased int;
  from_monthly int;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into rec from public.user_credits where user_id = p_user_id for update;
  if not found then
    raise exception 'no_credits_record';
  end if;

  if (rec.credits_remaining + rec.credits_purchased) < p_amount then
    raise exception 'insufficient_credits';
  end if;

  from_purchased := least(rec.credits_purchased, p_amount);
  from_monthly := p_amount - from_purchased;

  update public.user_credits
     set credits_purchased = credits_purchased - from_purchased,
         credits_remaining = credits_remaining - from_monthly,
         updated_at = now()
   where user_id = p_user_id
   returning * into rec;

  insert into public.credit_transactions(user_id, amount, action, description)
  values (p_user_id, -p_amount, p_action, 'Used ' || p_amount || ' credits for ' || p_action);

  return rec;
end;
$$;

-- Atomically add purchased (one-time pack) credits.
create or replace function public.add_purchased_credits(p_user_id uuid, p_amount int, p_action text)
returns public.user_credits
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.user_credits;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  -- Ensure a row exists (starter defaults) before topping up.
  insert into public.user_credits (user_id, plan, credits_remaining, credits_monthly, credits_purchased,
                                    current_period_start, current_period_end)
  values (p_user_id, 'starter', 50, 50, 0, now(), now() + interval '1 month')
  on conflict (user_id) do nothing;

  update public.user_credits
     set credits_purchased = credits_purchased + p_amount,
         updated_at = now()
   where user_id = p_user_id
   returning * into rec;

  insert into public.credit_transactions(user_id, amount, action, description)
  values (p_user_id, p_amount, p_action, 'Purchased ' || p_amount || ' credits');

  return rec;
end;
$$;

-- Provision (or refresh) a subscription plan. Sets the monthly allotment,
-- resets remaining to the new monthly, records Stripe identifiers and the
-- billing period. Purchased credits are preserved.
create or replace function public.provision_plan(
  p_user_id uuid,
  p_plan text,
  p_monthly int,
  p_customer text,
  p_subscription text,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns public.user_credits
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.user_credits;
begin
  insert into public.user_credits (user_id, plan, credits_monthly, credits_remaining, credits_purchased,
                                   stripe_customer_id, stripe_subscription_id,
                                   current_period_start, current_period_end)
  values (p_user_id, p_plan, p_monthly, p_monthly, 0,
          p_customer, p_subscription, p_period_start, p_period_end)
  on conflict (user_id) do update
     set plan = excluded.plan,
         credits_monthly = excluded.credits_monthly,
         credits_remaining = excluded.credits_monthly,
         stripe_customer_id = coalesce(excluded.stripe_customer_id, public.user_credits.stripe_customer_id),
         stripe_subscription_id = coalesce(excluded.stripe_subscription_id, public.user_credits.stripe_subscription_id),
         current_period_start = excluded.current_period_start,
         current_period_end = excluded.current_period_end,
         updated_at = now()
   returning * into rec;

  return rec;
end;
$$;

-- Lock down: these run as SECURITY DEFINER, callable only by the service role
-- (webhook / server routes). Revoke from anon/authenticated so clients can't call them.
-- Align the DB column default with the starter allotment (was 5, marketing/code say 50).
alter table public.user_credits alter column credits_remaining set default 50;
alter table public.user_credits alter column credits_monthly set default 50;

-- Postgres grants EXECUTE on new functions to PUBLIC, so revoking from anon /
-- authenticated alone still lets anyone call these (verified locally). These are
-- SECURITY DEFINER and take an arbitrary user id: callable by the public they
-- would let anyone grant themselves credits or a paid plan. Only the server's
-- service role may execute them.
revoke all on function public.deduct_credits(uuid, int, text) from public, anon, authenticated;
revoke all on function public.add_purchased_credits(uuid, int, text) from public, anon, authenticated;
revoke all on function public.provision_plan(uuid, text, int, text, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.deduct_credits(uuid, int, text) to service_role;
grant execute on function public.add_purchased_credits(uuid, int, text) to service_role;
grant execute on function public.provision_plan(uuid, text, int, text, text, timestamptz, timestamptz) to service_role;


-- >>>>>>>>>> supabase/migrations/20260720_storage_assets.sql

-- ============================================
-- Project asset storage (image uploads in the builder)
-- Creates a public-read bucket where each user writes only under their own
-- {user_id}/ folder. Idempotent.
-- ============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  true,
  10485760, -- 10 MB
  array['image/png','image/jpeg','image/gif','image/webp','image/svg+xml','image/avif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/png','image/jpeg','image/gif','image/webp','image/svg+xml','image/avif'];

-- Anyone can read (published sites serve these images).
drop policy if exists "Project assets are publicly readable" on storage.objects;
create policy "Project assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'project-assets');

-- Authenticated users may write only inside their own top-level folder.
drop policy if exists "Users upload own project assets" on storage.objects;
create policy "Users upload own project assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own project assets" on storage.objects;
create policy "Users update own project assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own project assets" on storage.objects;
create policy "Users delete own project assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- >>>>>>>>>> supabase/migrations/20260527_tighten_experiment_rls.sql

-- ============================================
-- Tighten RLS on the experiment tables.
-- Previously experiments/variants allowed INSERT/UPDATE/DELETE with `using(true)`,
-- meaning anyone holding the public anon key could mutate them directly against
-- Supabase (bypassing our API routes). We keep public SELECT (needed to serve
-- A/B tests to anonymous visitors) and public INSERT on variant_assignments
-- (assignment happens for logged-out visitors), but require an authenticated
-- session for all experiment/variant mutations.
-- Idempotent.
-- ============================================

-- experiments: public read (serve tests), authenticated-only writes.
drop policy if exists "Experiments insertable" on public.experiments;
drop policy if exists "Experiments updatable" on public.experiments;
drop policy if exists "Experiments deletable" on public.experiments;
drop policy if exists "Experiments insertable (auth)" on public.experiments;
create policy "Experiments insertable (auth)" on public.experiments
  for insert to authenticated with check (true);
drop policy if exists "Experiments updatable (auth)" on public.experiments;
create policy "Experiments updatable (auth)" on public.experiments
  for update to authenticated using (true);
drop policy if exists "Experiments deletable (auth)" on public.experiments;
create policy "Experiments deletable (auth)" on public.experiments
  for delete to authenticated using (true);

-- variants: same posture.
drop policy if exists "Variants insertable" on public.variants;
drop policy if exists "Variants updatable" on public.variants;
drop policy if exists "Variants deletable" on public.variants;
drop policy if exists "Variants insertable (auth)" on public.variants;
create policy "Variants insertable (auth)" on public.variants
  for insert to authenticated with check (true);
drop policy if exists "Variants updatable (auth)" on public.variants;
create policy "Variants updatable (auth)" on public.variants
  for update to authenticated using (true);
drop policy if exists "Variants deletable (auth)" on public.variants;
create policy "Variants deletable (auth)" on public.variants
  for delete to authenticated using (true);

-- variant_assignments: INSERT + SELECT stay public (anonymous visitors get
-- assigned and we read back their existing assignment), but block UPDATE/DELETE
-- so assignments can't be tampered with. (No prior update/delete policy existed,
-- but make the intent explicit and revoke any that appear.)
drop policy if exists "Assignments updatable" on public.variant_assignments;
drop policy if exists "Assignments deletable" on public.variant_assignments;


-- >>>>>>>>>> supabase/migrations/20261102_project_limits.sql

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
