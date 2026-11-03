-- SECURITY (2026-11-02 audit, H-2 / H-3 / M-2 / M-3). Idempotent; safe to re-run.
-- Run AFTER deploying the matching code (claim + checkout now write with the
-- service role; refundCredits calls refund_credits and falls back until this runs).

-- ── H-2: experiments/variants writes were `to authenticated using (true)`, so
-- any signed-in user could edit/delete any tenant's tests or point a variant at
-- their own page. Writes now require owning the funnel (funnel_id is text).
-- Public SELECT stays: the /api/experiments/assign route serves logged-out visitors.
create or replace function public.owns_funnel(p_funnel_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.funnels f
    where f.id::text = p_funnel_id and f.user_id = auth.uid()
  )
$$;
revoke all on function public.owns_funnel(text) from public, anon;
grant execute on function public.owns_funnel(text) to authenticated, service_role;

drop policy if exists "Experiments insertable (auth)" on public.experiments;
create policy "Experiments insertable (auth)" on public.experiments
  for insert to authenticated with check (public.owns_funnel(funnel_id));
drop policy if exists "Experiments updatable (auth)" on public.experiments;
create policy "Experiments updatable (auth)" on public.experiments
  for update to authenticated using (public.owns_funnel(funnel_id)) with check (public.owns_funnel(funnel_id));
drop policy if exists "Experiments deletable (auth)" on public.experiments;
create policy "Experiments deletable (auth)" on public.experiments
  for delete to authenticated using (public.owns_funnel(funnel_id));

drop policy if exists "Variants insertable (auth)" on public.variants;
create policy "Variants insertable (auth)" on public.variants
  for insert to authenticated with check (exists (
    select 1 from public.experiments e where e.id = variants.experiment_id and public.owns_funnel(e.funnel_id)));
drop policy if exists "Variants updatable (auth)" on public.variants;
create policy "Variants updatable (auth)" on public.variants
  for update to authenticated using (exists (
    select 1 from public.experiments e where e.id = variants.experiment_id and public.owns_funnel(e.funnel_id)));
drop policy if exists "Variants deletable (auth)" on public.variants;
create policy "Variants deletable (auth)" on public.variants
  for delete to authenticated using (exists (
    select 1 from public.experiments e where e.id = variants.experiment_id and public.owns_funnel(e.funnel_id)));

-- ── H-3: anyone with the anon key could rewrite any directory listing
-- (name/phone/menu prices) or un-claim a claimed one. Claims now run
-- server-side with the service role (src/app/api/directory/claim/route.ts).
drop policy if exists "Directory updatable when claiming" on public.business_directory;
revoke insert, update, delete on public.business_directory from anon, authenticated;

-- ── M-3: anon could insert fake revenue rows and spam orders straight through
-- PostgREST. The Stripe webhook and checkout route write with the service role.
drop policy if exists "Transactions insertable" on public.transactions;
revoke insert, update, delete on public.transactions from anon, authenticated;
drop policy if exists "Orders insertable publicly" on public.restaurant_orders;
revoke insert, delete on public.restaurant_orders from anon, authenticated;

-- ── M-2: refundCredits read the balance then wrote balance + amount, so a
-- concurrent deduction could be overwritten. Atomic increment instead.
create or replace function public.refund_credits(p_user_id uuid, p_amount int, p_action text)
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
  update public.user_credits
     set credits_remaining = credits_remaining + p_amount,
         updated_at = now()
   where user_id = p_user_id
   returning * into rec;
  if not found then
    raise exception 'no_credits_record';
  end if;
  insert into public.credit_transactions(user_id, amount, action, description)
  values (p_user_id, p_amount, 'refund_' || p_action, 'Refunded ' || p_amount || ' credits (' || p_action || ' failed)');
  return rec;
end;
$$;
revoke all on function public.refund_credits(uuid, int, text) from public, anon, authenticated;
grant execute on function public.refund_credits(uuid, int, text) to service_role;

-- Verify:
--   select tablename, policyname, cmd, roles from pg_policies
--   where tablename in ('experiments','variants','business_directory','transactions','restaurant_orders');
