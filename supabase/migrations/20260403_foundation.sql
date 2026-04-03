-- ============================================
-- Beyond A Medium — Foundation Schema
-- ============================================

-- Projects (a website being built)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text default '',
  favicon text,
  custom_domain text,
  is_published boolean default false,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;
create policy "Users can view own projects" on public.projects for select using (auth.uid() = user_id);
create policy "Users can create projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on public.projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = user_id);

-- Pages (each page in a project)
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  slug text not null,
  html text default '',
  css text default '',
  js text default '',
  gjs_data jsonb default '{}',
  is_home boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, slug)
);

alter table public.pages enable row level security;
create policy "Users can view own pages" on public.pages for select using (
  exists (select 1 from public.projects where id = pages.project_id and user_id = auth.uid())
);
create policy "Users can create pages" on public.pages for insert with check (
  exists (select 1 from public.projects where id = pages.project_id and user_id = auth.uid())
);
create policy "Users can update own pages" on public.pages for update using (
  exists (select 1 from public.projects where id = pages.project_id and user_id = auth.uid())
);
create policy "Users can delete own pages" on public.pages for delete using (
  exists (select 1 from public.projects where id = pages.project_id and user_id = auth.uid())
);

-- Assets (uploaded images, videos, files)
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  url text not null,
  type text not null check (type in ('image', 'video', 'file')),
  size integer default 0,
  created_at timestamptz default now()
);

alter table public.assets enable row level security;
create policy "Users can view own assets" on public.assets for select using (
  exists (select 1 from public.projects where id = assets.project_id and user_id = auth.uid())
);
create policy "Users can create assets" on public.assets for insert with check (
  exists (select 1 from public.projects where id = assets.project_id and user_id = auth.uid())
);
create policy "Users can delete own assets" on public.assets for delete using (
  exists (select 1 from public.projects where id = assets.project_id and user_id = auth.uid())
);
