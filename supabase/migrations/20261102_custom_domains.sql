-- ============================================
-- Custom domains: request → BAM team activates → middleware serves the site.
--
-- Users can REQUEST a domain for a project they own and remove it, but cannot
-- activate one: status changes only via service role / SQL editor. That stops
-- anyone claiming a domain they don't control. The middleware reads active
-- rows with the service role, so there is no anonymous read policy.
--
-- Activation runbook (BAM team):
--   1. Customer points DNS at the app server (A @ → server IP, CNAME www → apex).
--   2. Coolify → app → Domains: add https://<domain>,https://www.<domain>, then redeploy
--      so Traefik routes it and issues the certificate.
--   3. update public.custom_domains set status = 'active', activated_at = now()
--        where domain = '<domain>';
-- Idempotent.
-- ============================================

create table if not exists public.custom_domains (
  domain text primary key
    check (domain = lower(domain)
           and length(domain) <= 253
           and domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$'),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'active', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

-- One domain per project.
create unique index if not exists custom_domains_project_unique on public.custom_domains(project_id);
create index if not exists custom_domains_user_idx on public.custom_domains(user_id);

alter table public.custom_domains enable row level security;

drop policy if exists "Users view own domains" on public.custom_domains;
create policy "Users view own domains" on public.custom_domains
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users request domains for own projects" on public.custom_domains;
create policy "Users request domains for own projects" on public.custom_domains
  for insert to authenticated with check (
    auth.uid() = user_id
    and status = 'requested'
    and activated_at is null
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "Users remove own domains" on public.custom_domains;
create policy "Users remove own domains" on public.custom_domains
  for delete to authenticated using (auth.uid() = user_id);

-- No update policy for users: activation is a team action.

-- Carry over domains users "connected" with the old page (it only saved the
-- text; nothing ever served them). They become requests for the team to review.
insert into public.custom_domains (domain, project_id, user_id, status, note)
select distinct on (d) d, p.id, p.user_id, 'requested', 'Migrated from projects.custom_domain'
from (
  select id, user_id,
         regexp_replace(regexp_replace(lower(trim(custom_domain)), '^(https?://)?(www\.)?', ''), '[/:?#].*$', '') as d
  from public.projects
  where custom_domain is not null and trim(custom_domain) <> ''
) p
where p.d ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$'
  and p.d <> 'beyondamedium.io' and p.d not like '%.beyondamedium.io'
order by d, p.id
on conflict do nothing;
