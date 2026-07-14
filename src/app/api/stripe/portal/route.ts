import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getOrInitCredits } from '@/lib/credits'

const ALLOWED_ORIGINS = new Set([
  'https://beyondamedium.io',
  'https://www.beyondamedium.io',
  'http://localhost:3000',
  'http://localhost:3001',
])

// Opens the Stripe customer portal so users can update/cancel their subscription.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const credits = await getOrInitCredits(user.id)
    const customerId = credits?.stripe_customer_id
    if (!customerId) {
      return NextResponse.json({ error: 'No billing account yet. Upgrade to a paid plan first.' }, { status: 400 })
    }

    const origin = request.headers.get('origin')
    const returnUrl = origin && ALLOWED_ORIGINS.has(origin)
      ? `${origin}/dashboard/billing`
      : 'https://beyondamedium.io/dashboard/billing'

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Portal failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
