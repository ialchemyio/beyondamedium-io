-- Funnel events tracking
create table public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  funnel_id text not null,
  step_id text not null,
  event_type text not null check (event_type in ('view', 'click', 'conversion', 'payment')),
  value numeric default 0,
  session_id text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_funnel_events_funnel on public.funnel_events(funnel_id, created_at desc);
create index idx_funnel_events_step on public.funnel_events(step_id, event_type);

alter table public.funnel_events enable row level security;
create policy "Events insertable publicly" on public.funnel_events for insert with check (true);
create policy "Events viewable by project owner" on public.funnel_events for select using (
  exists (select 1 from public.projects where id = funnel_events.project_id and user_id = auth.uid())
);
