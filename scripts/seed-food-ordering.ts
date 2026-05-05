/**
 * BAM OS — Seed Lumpia & More example + directory entries
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const LUMPIA_USER_ID = '7aee1ca8-626b-4c14-89ff-50cc86ae54e1' // beyondamedium@gmail.com

const LUMPIA_MORE = {
  user_id: LUMPIA_USER_ID,
  name: 'Lumpia & More',
  slug: 'lumpia-and-more',
  description: 'Authentic Filipino lumpia, lechon, and homestyle favorites. Family-owned in Santa Paula since 2018.',
  cuisine: 'Filipino',
  address: '423 E Main St',
  city: 'Santa Paula',
  state: 'CA',
  phone: '(805) 555-0142',
  email: 'orders@lumpiaandmore.com',
  primary_color: '#dc2626',
  is_published: true,
  is_claimed: true,
  accepts_orders: false, // Only true once Stripe Connect completed
  stripe_account_status: 'pending',
}

const MENU = [
  { name: 'Classic Pork Lumpia (10pc)', description: 'Crispy hand-rolled pork & vegetable spring rolls with sweet chili sauce', price: 12.99, category: 'Starters', sort_order: 0 },
  { name: 'Shanghai Lumpia (10pc)', description: 'Mini pork lumpia with garlic vinegar dip', price: 11.99, category: 'Starters', sort_order: 1 },
  { name: 'Vegetable Lumpia (10pc)', description: 'Cabbage, carrots, jicama — vegetarian', price: 10.99, category: 'Starters', sort_order: 2 },
  { name: 'Lechon Kawali Plate', description: 'Crispy pork belly, garlic rice, atchara', price: 17.99, category: 'Mains', sort_order: 3 },
  { name: 'Chicken Adobo', description: 'Slow-braised chicken in soy-vinegar sauce, served with rice', price: 15.99, category: 'Mains', sort_order: 4 },
  { name: 'Pancit Bihon', description: 'Stir-fried rice noodles with shrimp, chicken, and vegetables', price: 14.99, category: 'Mains', sort_order: 5 },
  { name: 'Sinigang na Baboy', description: 'Tamarind-based pork sour soup with veggies', price: 16.99, category: 'Mains', sort_order: 6 },
  { name: 'Kare-Kare', description: 'Oxtail in peanut sauce with bagoong', price: 19.99, category: 'Mains', sort_order: 7 },
  { name: 'Garlic Fried Rice', description: 'Side', price: 4.99, category: 'Sides', sort_order: 8 },
  { name: 'Atchara', description: 'Pickled green papaya', price: 3.99, category: 'Sides', sort_order: 9 },
  { name: 'Halo-Halo', description: 'Mixed shaved ice dessert with leche flan, ube, and beans', price: 8.99, category: 'Desserts', sort_order: 10 },
  { name: 'Buko Pandan', description: 'Young coconut and pandan jelly cream dessert', price: 6.99, category: 'Desserts', sort_order: 11 },
  { name: 'Calamansi Iced Tea', description: 'Fresh-squeezed Filipino lime tea', price: 4.49, category: 'Drinks', sort_order: 12 },
  { name: 'Ube Latte', description: 'Purple yam milk latte', price: 5.49, category: 'Drinks', sort_order: 13 },
]

const DIRECTORY = [
  {
    name: 'Casa Tortilla', slug: 'casa-tortilla', cuisine: 'Mexican',
    city: 'Santa Paula', state: 'CA', address: '789 Main St',
    description: 'Family-owned Mexican kitchen serving tacos, burritos, and aguas frescas.',
    default_menu: [
      { name: 'Carne Asada Tacos', price: 12, category: 'Mains' },
      { name: 'Quesabirria', price: 14, category: 'Mains' },
      { name: 'Chips & Guac', price: 8, category: 'Starters' },
    ],
  },
  {
    name: 'Wok This Way', slug: 'wok-this-way', cuisine: 'Chinese',
    city: 'Ventura', state: 'CA',
    description: 'Modern Chinese street food and wok-fired classics.',
    default_menu: [
      { name: 'General Tso\'s Chicken', price: 14, category: 'Mains' },
      { name: 'Vegetable Lo Mein', price: 11, category: 'Mains' },
      { name: 'Crab Rangoon (8pc)', price: 9, category: 'Starters' },
    ],
  },
  {
    name: 'The Daily Slice', slug: 'the-daily-slice', cuisine: 'Pizza',
    city: 'Oxnard', state: 'CA',
    description: 'Hand-tossed New York style pizza by the slice or pie.',
    default_menu: [
      { name: 'Cheese Pizza (16")', price: 18, category: 'Mains' },
      { name: 'Pepperoni Slice', price: 5, category: 'Mains' },
      { name: 'Garlic Knots', price: 6, category: 'Sides' },
    ],
  },
  {
    name: 'Saigon Noodle House', slug: 'saigon-noodle-house', cuisine: 'Vietnamese',
    city: 'Camarillo', state: 'CA',
    description: 'Pho, banh mi, and fresh spring rolls.',
    default_menu: [
      { name: 'Pho Tai', price: 13, category: 'Mains' },
      { name: 'Banh Mi Combo', price: 10, category: 'Mains' },
      { name: 'Spring Rolls (2pc)', price: 6, category: 'Starters' },
    ],
  },
  {
    name: 'Burger Lab', slug: 'burger-lab', cuisine: 'American',
    city: 'Ventura', state: 'CA',
    description: 'Smash burgers, hand-cut fries, craft milkshakes.',
    default_menu: [
      { name: 'Classic Smash Burger', price: 11, category: 'Mains' },
      { name: 'Double Lab Burger', price: 14, category: 'Mains' },
      { name: 'Crinkle Fries', price: 5, category: 'Sides' },
    ],
  },
]

async function main() {
  console.log('🍜 Seeding Lumpia & More...')

  // Check if exists
  const { data: existing } = await supabase.from('restaurants').select('id').eq('slug', LUMPIA_MORE.slug).maybeSingle()

  let restaurantId = existing?.id
  if (!restaurantId) {
    const { data, error } = await supabase.from('restaurants').insert(LUMPIA_MORE).select().single()
    if (error) { console.error(error); return }
    restaurantId = data.id
    console.log(`   ✅ Created restaurant: ${restaurantId}`)
  } else {
    console.log(`   ⏭  Already exists: ${restaurantId}`)
  }

  // Insert menu (skip if items exist)
  const { count } = await supabase.from('restaurant_menu_items').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId)
  if (!count || count === 0) {
    await supabase.from('restaurant_menu_items').insert(MENU.map(m => ({ ...m, restaurant_id: restaurantId })))
    console.log(`   ✅ Added ${MENU.length} menu items`)
  } else {
    console.log(`   ⏭  Menu already populated (${count} items)`)
  }

  // Seed directory
  console.log('\n📁 Seeding business directory...')
  for (const entry of DIRECTORY) {
    const { data: ex } = await supabase.from('business_directory').select('id').eq('slug', entry.slug).maybeSingle()
    if (ex) { console.log(`   ⏭  ${entry.name} exists`); continue }
    const { error } = await supabase.from('business_directory').insert({
      name: entry.name,
      slug: entry.slug,
      category: 'restaurant',
      cuisine: entry.cuisine,
      city: entry.city,
      state: entry.state,
      address: entry.address ?? '',
      description: entry.description,
      default_menu: entry.default_menu,
    })
    if (error) console.error(`   ❌ ${entry.name}: ${error.message}`)
    else console.log(`   ✅ ${entry.name}`)
  }

  console.log('\n✨ Done!')
  console.log(`   Lumpia & More: https://beyondamedium.io/r/${LUMPIA_MORE.slug}`)
  console.log(`   Directory: https://beyondamedium.io/app/directory`)
}

main().catch(e => { console.error(e); process.exit(1) })
