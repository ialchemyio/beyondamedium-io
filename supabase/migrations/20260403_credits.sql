-- User credits and billing
create table public.user_credits (
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
create policy "Users can view own credits" on public.user_credits for select using (auth.uid() = user_id);
create policy "Users can insert own credits" on public.user_credits for insert with check (auth.uid() = user_id);
create policy "Users can update own credits" on public.user_credits for update using (auth.uid() = user_id);

-- Credit usage log
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  action text not null,
  description text default '',
  created_at timestamptz default now()
);

alter table public.credit_transactions enable row level security;
create policy "Users can view own transactions" on public.credit_transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.credit_transactions for insert with check (auth.uid() = user_id);
