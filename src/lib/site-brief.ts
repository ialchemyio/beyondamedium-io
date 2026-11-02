/**
 * The AI Site Wizard's answers → the prompt sent to the BEYOND DESIGN agent.
 * Pure and client-safe. Only facts the owner supplied go into the prompt;
 * empty fields are left out so the agent has nothing to embellish.
 */

export interface SiteBrief {
  name: string
  industry: string
  location: string
  offer: string
  audience: string
  services: string[]
  phone: string
  email: string
  address: string
  hours: string
  /** Pages in addition to Home. */
  pages: string[]
}

/** The agent builds 1-3 pages, so Home + at most two more. */
export const MAX_EXTRA_PAGES = 2

export const PAGE_OPTIONS = ['About', 'Services', 'Menu', 'Pricing', 'Gallery', 'Contact', 'Book', 'FAQ'] as const

export const INDUSTRY_OPTIONS = [
  'Restaurant', 'Cafe', 'Salon / Barber', 'Fitness', 'Contractor', 'Real estate',
  'Photographer', 'Consultant', 'Nonprofit', 'Online store', 'Agency', 'Medical / Dental',
] as const

export const EMPTY_BRIEF: SiteBrief = {
  name: '', industry: '', location: '', offer: '', audience: '',
  services: [], phone: '', email: '', address: '', hours: '', pages: ['About', 'Contact'],
}

const clip = (s: string, max: number) => s.trim().replace(/\s+/g, ' ').slice(0, max)

export function validateBrief(b: SiteBrief): string[] {
  const errors: string[] = []
  if (!b.name.trim()) errors.push('Add your business name.')
  if (!b.offer.trim()) errors.push('Tell us what your business offers.')
  if (b.pages.length > MAX_EXTRA_PAGES) errors.push(`Choose up to ${MAX_EXTRA_PAGES} pages besides Home.`)
  return errors
}

export function buildSitePrompt(b: SiteBrief): string {
  const name = clip(b.name, 80)
  const services = b.services.map(s => clip(s, 80)).filter(Boolean).slice(0, 12)
  const pages = ['Home', ...b.pages.slice(0, MAX_EXTRA_PAGES)]

  const facts: string[] = [`Business name: ${name}`]
  if (b.industry.trim()) facts.push(`Type of business: ${clip(b.industry, 60)}`)
  if (b.location.trim()) facts.push(`Location: ${clip(b.location, 100)}`)
  facts.push(`What it offers: ${clip(b.offer, 900)}`)
  if (b.audience.trim()) facts.push(`Audience: ${clip(b.audience, 300)}`)
  if (services.length) facts.push(`Services / offerings:\n${services.map(s => `- ${s}`).join('\n')}`)
  if (b.phone.trim()) facts.push(`Phone: ${clip(b.phone, 40)}`)
  if (b.email.trim()) facts.push(`Email: ${clip(b.email, 120)}`)
  if (b.address.trim()) facts.push(`Address: ${clip(b.address, 200)}`)
  if (b.hours.trim()) facts.push(`Hours: ${clip(b.hours, 200)}`)

  return `Build the website for this business.

${facts.join('\n')}

Pages to build, in this order: ${pages.join(', ')}.
Set projectName to "${name}" exactly, and use it as the brand name on every page.

These are the only facts about the business. Do not invent anything beyond them: no prices,
reviews, testimonials, team members, awards, or statistics that are not listed above. Where such
content belongs, leave a clearly marked bracketed placeholder for the owner to fill in.`
}
