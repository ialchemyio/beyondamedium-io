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
    monthlyCredits: 5,
    maxProjects: 1,
    features: ['1 project', '5 AI credits / month', 'Core components', 'Hosted BAM site', 'Watermark on published sites', 'Community support'],
  },
  builder: {
    name: 'Builder',
    price: 1900,
    monthlyCredits: 50,
    maxProjects: 5,
    priceId: process.env.STRIPE_BUILDER_PRICE_ID,
    features: ['5 projects', '50 AI credits / month', 'All components', 'Basic templates', 'Hosted BAM sites', 'Code export', 'Basic analytics'],
  },
  pro: {
    name: 'Pro',
    price: 3900,
    monthlyCredits: 200,
    maxProjects: -1,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['Unlimited projects', '200 AI credits / month', 'AI agents (limited)', 'Save & reuse templates', 'Advanced analytics', 'Priority AI processing'],
  },
  bam: {
    name: 'BAM',
    price: 9900,
    monthlyCredits: 500,
    maxProjects: -1,
    priceId: process.env.STRIPE_BAM_PRICE_ID,
    features: ['Everything in Pro', 'Client-ready hosted pages', 'Funnel builder', 'Automation workflows', 'Client billing tools', 'CRM-lite system', 'Priority support', 'Higher AI limits'],
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

export const PLATFORM_FEE_PERCENT = 14
