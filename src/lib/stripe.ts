import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeInstance
}

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 0,
    monthlyCredits: 50,
    maxProjects: 1,
    features: ['1 project', '50 AI credits / month', '1 free AI Agent build', 'Core components', 'Hosted BAM site', 'Watermark on published sites', 'Community support'],
  },
  builder: {
    name: 'Builder',
    price: 1900,
    monthlyCredits: 300,
    maxProjects: 5,
    priceId: process.env.STRIPE_BUILDER_PRICE_ID,
    features: ['5 projects', '300 AI credits / month', '8+ AI Agent builds', 'All components', 'Templates marketplace', 'Code export', 'Basic analytics'],
  },
  pro: {
    name: 'Pro',
    price: 3900,
    monthlyCredits: 1500,
    maxProjects: -1,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['Unlimited projects', '1,500 AI credits / month', '40+ AI Agent builds', 'AI agents (full power)', 'Save & reuse templates', 'Advanced analytics', 'Priority AI processing'],
  },
  bam: {
    name: 'BAM',
    price: 9900,
    monthlyCredits: 0,  // Done-for-you service — no AI credits, BAM team handles everything
    maxProjects: -1,
    priceId: process.env.STRIPE_BAM_PRICE_ID,
    features: ['Done-for-you site build by BAM team', 'Custom domain + hosting', 'Website launch & maintenance', 'Paid ads management', 'AI marketing & content', 'SEO & website ranking', 'Dedicated account manager', 'Priority support'],
  },
} as const

export type PlanKey = keyof typeof PLANS

export const CREDIT_PACKS = [
  { credits: 100, price: 1000, label: '100 credits', priceLabel: '$10' },
  { credits: 350, price: 2500, label: '350 credits', priceLabel: '$25' },
  { credits: 1000, price: 6000, label: '1,000 credits', priceLabel: '$60' },
] as const

// Credit costs — Starter gets 1 Agent build to fall in love, then hits
// the upgrade wall fast.
export const CREDIT_COSTS = {
  edit_element: 3,
  generate_section: 5,
  generate_page: 10,
  agent_build: 35,     // The magic — full autonomous multi-page site build
} as const

// BAM takes 14% of every restaurant transaction
export const PLATFORM_FEE_PERCENT = 14
export const PLATFORM_FEE_BPS = 1400 // basis points

export function calculateBamCut(amountCents: number): { bamCut: number; clientCut: number } {
  const bamCut = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100))
  const clientCut = amountCents - bamCut
  return { bamCut, clientCut }
}

export function calculateApplicationFee(amountCents: number): number {
  return Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100))
}
