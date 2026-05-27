# Migrating beyondamedium.io — Vercel → Coolify (Docker)

This guide walks through deploying the Next.js 16 app to a Coolify server using the Dockerfile in this repo.

## 0. Why we migrated

Vercel was returning **504 Gateway Timeout** on long-running AI requests (Anthropic streams + agent chains can exceed Vercel's serverless function limit on lower tiers). On a Coolify VPS the app runs as a long-lived Node process — no 60s/300s function timeout.

## 1. What changed in the repo

| File | Change |
|---|---|
| `next.config.ts` | `output: 'standalone'`, security headers, ported `vercel.json` rewrites |
| `Dockerfile` | Multi-stage build (deps → builder → runner) using Next.js standalone |
| `.dockerignore` | Excludes `node_modules`, `.next`, `.vercel`, `.env*`, etc. |
| `vercel.json` | Still in repo — Coolify ignores it. Safe to delete after cutover. |

## 2. Prerequisites on the Coolify host

- Coolify v4+ installed and reachable
- A server with at least 2 vCPU / 4 GB RAM (Next + GrapesJS builds are memory-hungry)
- A domain pointed at the server: `beyondamedium.io` and `www.beyondamedium.io` → server IP
- Cloudflare or similar in front (optional but recommended)

## 3. Create the Coolify application

1. **New Resource → Application → Public Repository** (or connect GitHub).
2. Repo: this repo. Branch: `main`.
3. **Build Pack: Dockerfile**. Dockerfile path: `./Dockerfile`.
4. **Port**: `3000`.
5. **Domain**: `beyondamedium.io` (+ `www.beyondamedium.io` as alias).
6. **Health check**: `GET /` on port 3000, already configured in the Dockerfile.

## 4. Environment variables

Set these in Coolify under **Environment Variables**.

> NEXT_PUBLIC_* vars must be marked **"Available at build time"** in Coolify — they get inlined into the JS bundle, and the Dockerfile picks them up as `ARG`s.

### Build-time (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_BAM_LITE
```

### Runtime (server-only secrets)
```
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_BUILDER_PRICE_ID
STRIPE_PRO_PRICE_ID
STRIPE_BAM_PRICE_ID
ANTHROPIC_API_KEY
```

Pull current values from `.env.local` — do **not** commit them. Rotate any key that was ever exposed.

## 5. Stripe webhook

1. Stripe Dashboard → Developers → Webhooks → add endpoint
   `https://beyondamedium.io/api/stripe/webhook`
2. Copy the new signing secret into `STRIPE_WEBHOOK_SECRET` in Coolify.
3. Disable the old Vercel endpoint **after** cutover is verified.

## 6. Supabase

- No data move required — Supabase is already external.
- Add the new Coolify URL to **Authentication → URL Configuration → Site URL & Redirect URLs**:
  - `https://beyondamedium.io/auth/callback`
  - `https://www.beyondamedium.io/auth/callback`

## 7. DNS cutover

1. Deploy on Coolify and verify with the temporary Coolify URL.
2. Lower DNS TTL on `beyondamedium.io` to 60s ~24h ahead.
3. Switch the A / CNAME record from Vercel → Coolify host IP.
4. Watch logs in Coolify; verify `/`, `/login`, `/signup`, `/api/stripe/webhook` (Stripe will retry).
5. After 24h clean traffic, raise TTL back to 3600+ and remove the Vercel project.

## 8. Local test of the Docker build

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -t bam-io .

docker run --rm -p 3000:3000 --env-file .env.local bam-io
```
Open http://localhost:3000.

## 9. Things to verify post-cutover

- [ ] Landing page loads, cookie banner shows
- [ ] `/privacy`, `/terms`, `/cookies` return 200
- [ ] Signup creates a Supabase user
- [ ] Login → dashboard works
- [ ] Stripe checkout returns to `/dashboard?checkout=success`
- [ ] Stripe webhook (use Stripe CLI `stripe trigger`) hits `/api/stripe/webhook` and returns 200
- [ ] AI endpoint streams a response without 504
- [ ] `/sites/<slug>` rewrites still hit the external Vercel sub-sites

## 10. Rollback

Coolify keeps the last working image. Roll back from the Coolify UI, or flip DNS back to Vercel (kept hot for 7 days).
