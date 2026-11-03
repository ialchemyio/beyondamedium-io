import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// POST — claim a directory listing → auto-create restaurant
// Users cannot update business_directory directly (RLS), so the claim is
// written here with the service role, and only if the row is still unclaimed.
// NOTE: there is still no proof the claimant owns the business; the restaurant
// is created unpublished. Ownership verification is an open product item.
export async function POST(request: Request) {
  try {
    const { directoryId } = await request.json()
    if (!directoryId) return NextResponse.json({ error: 'directoryId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    // Claim first, atomically: the is_claimed=false condition means two
    // concurrent claimers cannot both win.
    const { data: entry } = await service
      .from('business_directory')
      .update({ is_claimed: true, claimed_by_user_id: user.id, claimed_at: new Date().toISOString() })
      .eq('id', directoryId)
      .eq('is_claimed', false)
      .select('*')
      .maybeSingle()
    if (!entry) {
      const { data: exists } = await service.from('business_directory').select('id').eq('id', directoryId).maybeSingle()
      return exists
        ? NextResponse.json({ error: 'Already claimed' }, { status: 400 })
        : NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const base = {
      user_id: user.id,
      name: entry.name,
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
    }

    // Auto-create restaurant (slug might already exist — retry with a suffix)
    let { data: restaurant, error } = await supabase.from('restaurants').insert({ ...base, slug: entry.slug }).select().single()
    if (error) {
      ;({ data: restaurant, error } = await supabase.from('restaurants')
        .insert({ ...base, slug: `${entry.slug}-${Date.now().toString(36).slice(-4)}` }).select().single())
    }
    if (error || !restaurant) {
      // Release the claim so the listing is not stuck claimed with no restaurant.
      await service.from('business_directory')
        .update({ is_claimed: false, claimed_by_user_id: null, claimed_at: null })
        .eq('id', entry.id).eq('claimed_by_user_id', user.id)
      console.error('[directory/claim] restaurant insert failed:', error?.message)
      return NextResponse.json({ error: 'Could not create your restaurant. Please try again.' }, { status: 500 })
    }

    // Seed default menu if available
    if (Array.isArray(entry.default_menu) && entry.default_menu.length > 0) {
      await supabase.from('restaurant_menu_items').insert(
        (entry.default_menu as Array<Record<string, unknown>>).map((m, i) => ({
          restaurant_id: restaurant.id,
          name: m.name as string,
          description: (m.description as string) ?? '',
          price: Number(m.price) || 0,
          category: (m.category as string) ?? 'Mains',
          sort_order: i,
        }))
      )
    }

    await service.from('business_directory').update({ claimed_restaurant_id: restaurant.id }).eq('id', entry.id)

    return NextResponse.json({ restaurantId: restaurant.id, success: true })
  } catch (error: unknown) {
    console.error('[directory/claim] failed:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
