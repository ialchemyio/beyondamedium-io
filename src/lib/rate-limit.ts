/**
 * Lightweight in-memory sliding-window rate limiter.
 * Fine for the single long-running Coolify container. If the app is ever
 * scaled to multiple instances, swap the Map for Redis/Upstash.
 */

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

// Opportunistic cleanup so the Map can't grow unbounded.
let lastSweep = 0
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, b] of buckets) if (b.resetAt < now) buckets.delete(key)
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * @param key     unique caller identity (userId or IP + route)
 * @param limit   max requests allowed per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = timeNow()): RateLimitResult {
  sweep(now)
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000) }
  }
  b.count++
  return { ok: true, remaining: limit - b.count, retryAfterSeconds: 0 }
}

// Date.now() is deterministic-unsafe in workflow scripts but fine in a server route.
function timeNow(): number {
  return Date.now()
}

/**
 * Best-effort client IP from proxy headers (Cloudflare / standard).
 */
export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
