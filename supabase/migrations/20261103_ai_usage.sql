-- Per-call AI cost log: tokens, estimated USD, and credits charged, so margins
-- are measured instead of guessed. Written only by the server (service role).
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  route text not null,
  user_id uuid references auth.users(id) on delete set null,
  project_id uuid,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_write_tokens int not null default 0,
  est_cost_usd numeric(10, 5),
  credits int not null default 0,
  ok boolean not null default true
);

create index if not exists ai_usage_created_at_idx on public.ai_usage (created_at desc);
create index if not exists ai_usage_user_idx on public.ai_usage (user_id, created_at desc);

-- No policies: users can't read or write it. Service role bypasses RLS.
alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from public, anon, authenticated;
grant all on table public.ai_usage to service_role;

-- Margin check, e.g.:
-- select route, count(*), sum(credits) credits, round(sum(est_cost_usd), 2) usd,
--        round(sum(est_cost_usd) / nullif(sum(credits), 0), 4) usd_per_credit
-- from public.ai_usage where created_at > now() - interval '30 days' group by route;
