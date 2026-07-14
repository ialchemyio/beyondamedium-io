import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, calculateBamCut, PLANS, planKeyFromPriceId, type PlanKey } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { provisionPlan, addPurchasedCredits } from '@/lib/credits'

// Use service role to bypass RLS for webhook writes
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

type ServiceClient = ReturnType<typeof getServiceClient>

// Record a processed event in `transactions` so Stripe retries are idempotent.
// Ignores duplicate-key errors (the unique stripe_event_id constraint is the guard).
async function recordEvent(
  supabase: ServiceClient,
  eventId: string,
  amountCents: number,
  source: string,
  extra: Record<string, unknown> = {},
) {
  await supabase.from('transactions').insert({
    stripe_event_id: eventId,
    amount_total: amountCents / 100,
    bam_cut: amountCents / 100, // subscription/credit revenue is entirely ours
    client_cut: 0,
    currency: 'usd',
    status: 'completed',
    metadata: { source, ...extra },
  })
}

// Stripe API versions differ on where the billing period lives: older APIs put it
// on the subscription, newer (Basil) on each subscription item. Read both.
function subPeriod(sub: Stripe.Subscription): { start: string | null; end: string | null } {
  const s = sub as unknown as {
    current_period_start?: number; current_period_end?: number
    items?: { data?: Array<{ current_period_start?: number; current_period_end?: number }> }
  }
  const item = s.items?.data?.[0]
  const start = s.current_period_start ?? item?.current_period_start
  const end = s.current_period_end ?? item?.current_period_end
  return {
    start: start ? new Date(start * 1000).toISOString() : null,
    end: end ? new Date(end * 1000).toISOString() : null,
  }
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as unknown as {
    subscription?: string | { id: string }
    parent?: { subscription_details?: { subscription?: string | { id: string } } }
  }
  const raw = inv.subscription ?? inv.parent?.subscription_details?.subscription
  return typeof raw === 'string' ? raw : raw?.id ?? null
}

async function periodFromSubscription(stripe: Stripe, subscriptionId: string | null | undefined) {
  if (!subscriptionId) return { start: null, end: null, sub: null as Stripe.Subscription | null }
  const sub = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription
  const { start, end } = subPeriod(sub)
  return { start, end, sub }
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Idempotency — if we already recorded this event, return early.
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ received: true, idempotent: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id
        const restaurantId = session.metadata?.restaurant_id
        const userId = session.metadata?.userId
        const type = session.metadata?.type

        // ── Restaurant order (Connect) ──
        if (orderId && restaurantId && session.payment_intent) {
          const amountTotal = session.amount_total ?? 0
          const { bamCut, clientCut } = calculateBamCut(amountTotal)
          const { data: restaurant } = await supabase
            .from('restaurants').select('stripe_account_id').eq('id', restaurantId).single()

          await supabase.from('transactions').insert({
            stripe_event_id: event.id,
            stripe_session_id: session.id,
            stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id,
            restaurant_id: restaurantId,
            order_id: orderId,
            amount_total: amountTotal / 100,
            bam_cut: bamCut / 100,
            client_cut: clientCut / 100,
            currency: session.currency || 'usd',
            stripe_account_id: restaurant?.stripe_account_id || null,
            status: 'completed',
            metadata: { source: 'restaurant_order' },
          })
          await supabase.from('restaurant_orders').update({
            status: 'confirmed',
            stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id,
            updated_at: new Date().toISOString(),
          }).eq('id', orderId)
          break
        }

        // ── Credit pack (one-time) ──
        if (userId && type === 'credits') {
          const credits = parseInt(session.metadata?.credits ?? '0', 10)
          if (credits > 0) {
            await addPurchasedCredits(userId, credits, 'credit_pack')
            await recordEvent(supabase, event.id, session.amount_total ?? 0, 'credit_pack', { userId, credits })
          }
          break
        }

        // ── Subscription ──
        if (userId && session.metadata?.plan) {
          const plan = session.metadata.plan as PlanKey
          const planDef = PLANS[plan]
          if (planDef) {
            const { start, end } = await periodFromSubscription(
              stripe, typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
            )
            await provisionPlan({
              userId,
              plan,
              monthlyCredits: planDef.monthlyCredits,
              stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
              stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
              periodStart: start,
              periodEnd: end,
            })
            await recordEvent(supabase, event.id, session.amount_total ?? planDef.price, 'subscription_new', { userId, plan })
          }
        }
        break
      }

      // ── Renewal: refresh the monthly allotment on each successful invoice ──
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = invoiceSubscriptionId(invoice)
        if (!subId || invoice.billing_reason === 'subscription_create') break // create handled above
        const { sub, start, end } = await periodFromSubscription(stripe, subId)
        const userId = sub?.metadata?.userId
        const plan = planKeyFromPriceId(sub?.items.data[0]?.price.id)
        if (userId && plan) {
          await provisionPlan({
            userId, plan, monthlyCredits: PLANS[plan].monthlyCredits,
            stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
            stripeSubscriptionId: subId, periodStart: start, periodEnd: end,
          })
          await recordEvent(supabase, event.id, invoice.amount_paid ?? 0, 'subscription_renewal', { userId, plan })
        }
        break
      }

      // ── Plan change (upgrade/downgrade in portal) ──
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        const plan = planKeyFromPriceId(sub.items.data[0]?.price.id)
        if (userId && plan && sub.status === 'active') {
          const { start, end } = subPeriod(sub)
          await provisionPlan({
            userId, plan, monthlyCredits: PLANS[plan].monthlyCredits,
            stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
            stripeSubscriptionId: sub.id,
            periodStart: start,
            periodEnd: end,
          })
        }
        await recordEvent(supabase, event.id, 0, 'subscription_updated', { userId, plan, status: sub.status })
        break
      }

      // ── Cancellation → downgrade to free starter ──
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId) {
          await provisionPlan({
            userId, plan: 'starter', monthlyCredits: PLANS.starter.monthlyCredits,
            stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
            stripeSubscriptionId: null,
          })
        }
        await recordEvent(supabase, event.id, 0, 'subscription_cancelled', { userId })
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const orderId = intent.metadata?.order_id
        if (orderId) {
          await supabase.from('restaurant_orders').update({ status: 'cancelled' }).eq('id', orderId)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        if (charge.payment_intent) {
          const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent.id
          await supabase.from('restaurant_orders').update({ status: 'refunded' }).eq('stripe_payment_intent_id', piId)
          await supabase.from('transactions').update({ status: 'refunded' }).eq('stripe_payment_intent_id', piId)
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const status = account.charges_enabled && account.payouts_enabled ? 'active'
                     : account.requirements?.disabled_reason ? 'restricted'
                     : 'pending'
        await supabase.from('restaurants').update({
          stripe_account_status: status,
          accepts_orders: status === 'active',
        }).eq('stripe_account_id', account.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Webhook handler failed'
    console.error('Webhook error:', msg, event.type)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
