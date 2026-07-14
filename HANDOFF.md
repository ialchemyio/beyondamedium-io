# HANDOFF — beyondamedium.io

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
