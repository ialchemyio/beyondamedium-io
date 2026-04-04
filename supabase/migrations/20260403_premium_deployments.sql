-- Premium site deployments — tracks sites deployed via the Premium Templates system
create table if not exists premium_deployments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  template_id text not null,
  slug text not null unique,
  repo_name text not null,
  repo_full_name text not null,
  vercel_project_name text not null,
  deploy_url text not null,
  site_url text not null,
  brand_config jsonb not null default '{}',
  custom_domain text,
  status text not null default 'deployed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_premium_deployments_user on premium_deployments(user_id);
create index if not exists idx_premium_deployments_slug on premium_deployments(slug);

-- RLS
alter table premium_deployments enable row level security;

create policy "Users can view own deployments"
  on premium_deployments for select
  using (auth.uid() = user_id);

create policy "Users can insert own deployments"
  on premium_deployments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own deployments"
  on premium_deployments for update
  using (auth.uid() = user_id);
