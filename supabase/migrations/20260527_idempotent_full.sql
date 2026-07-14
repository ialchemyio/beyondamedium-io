-- ============================================
-- Beyond A Medium.IO — Full Idempotent Migration
-- Safe to run on empty OR existing database
-- ============================================

-- ============================================
-- 1. FOUNDATION
-- ============================================

create table if not exists public.projects (
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
drop policy if exists "Users can view own projects" on public.projects;
drop policy if exists "Users can create projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can view own projects" on public.projects for select using (auth.uid() = user_id);
create policy "Users can create projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on public.projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = user_id);

create table if not exists public.pages (
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
drop policy if exists "Users can view own pages" on public.pages;
drop policy if exists "Users can create pages" on public.pages;
drop policy if exists "Users can update own pages" on public.pages;
drop policy if exists "Users can delete own pages" on public.pages;
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

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  url text not null,
  type text not null check (type in ('image', 'video', 'file')),
  size integer default 0,
  created_at timestamptz default now()
);
alter table public.assets enable row level security;
drop policy if exists "Users can view own assets" on public.assets;
drop policy if exists "Users can create assets" on public.assets;
drop policy if exists "Users can delete own assets" on public.assets;
create policy "Users can view own assets" on public.assets for select using (
  exists (select 1 from public.projects where id = assets.project_id and user_id = auth.uid())
);
create policy "Users can create assets" on public.assets for insert with check (
  exists (select 1 from public.projects where id = assets.project_id and user_id = auth.uid())
);
create policy "Users can delete own assets" on public.assets for delete using (
  exists (select 1 from public.projects where id = assets.project_id and user_id = auth.uid())
);

-- ============================================
-- 2. CREDITS & BILLING
-- ============================================

create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  plan text not null default 'starter' check (plan in ('starter', 'builder', 'pro', 'bam')),
  credits_remaining integer not null default 5,
  credits_monthly integer not null default 5,
  credits_purchased integer not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.user_credits enable row level security;
drop policy if exists "Users can view own credits" on public.user_credits;
drop policy if exists "Users can insert own credits" on public.user_credits;
drop policy if exists "Users can update own credits" on public.user_credits;
create policy "Users can view own credits" on public.user_credits for select using (auth.uid() = user_id);
create policy "Users can insert own credits" on public.user_credits for insert with check (auth.uid() = user_id);
create policy "Users can update own credits" on public.user_credits for update using (auth.uid() = user_id);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  action text not null,
  description text default '',
  created_at timestamptz default now()
);
alter table public.credit_transactions enable row level security;
drop policy if exists "Users can view own transactions" on public.credit_transactions;
drop policy if exists "Users can insert own transactions" on public.credit_transactions;
create policy "Users can view own transactions" on public.credit_transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.credit_transactions for insert with check (auth.uid() = user_id);

-- ============================================
-- 3. TEMPLATES
-- ============================================

create table if not exists public.templates (
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
drop policy if exists "Public templates readable by all" on public.templates;
drop policy if exists "Users can create templates" on public.templates;
drop policy if exists "Users can update own templates" on public.templates;
drop policy if exists "Users can delete own templates" on public.templates;
create policy "Public templates readable by all" on public.templates for select using (is_public = true or auth.uid() = user_id);
create policy "Users can create templates" on public.templates for insert with check (auth.uid() = user_id);
create policy "Users can update own templates" on public.templates for update using (auth.uid() = user_id);
create policy "Users can delete own templates" on public.templates for delete using (auth.uid() = user_id);

-- ============================================
-- 4. AUTOMATIONS & FUNNELS
-- ============================================

create table if not exists public.automations (
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
drop policy if exists "Users can view own automations" on public.automations;
drop policy if exists "Users can create automations" on public.automations;
drop policy if exists "Users can update own automations" on public.automations;
drop policy if exists "Users can delete own automations" on public.automations;
create policy "Users can view own automations" on public.automations for select using (auth.uid() = user_id);
create policy "Users can create automations" on public.automations for insert with check (auth.uid() = user_id);
create policy "Users can update own automations" on public.automations for update using (auth.uid() = user_id);
create policy "Users can delete own automations" on public.automations for delete using (auth.uid() = user_id);

create table if not exists public.funnels (
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
drop policy if exists "Users can view own funnels" on public.funnels;
drop policy if exists "Users can create funnels" on public.funnels;
drop policy if exists "Users can update own funnels" on public.funnels;
drop policy if exists "Users can delete own funnels" on public.funnels;
create policy "Users can view own funnels" on public.funnels for select using (auth.uid() = user_id);
create policy "Users can create funnels" on public.funnels for insert with check (auth.uid() = user_id);
create policy "Users can update own funnels" on public.funnels for update using (auth.uid() = user_id);
create policy "Users can delete own funnels" on public.funnels for delete using (auth.uid() = user_id);

-- ============================================
-- 5. PREMIUM DEPLOYMENTS
-- ============================================

create table if not exists public.premium_deployments (
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
create index if not exists idx_premium_deployments_user on public.premium_deployments(user_id);
create index if not exists idx_premium_deployments_slug on public.premium_deployments(slug);
alter table public.premium_deployments enable row level security;
drop policy if exists "Users can view own deployments" on public.premium_deployments;
drop policy if exists "Users can insert own deployments" on public.premium_deployments;
drop policy if exists "Users can update own deployments" on public.premium_deployments;
create policy "Users can view own deployments" on public.premium_deployments for select using (auth.uid() = user_id);
create policy "Users can insert own deployments" on public.premium_deployments for insert with check (auth.uid() = user_id);
create policy "Users can update own deployments" on public.premium_deployments for update using (auth.uid() = user_id);

-- ============================================
-- 6. REVENUE SYSTEMS
-- ============================================

create table if not exists public.revenue_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null,
  description text not null,
  category text not null check (category in ('leadgen', 'booking', 'sales', 'digital', 'brand', 'local')),
  revenue_potential text not null,
  setup_time text not null default '10 min',
  conversion_focus text not null,
  use_case text not null,
  html text not null default '',
  css text default '',
  backend_features jsonb not null default '[]',
  funnel_steps jsonb not null default '[]',
  integrations jsonb not null default '[]',
  api_endpoints jsonb not null default '[]',
  benefits jsonb not null default '[]',
  is_active boolean default true,
  launches integer default 0,
  avg_conversions numeric default 0,
  created_at timestamptz default now()
);
alter table public.revenue_systems enable row level security;
drop policy if exists "Revenue systems readable by all" on public.revenue_systems;
create policy "Revenue systems readable by all" on public.revenue_systems for select using (true);

-- ============================================
-- 7. FUNNEL EVENTS
-- ============================================

create table if not exists public.funnel_events (
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
create index if not exists idx_funnel_events_funnel on public.funnel_events(funnel_id, created_at desc);
create index if not exists idx_funnel_events_step on public.funnel_events(step_id, event_type);
alter table public.funnel_events enable row level security;
drop policy if exists "Events insertable publicly" on public.funnel_events;
drop policy if exists "Events viewable by project owner" on public.funnel_events;
create policy "Events insertable publicly" on public.funnel_events for insert with check (true);
create policy "Events viewable by project owner" on public.funnel_events for select using (
  exists (select 1 from public.projects where id = funnel_events.project_id and user_id = auth.uid())
);

-- ============================================
-- 8. EXPERIMENTS & VARIANTS
-- ============================================

create table if not exists public.experiments (
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
drop policy if exists "Experiments readable by all" on public.experiments;
drop policy if exists "Experiments insertable" on public.experiments;
drop policy if exists "Experiments updatable" on public.experiments;
drop policy if exists "Experiments deletable" on public.experiments;
create policy "Experiments readable by all" on public.experiments for select using (true);
create policy "Experiments insertable" on public.experiments for insert with check (true);
create policy "Experiments updatable" on public.experiments for update using (true);
create policy "Experiments deletable" on public.experiments for delete using (true);

create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  name text not null default 'A',
  page_id text,
  weight integer not null default 50,
  created_at timestamptz default now()
);
alter table public.variants enable row level security;
drop policy if exists "Variants readable by all" on public.variants;
drop policy if exists "Variants insertable" on public.variants;
drop policy if exists "Variants updatable" on public.variants;
drop policy if exists "Variants deletable" on public.variants;
create policy "Variants readable by all" on public.variants for select using (true);
create policy "Variants insertable" on public.variants for insert with check (true);
create policy "Variants updatable" on public.variants for update using (true);
create policy "Variants deletable" on public.variants for delete using (true);

alter table public.funnel_events add column if not exists variant_id uuid references public.variants(id);

create table if not exists public.variant_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  session_id text not null,
  variant_id uuid references public.variants(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(experiment_id, session_id)
);
alter table public.variant_assignments enable row level security;
drop policy if exists "Assignments insertable" on public.variant_assignments;
drop policy if exists "Assignments readable" on public.variant_assignments;
create policy "Assignments insertable" on public.variant_assignments for insert with check (true);
create policy "Assignments readable" on public.variant_assignments for select using (true);

-- ============================================
-- 9. FOOD ORDERING + STRIPE CONNECT
-- ============================================

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text default '',
  cuisine text default '',
  address text default '',
  city text default '',
  state text default '',
  phone text default '',
  email text default '',
  logo text,
  hero_image text,
  primary_color text default '#dc2626',
  stripe_account_id text,
  stripe_account_status text default 'pending' check (stripe_account_status in ('pending', 'active', 'restricted', 'rejected')),
  stripe_onboarding_url text,
  is_published boolean default false,
  is_claimed boolean default false,
  accepts_orders boolean default false,
  hours jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_restaurants_slug on public.restaurants(slug);
create index if not exists idx_restaurants_user on public.restaurants(user_id);
alter table public.restaurants enable row level security;
drop policy if exists "Restaurants public read" on public.restaurants;
drop policy if exists "Owners insert" on public.restaurants;
drop policy if exists "Owners update" on public.restaurants;
drop policy if exists "Owners delete" on public.restaurants;
create policy "Restaurants public read" on public.restaurants for select using (true);
create policy "Owners insert" on public.restaurants for insert with check (auth.uid() = user_id);
create policy "Owners update" on public.restaurants for update using (auth.uid() = user_id);
create policy "Owners delete" on public.restaurants for delete using (auth.uid() = user_id);

create table if not exists public.restaurant_menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  image text,
  category text default 'Mains',
  dietary_tags text[] default '{}',
  is_available boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);
create index if not exists idx_menu_items_restaurant on public.restaurant_menu_items(restaurant_id);
alter table public.restaurant_menu_items enable row level security;
drop policy if exists "Menu items public read" on public.restaurant_menu_items;
drop policy if exists "Owners manage menu" on public.restaurant_menu_items;
create policy "Menu items public read" on public.restaurant_menu_items for select using (true);
create policy "Owners manage menu" on public.restaurant_menu_items for all using (
  exists (select 1 from public.restaurants where id = restaurant_menu_items.restaurant_id and user_id = auth.uid())
);

create table if not exists public.restaurant_orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text default '',
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'refunded')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_orders_restaurant on public.restaurant_orders(restaurant_id);
create index if not exists idx_orders_status on public.restaurant_orders(status);
create index if not exists idx_orders_created on public.restaurant_orders(created_at desc);
alter table public.restaurant_orders enable row level security;
drop policy if exists "Orders insertable publicly" on public.restaurant_orders;
drop policy if exists "Owners view orders" on public.restaurant_orders;
drop policy if exists "Owners update orders" on public.restaurant_orders;
create policy "Orders insertable publicly" on public.restaurant_orders for insert with check (true);
create policy "Owners view orders" on public.restaurant_orders for select using (
  exists (select 1 from public.restaurants where id = restaurant_orders.restaurant_id and user_id = auth.uid())
);
create policy "Owners update orders" on public.restaurant_orders for update using (
  exists (select 1 from public.restaurants where id = restaurant_orders.restaurant_id and user_id = auth.uid())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  stripe_session_id text,
  stripe_payment_intent_id text,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  order_id uuid references public.restaurant_orders(id) on delete set null,
  amount_total numeric(10,2) not null,
  bam_cut numeric(10,2) not null,
  client_cut numeric(10,2) not null,
  currency text default 'usd',
  stripe_account_id text,
  status text default 'completed' check (status in ('completed', 'refunded', 'disputed', 'failed')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists idx_transactions_restaurant on public.transactions(restaurant_id);
create index if not exists idx_transactions_event on public.transactions(stripe_event_id);
create index if not exists idx_transactions_created on public.transactions(created_at desc);
alter table public.transactions enable row level security;
drop policy if exists "Transactions insertable" on public.transactions;
drop policy if exists "Owners view their transactions" on public.transactions;
create policy "Transactions insertable" on public.transactions for insert with check (true);
create policy "Owners view their transactions" on public.transactions for select using (
  exists (select 1 from public.restaurants where id = transactions.restaurant_id and user_id = auth.uid())
);

create table if not exists public.business_directory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text default 'restaurant',
  description text default '',
  city text default '',
  state text default '',
  address text default '',
  phone text default '',
  cuisine text default '',
  logo text,
  hero_image text,
  is_claimed boolean default false,
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  claimed_restaurant_id uuid references public.restaurants(id) on delete set null,
  claimed_at timestamptz,
  default_menu jsonb default '[]',
  created_at timestamptz default now()
);
create index if not exists idx_directory_slug on public.business_directory(slug);
create index if not exists idx_directory_city on public.business_directory(city);
alter table public.business_directory enable row level security;
drop policy if exists "Directory public read" on public.business_directory;
drop policy if exists "Directory updatable when claiming" on public.business_directory;
create policy "Directory public read" on public.business_directory for select using (true);
create policy "Directory updatable when claiming" on public.business_directory for update using (true);
