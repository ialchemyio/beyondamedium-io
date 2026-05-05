import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// POST — start or refresh Stripe Connect onboarding for a restaurant
export async function POST(request: Request) {
  try {
    const { restaurantId } = await request.json()
    if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .eq('user_id', user.id)
      .single()

    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

    const stripe = getStripe()
    const origin = request.headers.get('origin') || 'https://beyondamedium.io'

    let accountId = restaurant.stripe_account_id

    // Create Connect account if missing
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: restaurant.email || user.email || undefined,
        business_type: 'company',
        business_profile: {
          name: restaurant.name,
          mcc: '5812', // Eating places, restaurants
          url: `${origin}/r/${restaurant.slug}`,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          restaurant_id: restaurant.id,
          user_id: user.id,
        },
      })
      accountId = account.id
      await supabase.from('restaurants').update({ stripe_account_id: accountId }).eq('id', restaurantId)
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/restaurants/${restaurantId}?stripe=refresh`,
      return_url: `${origin}/dashboard/restaurants/${restaurantId}?stripe=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url, accountId })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Connect failed'
    console.error('Stripe Connect error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET — check Connect account status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: restaurant } = await supabase.from('restaurants').select('stripe_account_id').eq('id', restaurantId).single()
  if (!restaurant?.stripe_account_id) return NextResponse.json({ status: 'not_connected' })

  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(restaurant.stripe_account_id)

  const status = account.charges_enabled && account.payouts_enabled ? 'active'
                : account.requirements?.disabled_reason ? 'restricted'
                : 'pending'

  await supabase.from('restaurants').update({
    stripe_account_status: status,
    accepts_orders: status === 'active',
  }).eq('id', restaurantId)

  return NextResponse.json({
    status,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  })
}
