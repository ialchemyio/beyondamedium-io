# HANDOFF — beyondamedium.io

## 2026-07-20 — Builder roadmap complete (commit 3f66f3a)

**Goal:** Close the remaining builder gaps vs Squarespace — image uploads, global theme, one-click polish, block search, page reorder.

### WHAT changed
- `supabase/migrations/20260720_storage_assets.sql` (NEW) — `project-assets` bucket, public read, per-user folder write RLS, 10MB + image MIME allowlist.
- `src/lib/theme.ts` (NEW) — `SiteTheme`, 6 presets, `normalizeTheme()`, `themeCss()` (→ `--bam-*` vars + `.bam-btn/.bam-card/.bam-container`), `themeFontUrl()`, `themeHead()`.
- `editor/page.tsx` — Supabase-backed AssetManager + toolbar upload; theme panel (presets/fonts/colors/sliders) live-injected into canvas; Polish button; block search; page up/down reorder.
- `(published)/p/[slug]/page.tsx` — injects `themeHead()` from `projects.settings.theme`, so themes apply to live sites.
- `api/ai/generate/route.ts` — new `polish` mode (preserves content, elevates design, replaces placeholder copy); prompt now optional for polish.

### VERIFIED
- `tsc` clean; `npm run build` passes.
- Theme engine via tsx: presets resolve, CSS vars emitted, multi-word fonts URL-encoded (`Playfair+Display`), `normalizeTheme()` safe against null/partial/garbage.

### STATE / UNVERIFIED
- **REQUIRED:** run `20260720_storage_assets.sql` on the IO DB or uploads fail (added to LAUNCH_CHECKLIST §1).
- UNVERIFIED end-to-end: live image upload round-trip and polish generation (need authed session + live keys). Test after deploy.
- Theme applies via CSS vars + helper classes. Older AI-generated pages using hardcoded inline styles won't follow the theme until regenerated/polished — expected.

### NEXT (candidates)
Per-direction block restyling; drag-and-drop page reorder (currently arrows); asset deletion UI; theme-aware block variants; undo for Polish (currently one-shot — user can Cmd+Z in GrapesJS).

---

## 2026-07-20 — BEYOND DESIGN engine + editor UX (commit 0f50c4e)

**Goal:** Revamp prompt-to-site quality past template-grade; add design-direction picker ("Claude design" → branded BEYOND DESIGN); make the editor friendlier.

### WHAT changed
- `src/lib/beyond-design.ts` (NEW) — 9 design directions (auto + 8 curated), each a full brief (type pairing, palette, spacing, detail language) + shared craft-rules floor. `buildGenerateSystem()` / `buildAgentSystem()`.
- `src/app/api/ai/generate/route.ts` + `ai/agent/route.ts` — old generic system prompts replaced; both accept optional `style` key (unknown → auto).
- `src/app/(app)/dashboard/[projectId]/editor/page.tsx` — BEYOND DESIGN picker in AI sidebar (grid of 9 chips, sends `style`), autosave every 30s when dirty, Cmd/Ctrl+S save shortcut (via `handleSaveRef` to avoid effect re-registration).

### VERIFIED
- `tsc` clean; `npm run build` passes.
- Engine sanity via tsx: all 9 keys resolve; `luxe-dark`/`editorial` briefs present in output; undefined/unknown key → Beyond Auto fallback.

### STATE / UNVERIFIED
- End-to-end generation quality UNVERIFIED — needs an authed session + live ANTHROPIC key. After deploy: open editor → AI panel → pick a direction (e.g. Luxe Dark) → Full Page generate → confirm output follows the direction (fonts/palette) and has no placeholder copy.
- Editor still uses GrapesJS 0.22 with existing custom blocks — untouched.

### NEXT (builder roadmap candidates, not started)
Restyle custom blocks per-direction; block search; image upload to Supabase storage (assets table exists, no upload UI); global theme editor (fonts/colors applied across pages); AI "polish this page" one-click pass; drag-reorder pages.

---

## 2026-07-14 — Week 4 go-live: retain + grow (commit ba928ed)

**Goal:** Transactional email, consent-gated analytics, real analytics data, and sharpen the events-500 diagnosis.

### WHAT changed
- `src/lib/email.ts` (NEW) — Resend via REST (no dep). Templates: welcome, subscription receipt, credit-pack receipt, payment-failed. **Honest no-op when `RESEND_API_KEY` unset** (logs + skips).
- `src/app/api/stripe/webhook/route.ts` — sends receipt on subscription_new + credit_pack; new `invoice.payment_failed` case → dunning email. Looks up email via `auth.admin.getUserById`.
- `src/app/(auth)/auth/callback/route.ts` — welcome email once (flagged in `user_metadata.welcomed_at`).
- `src/components/Analytics.tsx` (NEW) + wired in `layout.tsx` — fires ONLY when `NEXT_PUBLIC_POSTHOG_KEY` set AND analytics cookie consent granted. Closes the "cookie banner gates nothing" finding. Inert otherwise.
- `src/app/(app)/dashboard/analytics/page.tsx` — AI Generations now counts real `credit_transactions` (was `'—'`); static "AI Suggestions" → data-derived "Recommendations".
- `src/app/api/events/route.ts` — logs `error.cause` (undici hides the real DNS/TLS reason).
- `.env.example` — documents Stripe price IDs, webhook secret, RESEND_*, POSTHOG_*.

### VERIFIED
- `tsc` clean; `npm run build` success.
- Email no-op path returns `{ok:false, skipped:true}` without a key (honest, not faked).
- Dev: landing + /refund 200; no PostHog endpoint inlined without a key (analytics inert).
- **UNVERIFIED (no external keys in this env):** actual Resend delivery and actual PostHog capture. Wiring + no-op are verified; live send needs the keys set in Coolify.

### events-500 — sharpened diagnosis (still open)
Local sandbox can't resolve `*.supabase.co` (`getaddrinfo ENOTFOUND`), so ALL local "fetch failed" were sandbox DNS, not bugs. On **prod**: `experiments/assign` SELECTs work ("No variants"), published-page SELECTs work, but `funnel_events` INSERT → `TypeError: fetch failed` (network layer, not Postgres). It's insert-specific + prod-only. The route now logs `error.cause` — **next step: hit `/api/events` on prod, read Coolify logs for the `cause.code` (likely ENOTFOUND/ECONNRESET/UND_ERR), which will name the root cause** (candidate: undici keep-alive/egress on POST).

### NEXT
- Set `RESEND_API_KEY`/`EMAIL_FROM` and `NEXT_PUBLIC_POSTHOG_KEY` in Coolify to activate email + analytics.
- Full paid smoke test once Stripe env + webhook are live: test card → upgrade → credits granted → receipt email → cancel via portal → downgrade.
- Diagnose events-500 from prod logs.

---

## 2026-07-14 — Week 3 go-live: SEO + polish (commit 73be611)

**Goal:** "Get found + look finished" — SEO, error boundaries, refund policy, watermark tier fix, accessibility.

### WHAT changed
- `src/app/layout.tsx` — `metadataBase`, OpenGraph/Twitter/robots metadata, title template.
- `src/app/sitemap.ts`, `src/app/robots.ts` (NEW) — robots disallows app/api/auth/p/r subtrees.
- `src/app/opengraph-image.tsx` (NEW) — dynamic 1200×630 branded PNG via `next/og`.
- `src/app/page.tsx` — JSON-LD (Organization + WebSite + SoftwareApplication w/ plan offers).
- `src/app/error.tsx`, `global-error.tsx`, `not-found.tsx` (NEW) — App Router boundaries.
- `src/app/refund/page.tsx` (NEW) — refund/cancellation policy; linked in `SiteFooter`.
- `src/app/(published)/p/[slug]/page.tsx` — watermark removed for paid plans (service-role plan read).
- `src/app/(auth)/{login,signup}/page.tsx` — `htmlFor`/`id`/`autoComplete`, stronger focus ring.
- `SiteFooter.tsx` — raised low-contrast text toward WCAG AA.

### VERIFIED
- `tsc` clean; `npm run build` success.
- Dev curl: `/sitemap.xml` 200 (xml), `/robots.txt` 200, `/opengraph-image` 200 (image/png), `/refund` 200, bad route → 404 boundary. Landing has `application/ld+json`, `og:title/og:image`, `twitter:card`.

### STATE
- Works: full SEO surface, error boundaries, refund page, tier-gated watermark, associated form labels.
- **events-500 investigated, NOT resolved:** `POST /api/events` returns `TypeError: fetch failed` on BOTH dev and prod — a Node/undici network-layer failure on the `funnel_events` insert (not a Postgres/HTTP error; schema matches insert exactly). SELECTs to the same Supabase host succeed (published-page 404 works), so it's specific to this insert path. Needs prod container logs / Supabase egress check to nail. Not introduced by any of this work.

### NEXT (Week 4 — retain + grow)
Transactional email (Resend: welcome/receipt/dunning), PostHog gated behind the existing cookie consent, real analytics data on the analytics page, and a full paid-checkout smoke test (test card → upgrade → credits → cancel via portal). Also: resolve events-500 with prod logs.

---

## 2026-05-27 — Week 2 go-live: lock down write surface (commit 198d34d)

**Goal:** Close the API attack surface from the audit (P1): unauthenticated writes, price tampering, no rate limiting.

### WHAT changed
- `src/lib/rate-limit.ts` (NEW) — in-memory sliding-window limiter (single Coolify container). Applied: `ai/generate` 30/min/user, `ai/agent` 10/min/user, `events` + `experiments/assign` 120/min/IP.
- `src/lib/api-auth.ts` (NEW) — `requireUser`, `userOwnsProject`, `userOwnsFunnel`.
- `events` GET → auth + funnel ownership; POST → rate-limit + field caps (still public for visitor tracking).
- `experiments` POST/PATCH/DELETE → auth. `experiments/assign` → rate-limit + validation (still public).
- `automations` GET/POST → auth + project ownership.
- `stripe/connect` GET → auth + restaurant ownership (was enumerable).
- `templates/clone` → destination-project ownership + template access (public-or-owned).
- `ai/agent` → project ownership before destructive page delete; refund credits on failure.
- `restaurants/checkout` → **server-side price lookup** from `restaurant_menu_items` (client sends id+qty only). Closes price tampering.
- `supabase/migrations/20260527_tighten_experiment_rls.sql` (NEW) — experiments/variants writes authenticated-only; public SELECT + variant_assignments insert kept.

### VERIFIED
- `tsc --noEmit` clean; `npm run build` success.
- Dev curl (unauth): events GET / experiments POST+DELETE / automations GET / stripe connect GET / templates clone all → **401**. events POST bad eventType → **400**.

### STATE
- Works: all target endpoints now reject unauthenticated writes; restaurant checkout is price-tamper-proof; AI endpoints rate-limited + refund on failure.
- **REQUIRED before prod:** run `supabase/migrations/20260527_tighten_experiment_rls.sql` on IO DB (in addition to the Week 1 `20260527_credit_functions.sql`).
- **PRE-EXISTING BUG (not a regression):** `POST /api/events` returns 500 at the DB insert on live prod (funnel tracking). Validation/auth now run correctly before it. Needs investigation — analytics ingestion may never have worked. Likely a `funnel_events` insert/RLS or schema issue.

### NEXT (Week 3 — SEO + polish)
`sitemap.ts`, `robots.ts`, OG metadata + image, JSON-LD, `metadataBase`/canonical; `error.tsx`/`not-found.tsx`/`global-error.tsx`; refund-policy page; fix watermark tier gating; `htmlFor`/`id` on auth forms; raise low-contrast text to WCAG AA. Then investigate the events-insert 500.

---

## 2026-05-27 — Week 1 go-live: wire monetization + close XSS hole

**Goal:** Make the app able to take money and remove the critical same-origin XSS on published sites (P0 blockers from the full audit).

### WHAT changed (commit 44156ce)
- `supabase/migrations/20260527_credit_functions.sql` (NEW) — atomic Postgres functions `deduct_credits`, `add_purchased_credits`, `provision_plan`; also bumps `user_credits` default 5→50.
- `src/lib/credits.ts` — `deductCredits` now calls the `deduct_credits` RPC (row-locked, race-free). Added `refundCredits`, `addPurchasedCredits`, `provisionPlan`.
- `src/lib/stripe.ts` — added `CHECKOUT_PLANS`, `getPlanPriceId`, `planKeyFromPriceId`.
- `src/app/api/stripe/webhook/route.ts` — provisions plans + grants credit packs on `checkout.session.completed`; handles `invoice.paid` (renewal), `customer.subscription.updated` (plan change), `.deleted` (downgrade). Idempotent via `transactions.stripe_event_id`. Version-tolerant Stripe period accessors (SDK v22 Basil).
- `src/app/api/stripe/checkout/route.ts` — resolves prices server-side from catalog (was trusting client `priceId`); credit packs via inline `price_data`; adds `consent_collection` ToS. Origin allow-list.
- `src/app/api/stripe/portal/route.ts` (NEW) — Stripe customer portal (cancel/manage).
- `src/app/(app)/dashboard/billing/page.tsx` (NEW) — upgrade, buy credits, manage subscription. Added to nav in `(app)/layout.tsx`.
- `src/components/UpgradeModal.tsx` — buttons now call real checkout (were dead).
- `src/app/(published)/p/[slug]/page.tsx` — user HTML/CSS/JS now renders inside a **sandboxed null-origin iframe** (no `allow-same-origin`). Closes stored-XSS against the app session.
- `src/app/api/ai/generate/route.ts` — refunds credits if the Anthropic call fails.

### VERIFIED
- `npx tsc --noEmit` → clean.
- `npm run build` → success; `/dashboard/billing`, `/api/stripe/portal` present.
- Dev server (curl): `/dashboard/billing` → 307 to `/login`; `POST /api/stripe/checkout` unauth → 401; `POST /api/stripe/portal` unauth → 401; `/p/<bad-slug>` → 404; published route confirmed rendering `<iframe sandbox="allow-scripts ...">` WITHOUT `allow-same-origin`.

### STATE
- Works now: subscription + credit-pack checkout flow, webhook provisioning, portal, atomic credits, refund-on-failure, XSS sandbox.
- **REQUIRED before this works in prod:** run `supabase/migrations/20260527_credit_functions.sql` in the **IO** Supabase project (`etlyakyrxrsmzwtcrfbn`) SQL Editor. Without it, `deduct_credits`/`provision_plan` RPCs 404 and AI + billing break.
- Still pending: Stripe webhook endpoint must point at `https://beyondamedium.io/api/stripe/webhook` with events `checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted, charge.refunded, account.updated`; new signing secret into Coolify `STRIPE_WEBHOOK_SECRET`; `STRIPE_BUILDER_PRICE_ID`/`STRIPE_PRO_PRICE_ID` must be set in Coolify. Enable the Stripe **customer portal** in Stripe dashboard settings.

### NEXT (Week 2)
Auth the public-write endpoints (`events`, `experiments`, `experiments/assign`, `automations` GET), server-side price lookup on `restaurants/checkout`, ownership checks on `templates/clone` + `ai/agent`, rate-limit AI endpoints, make `ai/agent` page writes transactional. Then Week 3 SEO (sitemap/robots/OG) + error boundaries.

### CONFLICTS
None with root/project CLAUDE.md.
