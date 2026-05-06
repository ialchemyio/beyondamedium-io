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
    monthlyCredits: 10,
    maxProjects: 1,
    features: ['1 project', '10 AI credits / month', 'Core components', 'Hosted BAM site', 'Watermark on published sites', 'Community support'],
  },
  builder: {
    name: 'Builder',
    price: 1900,
    monthlyCredits: 100,
    maxProjects: 5,
    priceId: process.env.STRIPE_BUILDER_PRICE_ID,
    features: ['5 projects', '100 AI credits / month', 'All components', 'Basic templates', 'Hosted BAM sites', 'Code export', 'Basic analytics'],
  },
  pro: {
    name: 'Pro',
    price: 3900,
    monthlyCredits: 400,
    maxProjects: -1,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['Unlimited projects', '400 AI credits / month', 'AI agents (limited)', 'Save & reuse templates', 'Advanced analytics', 'Priority AI processing'],
  },
  bam: {
    name: 'BAM',
    price: 9900,
    monthlyCredits: 1000,
    maxProjects: -1,
    priceId: process.env.STRIPE_BAM_PRICE_ID,
    features: ['Everything in Pro', '1000 AI credits / month', 'Client-ready hosted pages', 'Funnel builder', 'Automation workflows', 'Client billing tools', 'Priority support'],
  },
} as const

export type PlanKey = keyof typeof PLANS

export const CREDIT_PACKS = [
  { credits: 50, price: 1000, label: '50 credits', priceLabel: '$10' },
  { credits: 150, price: 2500, label: '150 credits', priceLabel: '$25' },
  { credits: 500, price: 6000, label: '500 credits', priceLabel: '$60' },
] as const

// Credit costs per action
export const CREDIT_COSTS = {
  generate_page: 8,
  generate_section: 2,
  edit_element: 1,
  agent_build: 15,
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
