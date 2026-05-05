import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — claim a directory listing → auto-create restaurant
export async function POST(request: Request) {
  try {
    const { directoryId } = await request.json()
    if (!directoryId) return NextResponse.json({ error: 'directoryId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get directory entry
    const { data: entry } = await supabase.from('business_directory').select('*').eq('id', directoryId).single()
    if (!entry) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (entry.is_claimed) return NextResponse.json({ error: 'Already claimed' }, { status: 400 })

    // Auto-create restaurant
    const { data: restaurant, error } = await supabase.from('restaurants').insert({
      user_id: user.id,
      name: entry.name,
      slug: entry.slug,
      description: entry.description,
      cuisine: entry.cuisine,
      address: entry.address,
      city: entry.city,
      state: entry.state,
      phone: entry.phone,
      email: user.email || '',
      logo: entry.logo,
      hero_image: entry.hero_image,
      is_published: false,
      is_claimed: true,
      accepts_orders: false,
    }).select().single()

    if (error) {
      // Slug might already exist — append random suffix
      const { data: r2, error: e2 } = await supabase.from('restaurants').insert({
        user_id: user.id,
        name: entry.name,
        slug: `${entry.slug}-${Date.now().toString(36).slice(-4)}`,
        description: entry.description,
        cuisine: entry.cuisine,
        address: entry.address,
        city: entry.city,
        state: entry.state,
        phone: entry.phone,
        email: user.email || '',
        is_claimed: true,
      }).select().single()
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
      return await finishClaim(supabase, entry, r2.id, user.id)
    }

    return await finishClaim(supabase, entry, restaurant.id, user.id)
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

async function finishClaim(supabase: Awaited<ReturnType<typeof createClient>>, entry: { id: string; default_menu?: unknown[] }, restaurantId: string, userId: string) {
  // Seed default menu if available
  if (Array.isArray(entry.default_menu) && entry.default_menu.length > 0) {
    await supabase.from('restaurant_menu_items').insert(
      (entry.default_menu as Array<Record<string, unknown>>).map((m, i) => ({
        restaurant_id: restaurantId,
        name: m.name as string,
        description: (m.description as string) ?? '',
        price: Number(m.price) || 0,
        category: (m.category as string) ?? 'Mains',
        sort_order: i,
      }))
    )
  }

  // Mark directory entry as claimed
  await supabase.from('business_directory').update({
    is_claimed: true,
    claimed_by_user_id: userId,
    claimed_restaurant_id: restaurantId,
    claimed_at: new Date().toISOString(),
  }).eq('id', entry.id)

  return NextResponse.json({ restaurantId, success: true })
}
