-- Automations table
create table public.automations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  trigger_type text not null,
  action_type text not null,
  config jsonb default '{}',
  is_active boolean default true,
  last_triggered_at timestamptz,
  trigger_count integer default 0,
  created_at timestamptz default now()
);

alter table public.automations enable row level security;
create policy "Users can view own automations" on public.automations for select using (auth.uid() = user_id);
create policy "Users can create automations" on public.automations for insert with check (auth.uid() = user_id);
create policy "Users can update own automations" on public.automations for update using (auth.uid() = user_id);
create policy "Users can delete own automations" on public.automations for delete using (auth.uid() = user_id);

-- Funnels table
create table public.funnels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  steps jsonb default '[]',
  is_active boolean default true,
  conversion_rate numeric default 0,
  total_revenue numeric default 0,
  created_at timestamptz default now()
);

alter table public.funnels enable row level security;
create policy "Users can view own funnels" on public.funnels for select using (auth.uid() = user_id);
create policy "Users can create funnels" on public.funnels for insert with check (auth.uid() = user_id);
create policy "Users can update own funnels" on public.funnels for update using (auth.uid() = user_id);
create policy "Users can delete own funnels" on public.funnels for delete using (auth.uid() = user_id);
