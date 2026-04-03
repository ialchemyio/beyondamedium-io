-- Templates table
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  category text default 'general',
  html text default '',
  css text default '',
  js text default '',
  gjs_data jsonb default '{}',
  thumbnail text,
  is_public boolean default false,
  uses integer default 0,
  created_at timestamptz default now()
);

alter table public.templates enable row level security;
create policy "Public templates readable by all" on public.templates for select using (is_public = true or auth.uid() = user_id);
create policy "Users can create templates" on public.templates for insert with check (auth.uid() = user_id);
create policy "Users can update own templates" on public.templates for update using (auth.uid() = user_id);
create policy "Users can delete own templates" on public.templates for delete using (auth.uid() = user_id);
