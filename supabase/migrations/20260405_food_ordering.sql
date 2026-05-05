-- ============================================
-- BAM OS — Food Ordering + Stripe Connect
-- ============================================

-- Restaurants (extends concept of project for food)
create table public.restaurants (
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

  -- Stripe Connect
  stripe_account_id text,
  stripe_account_status text default 'pending' check (stripe_account_status in ('pending', 'active', 'restricted', 'rejected')),
  stripe_onboarding_url text,

  -- Status
  is_published boolean default false,
  is_claimed boolean default false,
  accepts_orders boolean default false,
  hours jsonb default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_restaurants_slug on public.restaurants(slug);
create index idx_restaurants_user on public.restaurants(user_id);

alter table public.restaurants enable row level security;
create policy "Restaurants public read" on public.restaurants for select using (true);
create policy "Owners insert" on public.restaurants for insert with check (auth.uid() = user_id);
create policy "Owners update" on public.restaurants for update using (auth.uid() = user_id);
create policy "Owners delete" on public.restaurants for delete using (auth.uid() = user_id);

-- Menu Items
create table public.restaurant_menu_items (
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

create index idx_menu_items_restaurant on public.restaurant_menu_items(restaurant_id);

alter table public.restaurant_menu_items enable row level security;
create policy "Menu items public read" on public.restaurant_menu_items for select using (true);
create policy "Owners manage menu" on public.restaurant_menu_items for all using (
  exists (select 1 from public.restaurants where id = restaurant_menu_items.restaurant_id and user_id = auth.uid())
);

-- Orders
create table public.restaurant_orders (
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

create index idx_orders_restaurant on public.restaurant_orders(restaurant_id);
create index idx_orders_status on public.restaurant_orders(status);
create index idx_orders_created on public.restaurant_orders(created_at desc);

alter table public.restaurant_orders enable row level security;
create policy "Orders insertable publicly" on public.restaurant_orders for insert with check (true);
create policy "Owners view orders" on public.restaurant_orders for select using (
  exists (select 1 from public.restaurants where id = restaurant_orders.restaurant_id and user_id = auth.uid())
);
create policy "Owners update orders" on public.restaurant_orders for update using (
  exists (select 1 from public.restaurants where id = restaurant_orders.restaurant_id and user_id = auth.uid())
);

-- Transactions (revenue tracking with BAM cut)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,  -- idempotency
  stripe_session_id text,
  stripe_payment_intent_id text,

  restaurant_id uuid references public.restaurants(id) on delete set null,
  order_id uuid references public.restaurant_orders(id) on delete set null,

  amount_total numeric(10,2) not null,    -- total customer paid
  bam_cut numeric(10,2) not null,          -- 14% to BAM
  client_cut numeric(10,2) not null,       -- 86% to restaurant
  currency text default 'usd',

  stripe_account_id text,                  -- Connect account
  status text default 'completed' check (status in ('completed', 'refunded', 'disputed', 'failed')),

  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_transactions_restaurant on public.transactions(restaurant_id);
create index idx_transactions_event on public.transactions(stripe_event_id);
create index idx_transactions_created on public.transactions(created_at desc);

alter table public.transactions enable row level security;
create policy "Transactions insertable" on public.transactions for insert with check (true);
create policy "Owners view their transactions" on public.transactions for select using (
  exists (select 1 from public.restaurants where id = transactions.restaurant_id and user_id = auth.uid())
);

-- Business Directory (unclaimed listings)
create table public.business_directory (
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

  -- Claim status
  is_claimed boolean default false,
  claimed_by_user_id uuid references auth.users(id) on delete set null,
  claimed_restaurant_id uuid references public.restaurants(id) on delete set null,
  claimed_at timestamptz,

  -- Generated default menu (loaded into restaurant on claim)
  default_menu jsonb default '[]',

  created_at timestamptz default now()
);

create index idx_directory_slug on public.business_directory(slug);
create index idx_directory_city on public.business_directory(city);

alter table public.business_directory enable row level security;
create policy "Directory public read" on public.business_directory for select using (true);
create policy "Directory updatable when claiming" on public.business_directory for update using (true);
