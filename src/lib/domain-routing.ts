/**
 * Server-only: resolve a request Host to the published project slug it should
 * serve. Reads active custom_domains rows with the service role (there is no
 * anonymous read policy) and caches results in memory so the middleware does
 * not query the database on every request. Single Coolify container, so a
 * process-local cache is enough; on failure we serve the normal app.
 */

import { createClient } from '@supabase/supabase-js'
import { lookupKey } from './custom-domains'

const HIT_TTL_MS = 60_000
const MISS_TTL_MS = 30_000
const cache = new Map<string, { slug: string | null; expires: number }>()

let client: ReturnType<typeof createClient> | null = null
function service() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return client
}

export async function resolveCustomDomain(host: string): Promise<string | null> {
  const key = lookupKey(host)
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expires > now) return hit.slug

  let slug: string | null = null
  try {
    const sb = service()
    if (sb) {
      const { data } = await sb
        .from('custom_domains')
        .select('projects!inner(slug, is_published)')
        .eq('domain', key)
        .eq('status', 'active')
        .maybeSingle()
      const project = (data as { projects?: { slug: string; is_published: boolean } } | null)?.projects
      slug = project?.is_published ? project.slug : null
    }
  } catch {
    slug = null // never break the app because the lookup failed
  }

  if (cache.size > 5000) cache.clear()
  cache.set(key, { slug, expires: now + (slug ? HIT_TTL_MS : MISS_TTL_MS) })
  return slug
}
