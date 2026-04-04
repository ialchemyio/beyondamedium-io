-- Revenue Systems — full business systems with frontend + backend
create table public.revenue_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null,
  description text not null,
  category text not null check (category in ('leadgen', 'booking', 'sales', 'digital', 'brand', 'local')),
  revenue_potential text not null,
  setup_time text not null default '10 min',
  conversion_focus text not null,
  use_case text not null,

  -- Frontend
  html text not null default '',
  css text default '',

  -- Backend config
  backend_features jsonb not null default '[]',
  funnel_steps jsonb not null default '[]',
  integrations jsonb not null default '[]',
  api_endpoints jsonb not null default '[]',

  -- System benefits
  benefits jsonb not null default '[]',

  -- Metadata
  is_active boolean default true,
  launches integer default 0,
  avg_conversions numeric default 0,
  created_at timestamptz default now()
);

alter table public.revenue_systems enable row level security;
create policy "Revenue systems readable by all" on public.revenue_systems for select using (true);
