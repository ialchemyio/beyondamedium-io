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
  free: { name: 'Starter', price: 0, projects: 1, aiGenerations: 10 },
  pro: { name: 'Pro', price: 2900, projects: -1, aiGenerations: -1, priceId: process.env.STRIPE_PRO_PRICE_ID },
  agency: { name: 'Agency', price: 7900, projects: -1, aiGenerations: -1, priceId: process.env.STRIPE_AGENCY_PRICE_ID },
} as const

export type PlanKey = keyof typeof PLANS

export const PLATFORM_FEE_PERCENT = 14 // BAM takes 14% of client transactions
