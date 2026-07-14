import { NextResponse } from 'next/server'
import { getStripe, getPlanPriceId, CREDIT_PACKS, CHECKOUT_PLANS, PLANS, type PlanKey } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getOrInitCredits } from '@/lib/credits'

// Only allow redirects back to our own origins — never trust the Origin header blindly.
const ALLOWED_ORIGINS = new Set([
  'https://beyondamedium.io',
  'https://www.beyondamedium.io',
  'http://localhost:3000',
  'http://localhost:3001',
])
function safeOrigin(request: Request): string {
  const origin = request.headers.get('origin')
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://beyondamedium.io'
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const stripe = getStripe()
    const origin = safeOrigin(request)

    // ── Credit pack (one-time payment) ──────────────────────────────
    // Client sends only a pack index; price + credits come from our catalog.
    if (body.mode === 'credits') {
      const packIndex = Number(body.pack)
      const pack = CREDIT_PACKS[packIndex]
      if (!pack) return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 })

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: pack.price,
            product_data: { name: `${pack.label} — Beyond A Medium` },
          },
        }],
        customer_email: user.email ?? undefined,
        // Server-derived metadata only — the webhook trusts these.
        metadata: { userId: user.id, type: 'credits', credits: String(pack.credits), packIndex: String(packIndex) },
        success_url: `${origin}/dashboard/billing?credits=success`,
        cancel_url: `${origin}/dashboard/billing?credits=cancelled`,
        consent_collection: { terms_of_service: 'required' },
        custom_text: {
          terms_of_service_acceptance: {
            message: `I agree to the [Terms of Service](${origin}/terms) and [Privacy Policy](${origin}/privacy).`,
          },
        },
      })
      return NextResponse.json({ url: session.url })
    }

    // ── Subscription ────────────────────────────────────────────────
    const plan = body.plan as PlanKey
    if (!plan || !CHECKOUT_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Invalid or non-checkoutable plan' }, { status: 400 })
    }
    const priceId = getPlanPriceId(plan)
    if (!priceId) {
      return NextResponse.json({ error: `Plan "${plan}" is not configured for checkout` }, { status: 400 })
    }

    // Reuse the existing Stripe customer if we already have one.
    const credits = await getOrInitCredits(user.id)
    const existingCustomer = credits?.stripe_customer_id ?? undefined

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      ...(existingCustomer ? { customer: existingCustomer } : { customer_email: user.email ?? undefined }),
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
      success_url: `${origin}/dashboard/billing?plan=success`,
      cancel_url: `${origin}/dashboard/billing?plan=cancelled`,
      consent_collection: { terms_of_service: 'required' },
      custom_text: {
        terms_of_service_acceptance: {
          message: `I agree to the [Terms of Service](${origin}/terms) and [Privacy Policy](${origin}/privacy). I understand this is a recurring subscription billed at $${PLANS[plan].price / 100}/mo that auto-renews until I cancel.`,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
