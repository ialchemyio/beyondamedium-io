/**
 * One-click AI SEO helpers. Pure and client-safe.
 * Per-page SEO lives at projects.settings.seo = { [pageSlug]: { title, description } }.
 */

export interface PageSeo {
  title: string
  description: string
}

export type SeoMap = Record<string, PageSeo>

/** Google truncates titles around 60 chars and descriptions around 155-160. */
export const SEO_TITLE_MAX = 60
export const SEO_DESC_MAX = 160

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' }

/** Visible text of a page's HTML, for feeding the model. */
export function pageText(html: string, max = 2500): string {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, m => ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

/** Parse the model's reply: a bare array, a fenced array, or { pages: [...] }. */
export function parseSeoJson(text: string): Array<Record<string, unknown>> | null {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.pages)) return parsed.pages
    return null
  } catch {
    return null
  }
}

/** Trim to max chars at a word boundary, adding an ellipsis when cut. */
function clamp(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return base.replace(/[\s,;:.\-–—]+$/, '') + '…'
}

/** Validate model output against the project's real page slugs. */
export function normalizeSeo(entries: Array<Record<string, unknown>>, slugs: string[]): SeoMap {
  const known = new Set(slugs)
  const out: SeoMap = {}
  for (const e of entries) {
    const slug = typeof e.slug === 'string' ? e.slug : ''
    if (!known.has(slug)) continue
    if (typeof e.title !== 'string' || !e.title.trim()) continue
    const description = typeof e.description === 'string' ? e.description : ''
    out[slug] = { title: clamp(e.title, SEO_TITLE_MAX), description: clamp(description, SEO_DESC_MAX) }
  }
  return out
}

export function mergeSeo(existing: SeoMap | undefined, generated: SeoMap): SeoMap {
  return { ...(existing ?? {}), ...generated }
}

/** Read one page's SEO from a project's settings blob. */
export function seoForPage(settings: unknown, slug: string): PageSeo | null {
  const seo = (settings as { seo?: unknown } | null)?.seo
  if (!seo || typeof seo !== 'object') return null
  const entry = (seo as Record<string, unknown>)[slug] as Partial<PageSeo> | undefined
  if (!entry || typeof entry.title !== 'string' || !entry.title.trim()) return null
  return { title: entry.title, description: typeof entry.description === 'string' ? entry.description : '' }
}
