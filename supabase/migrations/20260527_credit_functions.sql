-- ============================================
-- Atomic credit + plan provisioning functions
-- Fixes the read-then-write race in lib/credits.ts and gives the
-- Stripe webhook a safe, idempotent way to grant plans / credit packs.
-- Safe to run multiple times (create or replace).
-- ============================================

-- Atomically deduct credits under a row lock. Purchased pool first, then monthly.
-- Raises 'insufficient_credits' / 'no_credits_record' which the caller maps to a 402/404.
create or replace function public.deduct_credits(p_user_id uuid, p_amount int, p_action text)
returns public.user_credits
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.user_credits;
  from_purchased int;
  from_monthly int;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into rec from public.user_credits where user_id = p_user_id for update;
  if not found then
    raise exception 'no_credits_record';
  end if;

  if (rec.credits_remaining + rec.credits_purchased) < p_amount then
    raise exception 'insufficient_credits';
  end if;

  from_purchased := least(rec.credits_purchased, p_amount);
  from_monthly := p_amount - from_purchased;

  update public.user_credits
     set credits_purchased = credits_purchased - from_purchased,
         credits_remaining = credits_remaining - from_monthly,
         updated_at = now()
   where user_id = p_user_id
   returning * into rec;

  insert into public.credit_transactions(user_id, amount, action, description)
  values (p_user_id, -p_amount, p_action, 'Used ' || p_amount || ' credits for ' || p_action);

  return rec;
end;
$$;

-- Atomically add purchased (one-time pack) credits.
create or replace function public.add_purchased_credits(p_user_id uuid, p_amount int, p_action text)
returns public.user_credits
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.user_credits;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  -- Ensure a row exists (starter defaults) before topping up.
  insert into public.user_credits (user_id, plan, credits_remaining, credits_monthly, credits_purchased,
                                    current_period_start, current_period_end)
  values (p_user_id, 'starter', 50, 50, 0, now(), now() + interval '1 month')
  on conflict (user_id) do nothing;

  update public.user_credits
     set credits_purchased = credits_purchased + p_amount,
         updated_at = now()
   where user_id = p_user_id
   returning * into rec;

  insert into public.credit_transactions(user_id, amount, action, description)
  values (p_user_id, p_amount, p_action, 'Purchased ' || p_amount || ' credits');

  return rec;
end;
$$;

-- Provision (or refresh) a subscription plan. Sets the monthly allotment,
-- resets remaining to the new monthly, records Stripe identifiers and the
-- billing period. Purchased credits are preserved.
create or replace function public.provision_plan(
  p_user_id uuid,
  p_plan text,
  p_monthly int,
  p_customer text,
  p_subscription text,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns public.user_credits
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.user_credits;
begin
  insert into public.user_credits (user_id, plan, credits_monthly, credits_remaining, credits_purchased,
                                   stripe_customer_id, stripe_subscription_id,
                                   current_period_start, current_period_end)
  values (p_user_id, p_plan, p_monthly, p_monthly, 0,
          p_customer, p_subscription, p_period_start, p_period_end)
  on conflict (user_id) do update
     set plan = excluded.plan,
         credits_monthly = excluded.credits_monthly,
         credits_remaining = excluded.credits_monthly,
         stripe_customer_id = coalesce(excluded.stripe_customer_id, public.user_credits.stripe_customer_id),
         stripe_subscription_id = coalesce(excluded.stripe_subscription_id, public.user_credits.stripe_subscription_id),
         current_period_start = excluded.current_period_start,
         current_period_end = excluded.current_period_end,
         updated_at = now()
   returning * into rec;

  return rec;
end;
$$;

-- Lock down: these run as SECURITY DEFINER, callable only by the service role
-- (webhook / server routes). Revoke from anon/authenticated so clients can't call them.
-- Align the DB column default with the starter allotment (was 5, marketing/code say 50).
alter table public.user_credits alter column credits_remaining set default 50;
alter table public.user_credits alter column credits_monthly set default 50;

revoke all on function public.deduct_credits(uuid, int, text) from anon, authenticated;
revoke all on function public.add_purchased_credits(uuid, int, text) from anon, authenticated;
revoke all on function public.provision_plan(uuid, text, int, text, text, timestamptz, timestamptz) from anon, authenticated;
