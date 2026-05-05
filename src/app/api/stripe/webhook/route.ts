import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, calculateBamCut } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role to bypass RLS for webhook writes
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Idempotency check — if we already processed this event, return early
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) {
    console.log(`Event ${event.id} already processed`)
    return NextResponse.json({ received: true, idempotent: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id
        const restaurantId = session.metadata?.restaurant_id

        // Restaurant order
        if (orderId && restaurantId && session.payment_intent) {
          const amountTotal = (session.amount_total ?? 0)
          const { bamCut, clientCut } = calculateBamCut(amountTotal)

          // Get Connect account
          const { data: restaurant } = await supabase
            .from('restaurants').select('stripe_account_id').eq('id', restaurantId).single()

          // Insert transaction (idempotent via unique stripe_event_id)
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

          // Update order status
          await supabase.from('restaurant_orders').update({
            status: 'confirmed',
            stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id,
            updated_at: new Date().toISOString(),
          }).eq('id', orderId)

          console.log(`Restaurant order confirmed: ${orderId} | total=$${amountTotal/100} | bam_cut=$${bamCut/100} | client_cut=$${clientCut/100}`)
        }

        // Subscription (existing flow)
        const userId = session.metadata?.userId
        if (userId && session.metadata?.plan) {
          console.log(`Subscription: user=${userId} plan=${session.metadata.plan}`)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        console.log(`Payment intent succeeded: ${intent.id} amount=$${(intent.amount ?? 0)/100}`)
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
