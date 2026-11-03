/**
 * A same-site path to send someone to after auth, or the fallback.
 * Rejects anything that would leave the site once joined to an origin:
 * `//evil.com`, `/\evil.com`, `@evil.com`, `https://evil.com`.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}

const APP_HOSTS = new Set(['beyondamedium.io', 'www.beyondamedium.io'])

/**
 * The public origin to redirect to. Behind Coolify's proxy `new URL(request.url).origin`
 * is the container's bind address (`https://0.0.0.0:3000`), so read the Host the browser
 * used. Unknown hosts fall back to the main domain so a spoofed Host can't steer redirects.
 */
export function publicOrigin(request: Request): string {
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').split(',')[0].trim().toLowerCase()
  if (APP_HOSTS.has(host)) return `https://${host}`
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return `http://${host}`
  return 'https://beyondamedium.io'
}
