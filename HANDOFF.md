# HANDOFF — beyondamedium.io

## 2026-11-02 — Plan project limits enforced (commit 0b1107d, not pushed)

**Goal:** Close the revenue leak where `PLANS.maxProjects` (Starter 1 / Builder 5 / Pro+BAM unlimited) was advertised but never enforced.

### WHAT changed
- `supabase/migrations/20261102_project_limits.sql` (NEW): `plan_project_limit()`, `my_project_quota()` (auth.uid only), trigger `projects_enforce_limit` with per-user advisory lock; service role bypasses; existing over-limit users grandfathered.
- `src/lib/project-limits.ts` + test (4 tests incl. SQL↔`PLANS` drift check).
- `api/ai/agent`: quota pre-check before charging credits; refund on failed project insert (was losing 35 credits).
- Dashboard, wizard, templates, premium-templates: quota chip/banners, limit → upgrade modal (reason `projects`), premium no longer fails silently.

### VERIFIED
- Throwaway local Postgres 16, migration applied unchanged twice: starter 1/blocked, builder 5/blocked, pro 12+, service_role bypass, over-limit blocked, quota fn correct; concurrent race → 1 row (control without lock → 2). Server stopped + deleted.
- At-limit UI in browser via temporary stubbed harness (deleted): chip, banners, Blank project → `bam:show-upgrade {reason:'projects'}`, no create form.
- 40/40 tests, tsc clean, `next build` exit 0.

### STATE
- **REQUIRED to activate:** run `20261102_project_limits.sql` in the IO Supabase SQL editor (added to LAUNCH_CHECKLIST §1). Until then the code is inert (quota RPC missing → never blocks), so deploying first is safe.
- UNVERIFIED on real Supabase (DNS-blocked here): `auth.role()` returning `authenticated` for browser/SSR clients is standard Supabase behavior but untested live.

### NEXT
Push, run the migration, then on prod as a Starter account with 1 project: click Blank project (expect upgrade modal) and open the wizard (expect the limit banner).

---

## 2026-11-01 — Snapps-grade upgrade: premium redesign, AI Site Wizard, one-click AI SEO, AI copywriting

**Goal:** Bring BAM builder to the look and feature set of snapps.ai (owner request: "FULL UPGRADE … similar build and premium look").

### WHAT changed (4 commits, pushed + deployed 2026-11-02 as 37ee606)
- `369c3a3` brand — `src/app/globals.css` design tokens (near-black, BAM Blue `#1f8fff`, violet, Inter Tight via `layout.tsx`) + `.bam-pill/.bam-glow-card/.bam-glass/.bam-selected/.bam-tilt` utilities; `src/app/page.tsx` landing rebuilt (3D CSS editor mockup, feature cards, how-it-works, direction previews, pricing, FAQ + FAQPage JSON-LD); `src/lib/credit-costs.ts` (client-safe `CREDIT_COSTS`, re-exported from `lib/stripe.ts`); cookie banner + footer contrast fixes.
- `e14f9ef` wizard — `src/app/(app)/dashboard/new/page.tsx` (5-step AI Site Wizard), `src/lib/site-brief.ts` (+7 tests), `src/lib/direction-previews.ts`; dashboard restyled, old fake-progress agent box removed; app header restyled with "Build with AI".
- `e280d15` SEO — `POST /api/ai/seo` (`src/app/api/ai/seo/route.ts`), `src/lib/seo.ts` (+9 tests), editor SEO panel, published `/p/[slug]` `generateMetadata` uses per-page SEO from `projects.settings.seo`.
- `05b8c3c` copy — editor "Copy" AI mode (6 one-click rewrites + free-form); fixed Edit mode charging credits with nothing selected.

### WHY
Snapps' pitch is AI site generation wizard + AI copywriting + one-click AI SEO + premium dark/electric-blue look. BAM had the generation engine but no guided flow, no SEO, a dated landing page, and a fake progress list.

### VERIFIED
- `npm test` → 36 pass / 0 fail. `npx tsc --noEmit` clean. `npm run build` → compiled; `/`, `/dashboard/new`, `/api/ai/seo` in route table.
- Landing rendered in browser at 1440 and 375 px; mobile overflow bug found and fixed (0 text nodes overflow at 375).
- `impeccable detect` on rendered landing (1280 + 390 px): 0 contrast / undersized-text findings (was 41). Remaining findings are deliberate snapps signature (glow, gradient text, spotlight cards, blue/violet) + pre-existing Geist body font.
- Wizard walked end-to-end via a temporary harness route (deleted, never committed): empty-name validation, 2-page cap, direction select, review, real `POST /api/ai/agent` → 401 → error screen.
- `curl` `/api/ai/seo`: no body / bad type → 400, no session → 401, GET → 405.
- Editor detector findings unchanged vs. before the session.
- `curl -sI https://beyondamedium.io` → 200 (pre-push baseline).

### UNVERIFIED
Wizard success screen, live SEO generation, live copy rewrite: all need an authenticated Supabase session, and this machine cannot reach `*.supabase.co` (DNS). Test on prod after deploy.

### STATE / KNOWN ISSUES (found, not fixed)
- **Revenue leak:** `PLANS[*].maxProjects` is never enforced anywhere; Starter users can create unlimited projects. Needs a server-side check (DB trigger or API).
- **Stale domains page:** `dashboard/domains` tells users to CNAME to `cname.vercel-dns.com`, wrong since the Coolify move. Landing page no longer advertises self-serve custom domains.
- No AI image generator (snapps has one); not built because no image provider key exists. Do not fake it.

### DEPLOYED (verified 2026-11-02)
- Pushed `c9c6afa..37ee606` (includes `53ec569`). New landing live ~120s after push.
- Prod: `/`, `/login`, `/signup`, `/privacy`, `/terms`, `/refund`, `/cookies` → 200; `/dashboard`, `/dashboard/new` → 307 to login; bad `/p/` slug → 404.
- `POST /api/ai/seo`: `{}` → 400, valid id with no session → 401 on 5 consecutive requests (during the rolling update one request briefly hit the old container and got a 404; it settled).
- Live HTML carries the Inter Tight font variable and `bam-pill`; browser screenshot of prod hero; no console errors.

### NEXT
Logged in on prod: run the wizard once, generate SEO on the result, and view `/p/<slug>` source for the new `<title>`/meta. Then fix the `maxProjects` revenue leak.

### CONFLICTS
Root CLAUDE.md §10 / impeccable flags gradient text + glow as AI tells; owner explicitly requested the snapps look, which is built on them. Followed the owner; contrast/size rules still enforced.

---

## 2026-10-30 — BEYOND DESIGN no longer tells the model to invent social proof

**Goal:** Stop every AI-generated customer site shipping fabricated testimonials, names, and prices (root CLAUDE.md §5b item 6).

### WHY
`CRAFT_RULES` in `src/lib/beyond-design.ts` said "Invent a plausible brand voice: names, prices, menu items, testimonials with full names and roles." Both `buildGenerateSystem` (`/api/ai/generate`) and `buildAgentSystem` (`/api/ai/agent`) include it, so all generated sites had fake social proof.

### WHAT changed
- `src/lib/beyond-design.ts`: replaced that line. Facts must now come from the user's request. A new NEVER INVENT rule bans invented reviews, testimonials, ratings, customer names, client logos, prices, awards, certifications and stats. Where that content is missing, the model emits visible bracket placeholders such as `[Testimonial: add a real customer quote]` and `[Price]`. The other craft rules are unchanged.
- `src/lib/beyond-design.test.ts` (new): the repo's first test. It checks both builders across the default and all 8 directions (20 cases). The prompt must not contain "testimonials with full names" or "invent a plausible". It must contain the never-invent rule and the placeholder examples.
- `package.json`: added `"test": "tsx --test 'src/**/*.test.ts'"`. It uses Node's built-in runner and the existing `tsx`, so there is no new dependency.

### VERIFIED
- `npm test`: tests 20, pass 20, fail 0.
- `npx eslint src/lib/beyond-design.ts src/lib/beyond-design.test.ts`: clean. `npx tsc --noEmit`: exit 0.
- `npm run lint` (whole repo) still reports 66 problems (18 errors). All are in files this change did not touch (dashboard pages, CookieBanner, etc.).
- Generated output was not tested with a live Anthropic call: **UNVERIFIED** that the model now emits the placeholders.
- Committed only. Not pushed: a push to `main` auto-deploys via Coolify.

### STATE / NEXT
- In `src/app/api/ai/generate/route.ts`, the default page prompt still lists a "Testimonials or social proof" section. Under the new system rule that section should come out as placeholders. Polish mode still says "specific, plausible copy". The system rule should override both, but aligning those two user prompts is the next small step.
- Push to `origin/main` (owner action, since it deploys), then generate one restaurant site and check that it contains `[Testimonial` and no invented full names.

## 2026-10-20 — /sites/carlosnunez now 308s to carlosnunez.ai (commit f8bd060)

**Goal:** Stop https://beyondamedium.io/sites/carlosnunez serving a stale copy of carlosnunez.ai.

### WHY
`next.config.ts` rewrote `/sites/carlosnunez` to `https://carlos-nunez-portfolio.vercel.app/sites/carlosnunez`, an old Vercel deployment of the portfolio. That copy still showed "Brands Served" and the invented "Nike Running" sample case study, which the owner retracted from the real site. It had no canonical and no noindex, so it could be indexed as duplicate content. The real site is now carlosnunez.ai on Coolify, so the hub now redirects instead of proxying.

### WHAT changed
- `next.config.ts`: removed `carlosnunez` from `subSiteRewrites`; added a `movedSites` list and `redirects()`. `/sites/carlosnunez` goes to `https://carlosnunez.ai` and `/sites/carlosnunez/:path*` goes to `https://carlosnunez.ai/:path*`, both `permanent: true` (308). Redirects run before the `beforeFiles` rewrites. To retire another proxied site later, move its row from `subSiteRewrites` to `movedSites`.
- `vercel.json`: removed the two carlosnunez rewrites and added the same two redirects, so the legacy Vercel project (`beyondamedium-io.vercel.app`) agrees if it still builds from `main`.
- Path is preserved on purpose: `/about`, `/contact`, `/work`, `/systems/*` exist on carlosnunez.ai (200). `/work/elevate-nike-running` lands on carlosnunez.ai's 404, the honest result for a retracted case study. `/lab` and `/ai-lab` are 308'd onward to `/kit` by carlosnunez.ai itself.
- Pushed to `origin/main` (57d5dee..f8bd060). The documented deploy path is a Coolify auto-deploy on push to `main` (`LAUNCH_CHECKLIST.md`, line 4).

### VERIFIED (local)
- `npm run build`: passes. `npx eslint next.config.ts`: clean. `npx tsc --noEmit`: exit 0. `vercel.json` parses (2 redirects, 16 rewrites, 0 carlosnunez rewrites).
- Standalone server (`PORT=3099 node .next/standalone/server.js`):
  - `/sites/carlosnunez` returns **308** with `location: https://carlosnunez.ai/`.
  - `/sites/carlosnunez/about` returns **308** with `location: https://carlosnunez.ai/about`.
  - `/sites/carlosnunez/` returns 308 to `/sites/carlosnunez`, then the same chain.
  - Regression check: `/sites/djsammyjay` and `/sites/JGFamilyRoofing` still return 200 through the proxy (`x-vercel-id` present).
  - `curl -sL .../sites/carlosnunez | grep -c "Nike Running"` returns 0.

### VERIFIED (live, 2026-10-21 UTC)
- Before the push: `curl -sI https://beyondamedium.io/sites/carlosnunez` returned **HTTP/2 200** with `x-vercel-id`. `grep -c "Nike Running"` returned 1 and `grep -c "Brands Served"` returned 1.
- Pushed at 02:53:35 UTC. Coolify served the first 308 at 02:55:44. The deploy is rolling, so 200 and 308 alternated for about 40 s. The URL then returned 308 on 10 consecutive requests by 02:56:26.
- After the push: `curl -sI https://beyondamedium.io/sites/carlosnunez` returns **HTTP/2 308** with `location: https://carlosnunez.ai/` and no `x-vercel-*` headers. `grep -c "Nike Running"` returns **0** and `grep -c "Brands Served"` returns **0**. 10 more samples were all 308.
- Subpaths: `/sites/carlosnunez/about` returns 308 to `https://carlosnunez.ai/about`.
- No regressions: `/sites/djsammyjay`, `/sites/JGFamilyRoofing`, `/sites/lumpiaandmore`, `/`, `/login` and `/robots.txt` all return 200.
- The legacy Vercel project still builds from `main`. `https://beyondamedium-io.vercel.app/sites/carlosnunez` now also returns 308 to `https://carlosnunez.ai/` (from the `vercel.json` change).

### STATE
- Fixed: the stale copy is no longer reachable through beyondamedium.io or beyondamedium-io.vercel.app.
- **Still public (owner action, not done):** the upstream itself, `https://carlos-nunez-portfolio.vercel.app/sites/carlosnunez`, returns 200 with the stale copy (`server: Vercel`). Nothing links to it now, but it is still crawlable. This repo can't fix it; the user rules for this session also say don't edit carlos-nunez-portfolio.

### OWNER STEPS (Vercel dashboard, not performed by the agent)
carlosnunez.ai is served from Coolify. Its responses carry no `x-vercel-*` headers, so the old Vercel project is not in its serving path.
1. Vercel → open the same team as the beyondamedium-io project (org id `team_oYaAUG7u8f5hhSn8TG79tx9q`, per both repos' `.vercel/project.json`) → project **carlos-nunez-portfolio** (`prj_Vq6yMSxFKvfqfHgz2Aaja5nZ8XVf`) → **Settings → Domains**. Confirm `carlosnunez.ai` is NOT listed. If it is listed, stop and ask before going further.
2. Same project → **Settings → General → Delete Project** (bottom of the page). Type the project name to confirm.
   - Alternative if you want to keep it: **Settings → Deployment Protection → Vercel Authentication → All Deployments** (a `.vercel.app` production URL is public by default).
3. Verify: `curl -s -o /dev/null -w "%{http_code}\n" https://carlos-nunez-portfolio.vercel.app/sites/carlosnunez` should return 404 (deleted) or 401/302 to Vercel login (protected).
4. Optional, for speed: in Google Search Console for beyondamedium.io, use Removals → Temporary removal on the `https://beyondamedium.io/sites/carlosnunez` prefix. The 308 will de-index it on its own over time.
5. Separate, already on `LAUNCH_CHECKLIST.md` §8: the legacy **beyondamedium-io** Vercel project still auto-builds on every push to `main` (confirmed today). Deleting it, then removing `vercel.json` and `.vercel/`, would end the duplicated rewrite list.

### CONFLICTS
None with the root CLAUDE.md. The push follows the documented deploy path (LAUNCH_CHECKLIST.md: `main` auto-deploys via Coolify).

### NEXT
Owner: do step 1–3 above to remove the last public stale copy. Agent follow-up: run the same check on the other 8 proxied `/sites/*` targets. For each, does the client now have its own domain while the hub still proxies an old Vercel copy? (`curl -s https://beyondamedium.io/sites/<slug> | head` vs the client's live domain.)

---

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
