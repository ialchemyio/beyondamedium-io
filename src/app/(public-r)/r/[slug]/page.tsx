import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RestaurantClient from './RestaurantClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: r } = await supabase.from('restaurants').select('name, description, cuisine, city').eq('slug', slug).single()
  if (!r) return { title: 'Not Found' }
  return {
    title: `${r.name} — Order Online`,
    description: r.description || `Order ${r.cuisine || 'food'} from ${r.name}${r.city ? ' in ' + r.city : ''}`,
  }
}

export default async function RestaurantPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!restaurant) notFound()

  const { data: menu } = await supabase
    .from('restaurant_menu_items')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('category')
    .order('sort_order')

  return <RestaurantClient restaurant={restaurant} menu={menu ?? []} />
}
