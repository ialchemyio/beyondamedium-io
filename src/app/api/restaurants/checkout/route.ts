import { NextResponse } from 'next/server'
import { getStripe, calculateApplicationFee } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

interface CartItem {
  id: string
  quantity: number
}

// POST — create Stripe Checkout session with 14% application fee for BAM.
// Prices are looked up server-side from restaurant_menu_items — the client
// only supplies item ids + quantities, never prices.
export async function POST(request: Request) {
  try {
    const { restaurantSlug, items, customer } = await request.json() as {
      restaurantSlug: string
      items: CartItem[]
      customer: { name: string; email: string; phone?: string }
    }

    if (!restaurantSlug || !items?.length || !customer?.email || !customer?.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Normalize + validate the cart shape (ids + positive integer quantities only).
    const cart = items
      .map(i => ({ id: String(i.id), quantity: Math.floor(Number(i.quantity)) }))
      .filter(i => i.id && Number.isFinite(i.quantity) && i.quantity > 0 && i.quantity <= 99)
    if (!cart.length) return NextResponse.json({ error: 'Invalid cart' }, { status: 400 })

    const supabase = await createClient()

    // Get restaurant + verify Connect account active
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, name, slug, stripe_account_id, stripe_account_status, accepts_orders')
      .eq('slug', restaurantSlug)
      .single()

    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    if (!restaurant.stripe_account_id || restaurant.stripe_account_status !== 'active') {
      return NextResponse.json({ error: 'Restaurant is not accepting orders yet' }, { status: 400 })
    }

    // Server-side price lookup — never trust client-supplied prices.
    const itemIds = [...new Set(cart.map(i => i.id))]
    const { data: menuItems } = await supabase
      .from('restaurant_menu_items')
      .select('id, name, price, is_available')
      .eq('restaurant_id', restaurant.id)
      .in('id', itemIds)

    const menuById = new Map((menuItems ?? []).map(m => [m.id, m]))
    // Every cart id must resolve to an available menu item of this restaurant.
    for (const id of itemIds) {
      const m = menuById.get(id)
      if (!m) return NextResponse.json({ error: 'One or more items are unavailable' }, { status: 400 })
      if (m.is_available === false) return NextResponse.json({ error: `"${m.name}" is no longer available` }, { status: 400 })
    }

    // Build authoritative line items from DB prices.
    const lineItems = cart.map(c => {
      const m = menuById.get(c.id)!
      return {
        id: m.id,
        name: m.name,
        unitAmount: Math.round(Number(m.price) * 100),
        quantity: c.quantity,
      }
    })

    const subtotalCents = lineItems.reduce((s, i) => s + i.unitAmount * i.quantity, 0)
    const taxCents = Math.round(subtotalCents * 0.0875) // 8.75% — could be configurable
    const totalCents = subtotalCents + taxCents

    if (totalCents < 50) return NextResponse.json({ error: 'Order total too small' }, { status: 400 })

    const applicationFeeCents = calculateApplicationFee(totalCents)

    // Create order record (pending) with server-priced items.
    const { data: order, error: orderError } = await supabase
      .from('restaurant_orders')
      .insert({
        restaurant_id: restaurant.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || '',
        items: lineItems.map(i => ({ id: i.id, name: i.name, price: i.unitAmount / 100, quantity: i.quantity })),
        subtotal: subtotalCents / 100,
        tax: taxCents / 100,
        total: totalCents / 100,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

    // Create Stripe Checkout session with Connect
    const stripe = getStripe()
    const origin = request.headers.get('origin') || 'https://beyondamedium.io'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customer.email,
      line_items: lineItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.name },
          unit_amount: item.unitAmount,
        },
        quantity: item.quantity,
      })),
      ...(taxCents > 0 ? {
        discounts: [],
      } : {}),
      payment_intent_data: {
        application_fee_amount: applicationFeeCents,
        transfer_data: {
          destination: restaurant.stripe_account_id,
        },
        metadata: {
          restaurant_id: restaurant.id,
          order_id: order.id,
          bam_cut_cents: applicationFeeCents.toString(),
          client_cut_cents: (totalCents - applicationFeeCents).toString(),
        },
      },
      metadata: {
        restaurant_id: restaurant.id,
        order_id: order.id,
        restaurant_slug: restaurant.slug,
      },
      success_url: `${origin}/r/${restaurant.slug}/order/${order.id}?status=success&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/r/${restaurant.slug}?cart=open`,
    })

    // Save session id on order
    await supabase
      .from('restaurant_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url, orderId: order.id })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Checkout failed'
    console.error('Restaurant checkout error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
