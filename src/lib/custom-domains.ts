/**
 * Custom domains: pure helpers shared by the Domains page, the request API,
 * and the middleware host router. Client-safe (no server imports).
 *
 * Domains are stored by apex ("harborvine.com"); "www." is routed to the same
 * site. Users request a domain; the BAM team activates it after DNS and the
 * Coolify domain entry are in place (see supabase/migrations/20261102_custom_domains.sql).
 */

const PLATFORM_APEX = 'beyondamedium.io'
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

function stripPort(host: string): string {
  if (host.startsWith('[')) return host.slice(0, host.indexOf(']') + 1) // [::1]:3000 → [::1]
  const i = host.lastIndexOf(':')
  return i > -1 && host.indexOf(':') === i ? host.slice(0, i) : host
}

function isIp(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[') || host.includes(':')
}

/** Clean user input into an apex domain, or explain why it can't be one. */
export function normalizeDomain(input: string): { domain: string } | { error: string } {
  let d = (input || '').trim().toLowerCase()
  d = d.replace(/^[a-z]+:\/\//, '')        // protocol
  d = d.split(/[/?#]/)[0]                   // path, query, hash
  d = stripPort(d).replace(/\.$/, '')       // port, trailing dot
  d = d.replace(/^www\./, '')

  if (!d) return { error: 'Enter a domain, like yourbusiness.com.' }
  if (d === 'localhost' || isIp(d)) return { error: 'Enter a domain name, not an IP address or localhost.' }
  if (d.length > 253) return { error: 'That domain is too long.' }
  const labels = d.split('.')
  if (labels.length < 2) return { error: 'Include the ending, like .com or .co.uk.' }
  if (!labels.every(l => LABEL.test(l))) return { error: 'Domains can only use letters, numbers, and hyphens.' }
  if (!/^[a-z]{2,}$/.test(labels[labels.length - 1])) return { error: 'That domain ending doesn\'t look right.' }
  if (d === PLATFORM_APEX || d.endsWith(`.${PLATFORM_APEX}`)) return { error: 'Use a domain you own, not a beyondamedium.io address.' }
  return { domain: d }
}

/** Key used to look a request's Host up in custom_domains: lowercase, no port, no www. */
export function lookupKey(host: string): string {
  return stripPort(host.trim().toLowerCase()).replace(/\.$/, '').replace(/^www\./, '')
}

/** Hosts that are BAM itself (or local/infra) and must never route to a tenant site. */
export function isPlatformHost(host: string | null | undefined): boolean {
  if (!host) return true
  const h = stripPort(host.trim().toLowerCase())
  if (h === PLATFORM_APEX || h.endsWith(`.${PLATFORM_APEX}`)) return true
  if (h === 'localhost' || h.endsWith('.localhost') || isIp(h)) return true
  const extra = (process.env.PLATFORM_HOSTS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return extra.includes(h)
}

/**
 * Where a request on a tenant's custom domain should be rewritten.
 * Returns null when the path is already the tenant's own published route.
 * Every other path (including BAM app routes like /dashboard) serves the site.
 */
export function customDomainRewrite(slug: string, pathname: string, search: string): string | null {
  const own = `/p/${slug}`
  if (pathname === own || pathname.startsWith(`${own}/`)) return null
  return `${own}${search || ''}`
}
