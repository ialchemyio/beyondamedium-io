-- SECURITY (2026-11-02 audit): users could PATCH their own user_credits row
-- through PostgREST with the public anon key + their JWT
-- (e.g. credits_remaining=999999, plan='pro') and forge credit_transactions rows.
-- Every legitimate write already goes through the service role
-- (src/lib/credits.ts getServiceClient) or the security-definer RPCs in
-- 20260527_credit_functions.sql, so users only need SELECT.
-- Idempotent; safe to re-run.

drop policy if exists "Users can insert own credits" on public.user_credits;
drop policy if exists "Users can update own credits" on public.user_credits;
drop policy if exists "Users can insert own transactions" on public.credit_transactions;

-- Belt and braces: even if a permissive policy is re-added later, the roles
-- PostgREST uses cannot write these tables.
revoke insert, update, delete on public.user_credits from anon, authenticated;
revoke insert, update, delete on public.credit_transactions from anon, authenticated;

-- Verify after running (expect only the two "view own" SELECT policies):
--   select tablename, policyname, cmd from pg_policies
--   where tablename in ('user_credits','credit_transactions');
