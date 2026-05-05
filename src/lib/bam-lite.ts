/**
 * BAM Lite Mode — feature flag system
 *
 * When BAM_LITE=true, the platform shows ONLY food ordering features.
 * Hides: Automations, Funnels, A/B testing, Revenue Systems (non-food),
 * advanced builder features.
 *
 * Exposes: Food templates, basic editor, publish, Stripe checkout,
 * orders + revenue analytics.
 */

export const BAM_LITE = process.env.NEXT_PUBLIC_BAM_LITE === 'true'

export const LITE_NAV = [
  { href: '/dashboard/restaurants', label: 'Restaurants' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/revenue', label: 'Revenue' },
  { href: '/app/directory', label: 'Directory' },
] as const

export const FULL_NAV = [
  { href: '/dashboard', label: 'Projects' },
  { href: '/dashboard/templates', label: 'Templates' },
  { href: '/dashboard/premium-templates', label: 'Revenue Systems' },
  { href: '/dashboard/funnels', label: 'Funnels' },
  { href: '/dashboard/automations', label: 'Automations' },
  { href: '/dashboard/domains', label: 'Domains' },
  { href: '/dashboard/analytics', label: 'Analytics' },
] as const

export function getNavItems() {
  return BAM_LITE ? LITE_NAV : FULL_NAV
}
