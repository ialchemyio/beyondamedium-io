-- Experiments
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  funnel_id text not null,
  step_id text not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed')),
  auto_winner_threshold integer default 0,
  winner_variant_id uuid,
  created_at timestamptz default now()
);

alter table public.experiments enable row level security;
create policy "Experiments readable by all" on public.experiments for select using (true);
create policy "Experiments insertable" on public.experiments for insert with check (true);
create policy "Experiments updatable" on public.experiments for update using (true);
create policy "Experiments deletable" on public.experiments for delete using (true);

-- Variants
create table public.variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  name text not null default 'A',
  page_id text,
  weight integer not null default 50,
  created_at timestamptz default now()
);

alter table public.variants enable row level security;
create policy "Variants readable by all" on public.variants for select using (true);
create policy "Variants insertable" on public.variants for insert with check (true);
create policy "Variants updatable" on public.variants for update using (true);
create policy "Variants deletable" on public.variants for delete using (true);

-- Add variant_id to events
alter table public.funnel_events add column if not exists variant_id uuid references public.variants(id);

-- Variant assignments (persist user → variant)
create table public.variant_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  session_id text not null,
  variant_id uuid references public.variants(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(experiment_id, session_id)
);

alter table public.variant_assignments enable row level security;
create policy "Assignments insertable" on public.variant_assignments for insert with check (true);
create policy "Assignments readable" on public.variant_assignments for select using (true);
