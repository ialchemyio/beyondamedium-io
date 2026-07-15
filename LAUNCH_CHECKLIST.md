# 🚀 beyondamedium.io — Launch Checklist

Everything left between "code complete" and "taking real money." All code from the
30-day roadmap (Weeks 1–4) is merged to `main` and auto-deploys via Coolify. What
remains is credentialed configuration only — steps I can't do from the codebase.

Work top to bottom. Each box is a discrete action with how to verify it.

---

## 0. Pre-flight (already done ✅)
- [x] App live on Coolify at `beyondamedium.io` + `www` (Cloudflare proxied, Full-strict SSL)
- [x] Supabase IO project (`etlyakyrxrsmzwtcrfbn`) under BeyondAMedium org
- [x] Security headers (HSTS, XFO, XCTO, Referrer-Policy, Permissions-Policy)
- [x] Legal pages live: `/privacy`, `/terms`, `/cookies`, `/refund`
- [x] Cookie consent banner + signup Terms acceptance

---

## 1. Database — run the SQL migrations 🔴 REQUIRED
Supabase → **Beyond A Medium.IO** (`etlyakyrxrsmzwtcrfbn`) → SQL Editor → run each,
in order. Both are idempotent (safe to re-run).

- [ ] `supabase/migrations/20260527_credit_functions.sql`
      → atomic credit RPCs + plan provisioning + column default 5→50
- [ ] `supabase/migrations/20260527_tighten_experiment_rls.sql`
      → experiments/variants writes become authenticated-only

**Verify:** in SQL Editor run
```sql
select proname from pg_proc where proname in ('deduct_credits','add_purchased_credits','provision_plan');
```
Expect all three rows. Without this, billing + AI generation return 500.

---

## 2. Stripe — wire billing 🔴 REQUIRED

### 2a. Products & prices
- [ ] Create recurring prices for **Builder ($19/mo)** and **Pro ($49/mo)** in Stripe
- [ ] Copy their price IDs

### 2b. Coolify env vars (Settings → Environment Variables → runtime)
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (mark **Build Variable**)
- [ ] `STRIPE_BUILDER_PRICE_ID` = `price_...`
- [ ] `STRIPE_PRO_PRICE_ID` = `price_...`
- [ ] `STRIPE_BAM_PRICE_ID` = `price_...` (optional — BAM is contact-sales)
- [ ] `STRIPE_WEBHOOK_SECRET` = from 2c below

### 2c. Webhook endpoint
- [ ] Stripe → Developers → Webhooks → Add endpoint:
      `https://beyondamedium.io/api/stripe/webhook`
- [ ] Select events:
      `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
      `customer.subscription.updated`, `customer.subscription.deleted`,
      `charge.refunded`, `account.updated`, `payment_intent.payment_failed`
- [ ] Copy the signing secret → `STRIPE_WEBHOOK_SECRET` in Coolify → **Redeploy**
- [ ] Disable the old Vercel webhook endpoint (if still present)

### 2d. Customer portal
- [ ] Stripe → Settings → Billing → **Customer portal** → Activate
      (enables cancel/update-card via `/dashboard/billing` "Manage subscription")

**Verify:** see §6 smoke test.

---

## 3. Email (optional — activates transactional email)
Without these, email honestly no-ops (logs + skips, never fakes). With them, welcome
/ receipt / dunning emails send.
- [ ] Coolify: `RESEND_API_KEY` = `re_...`
- [ ] Coolify: `EMAIL_FROM` = `Beyond A Medium <hello@beyondamedium.io>`
- [ ] Resend: verify the sending domain (SPF/DKIM DNS records in Cloudflare)

**Verify:** trigger a signup → confirm → welcome email arrives.

---

## 4. Analytics (optional — activates consent-gated PostHog)
Fires only when a key is set AND the visitor accepts analytics cookies.
- [ ] Coolify: `NEXT_PUBLIC_POSTHOG_KEY` = `phc_...` (mark **Build Variable**)
- [ ] Coolify: `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com` (**Build Variable**)

**Verify:** accept analytics cookies → load a page → event appears in PostHog Live.
Reject cookies → no events fire.

---

## 5. Supabase auth URLs (confirm)
Supabase → Authentication → URL Configuration:
- [ ] Site URL = `https://beyondamedium.io`
- [ ] Redirect URLs include `https://beyondamedium.io/auth/callback` and `https://www.beyondamedium.io/auth/callback`

---

## 6. 🔑 Money smoke test (do this LAST, after §1–§2)
End-to-end with a Stripe **test card** (`4242 4242 4242 4242`, any future date/CVC),
or a real card in live mode you then refund.
- [ ] Sign up / log in → open `/dashboard/billing`
- [ ] Click **Upgrade to Pro** → complete Stripe checkout (Terms checkbox shows)
- [ ] Redirected to `/dashboard/billing?plan=success`; plan flips to **Pro**, credits show **1,500**
- [ ] (if email on) receipt email arrives
- [ ] Buy a **100-credit pack** → credits increase by 100
- [ ] **Manage subscription** → Stripe portal opens → cancel → plan downgrades to Starter
- [ ] Stripe Dashboard → the webhook events all show **200**

---

## 7. Post-launch monitoring (first 48h)
- [ ] Watch Coolify container logs for errors
- [ ] `curl -sI https://beyondamedium.io` → 200, security headers present, no `x-vercel-*`
- [ ] **Diagnose events-500:** hit `POST /api/events` once, then read Coolify logs for the
      `events POST failed: … | cause: <CODE>` line. The `cause` code names the root cause of the
      `funnel_events` insert network failure (funnel/A-B tracking). Fix per that code.
- [ ] Confirm a published site at `/p/<slug>` renders inside the sandboxed iframe

---

## 8. Cleanup (after 7 clean days)
- [ ] Delete the old Vercel project
- [ ] Remove `_vercel` TXT records in Cloudflare
- [ ] Delete `vercel.json` + `.vercel/` from the repo
- [ ] Raise Cloudflare DNS TTL back to normal

---

### Status legend
🔴 REQUIRED to take money · everything else enhances but isn't blocking.

**Minimum to go live and charge:** §1 + §2 + §6.
