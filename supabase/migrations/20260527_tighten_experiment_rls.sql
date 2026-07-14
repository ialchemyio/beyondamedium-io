-- ============================================
-- Tighten RLS on the experiment tables.
-- Previously experiments/variants allowed INSERT/UPDATE/DELETE with `using(true)`,
-- meaning anyone holding the public anon key could mutate them directly against
-- Supabase (bypassing our API routes). We keep public SELECT (needed to serve
-- A/B tests to anonymous visitors) and public INSERT on variant_assignments
-- (assignment happens for logged-out visitors), but require an authenticated
-- session for all experiment/variant mutations.
-- Idempotent.
-- ============================================

-- experiments: public read (serve tests), authenticated-only writes.
drop policy if exists "Experiments insertable" on public.experiments;
drop policy if exists "Experiments updatable" on public.experiments;
drop policy if exists "Experiments deletable" on public.experiments;
create policy "Experiments insertable (auth)" on public.experiments
  for insert to authenticated with check (true);
create policy "Experiments updatable (auth)" on public.experiments
  for update to authenticated using (true);
create policy "Experiments deletable (auth)" on public.experiments
  for delete to authenticated using (true);

-- variants: same posture.
drop policy if exists "Variants insertable" on public.variants;
drop policy if exists "Variants updatable" on public.variants;
drop policy if exists "Variants deletable" on public.variants;
create policy "Variants insertable (auth)" on public.variants
  for insert to authenticated with check (true);
create policy "Variants updatable (auth)" on public.variants
  for update to authenticated using (true);
create policy "Variants deletable (auth)" on public.variants
  for delete to authenticated using (true);

-- variant_assignments: INSERT + SELECT stay public (anonymous visitors get
-- assigned and we read back their existing assignment), but block UPDATE/DELETE
-- so assignments can't be tampered with. (No prior update/delete policy existed,
-- but make the intent explicit and revoke any that appear.)
drop policy if exists "Assignments updatable" on public.variant_assignments;
drop policy if exists "Assignments deletable" on public.variant_assignments;
