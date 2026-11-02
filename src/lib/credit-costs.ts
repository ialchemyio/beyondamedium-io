// Credit costs per AI action. Kept free of server-only imports (no Stripe SDK)
// so client components and the marketing page can display real prices.
// Starter gets one full Agent build to fall in love, then hits the upgrade wall.
export const CREDIT_COSTS = {
  edit_element: 3,
  generate_section: 5,
  generate_page: 10,
  agent_build: 35,     // The magic — full autonomous multi-page site build
  seo_all_pages: 5,    // One-click AI SEO across every page of a site
} as const
