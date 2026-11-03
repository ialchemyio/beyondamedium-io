/**
 * A same-site path to send someone to after auth, or the fallback.
 * Rejects anything that would leave the site once joined to an origin:
 * `//evil.com`, `/\evil.com`, `@evil.com`, `https://evil.com`.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
