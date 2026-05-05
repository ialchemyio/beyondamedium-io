'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Plus, Trash2, ExternalLink, CreditCard, Check, Clock,
  AlertCircle, Save, ChefHat, ShoppingBag,
} from 'lucide-react'
import Link from 'next/link'

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string
  cuisine: string
  city: string
  phone: string
  email: string
  primary_color: string
  is_published: boolean
  accepts_orders: boolean
  stripe_account_id: string | null
  stripe_account_status: string
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  is_available: boolean
  sort_order: number
}

const inp = 'w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none'

export default function RestaurantManagePage() {
  const params = useParams()
  const id = params.restaurantId as string

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'overview' | 'menu' | 'orders'>('overview')
  const [editingItem, setEditingItem] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data: r } = await supabase.from('restaurants').select('*').eq('id', id).single()
    if (r) setRestaurant(r)
    const { data: m } = await supabase.from('restaurant_menu_items').select('*').eq('restaurant_id', id).order('sort_order')
    if (m) setMenu(m)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function saveRestaurant() {
    if (!restaurant) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('restaurants').update({
      name: restaurant.name, description: restaurant.description, cuisine: restaurant.cuisine,
      city: restaurant.city, phone: restaurant.phone, email: restaurant.email, primary_color: restaurant.primary_color,
    }).eq('id', id)
    setSaving(false)
  }

  async function connectStripe() {
    setSaving(true)
    const res = await fetch('/api/stripe/connect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId: id }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { alert(data.error); setSaving(false) }
  }

  async function checkStripeStatus() {
    const res = await fetch(`/api/stripe/connect?restaurantId=${id}`)
    const data = await res.json()
    if (data.status) load()
  }

  async function addMenuItem() {
    const supabase = createClient()
    const { data } = await supabase.from('restaurant_menu_items').insert({
      restaurant_id: id, name: 'New Item', price: 0, category: 'Mains', sort_order: menu.length,
    }).select().single()
    if (data) { setMenu([...menu, data]); setEditingItem(data.id) }
  }

  async function saveMenuItem(item: MenuItem) {
    const supabase = createClient()
    await supabase.from('restaurant_menu_items').update({
      name: item.name, description: item.description, price: item.price, category: item.category,
    }).eq('id', item.id)
    setEditingItem(null)
  }

  async function deleteMenuItem(itemId: string) {
    if (!confirm('Delete this item?')) return
    const supabase = createClient()
    await supabase.from('restaurant_menu_items').delete().eq('id', itemId)
    setMenu(menu.filter(m => m.id !== itemId))
  }

  if (loading || !restaurant) return <div className="text-center py-20 text-white/30">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/restaurants" className="p-2 text-white/30 hover:text-white/60 rounded-lg hover:bg-white/5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{restaurant.name}</h1>
          <p className="text-xs text-white/30 font-mono">/r/{restaurant.slug}</p>
        </div>
        {restaurant.accepts_orders ? (
          <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full"><Check className="w-3 h-3" /> Live</span>
        ) : (
          <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-xs font-medium px-3 py-1 rounded-full"><Clock className="w-3 h-3" /> Setup needed</span>
        )}
        <a href={`/r/${restaurant.slug}`} target="_blank" className="px-4 py-2 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-xl hover:bg-cyan-500/20 flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3" /> View Site
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.02] border border-white/[0.05] rounded-xl p-1">
        {(['overview', 'menu', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors capitalize ${tab === t ? 'bg-white/[0.06] text-white' : 'text-white/30 hover:text-white/60'}`}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stripe Connect */}
          {restaurant.stripe_account_status !== 'active' && (
            <div className="bg-amber-500/[0.05] border border-amber-500/15 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <CreditCard className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-400">Connect Stripe to accept orders</p>
                  <p className="text-xs text-white/40 mt-1">86% goes to your account, 14% platform fee.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={connectStripe} disabled={saving} className="px-4 py-2 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-xl hover:bg-amber-500/30 disabled:opacity-50">
                  {restaurant.stripe_account_id ? 'Continue Setup' : 'Connect Stripe'}
                </button>
                {restaurant.stripe_account_id && (
                  <button onClick={checkStripeStatus} className="px-4 py-2 text-xs text-white/50 hover:text-white/70">
                    Check Status
                  </button>
                )}
              </div>
            </div>
          )}

          {restaurant.stripe_account_status === 'active' && (
            <div className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-2xl p-5 flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">Stripe connected</p>
                <p className="text-xs text-white/40">Your restaurant is accepting orders.</p>
              </div>
            </div>
          )}

          {/* Details Form */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white/70">Business Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] text-white/40 uppercase mb-1">Name</label><input value={restaurant.name} onChange={e => setRestaurant({...restaurant, name: e.target.value})} className={inp} /></div>
              <div><label className="block text-[10px] text-white/40 uppercase mb-1">Cuisine</label><input value={restaurant.cuisine} onChange={e => setRestaurant({...restaurant, cuisine: e.target.value})} className={inp} /></div>
              <div><label className="block text-[10px] text-white/40 uppercase mb-1">City</label><input value={restaurant.city} onChange={e => setRestaurant({...restaurant, city: e.target.value})} className={inp} /></div>
              <div><label className="block text-[10px] text-white/40 uppercase mb-1">Phone</label><input value={restaurant.phone} onChange={e => setRestaurant({...restaurant, phone: e.target.value})} className={inp} /></div>
            </div>
            <div><label className="block text-[10px] text-white/40 uppercase mb-1">Description</label><textarea value={restaurant.description} onChange={e => setRestaurant({...restaurant, description: e.target.value})} rows={3} className={inp + ' resize-y'} /></div>
            <div className="flex items-center gap-3">
              <label className="block text-[10px] text-white/40 uppercase">Brand Color</label>
              <input type="color" value={restaurant.primary_color || '#dc2626'} onChange={e => setRestaurant({...restaurant, primary_color: e.target.value})} className="w-10 h-8 rounded cursor-pointer" />
              <span className="text-xs text-white/50 font-mono">{restaurant.primary_color}</span>
            </div>
            <button onClick={saveRestaurant} disabled={saving} className="px-4 py-2 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-xl hover:bg-cyan-500/20 flex items-center gap-1.5">
              <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Menu */}
      {tab === 'menu' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white/50"><ChefHat className="w-3.5 h-3.5 inline mr-1" /> {menu.length} items</p>
            <button onClick={addMenuItem} className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 text-xs font-medium rounded-lg hover:bg-cyan-500/20 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
          </div>

          {menu.map(item => (
            <div key={item.id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
              {editingItem === item.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input value={item.name} onChange={e => setMenu(menu.map(m => m.id === item.id ? { ...m, name: e.target.value } : m))} placeholder="Name" className={inp + ' col-span-2'} />
                    <input type="number" step="0.01" value={item.price} onChange={e => setMenu(menu.map(m => m.id === item.id ? { ...m, price: parseFloat(e.target.value) } : m))} placeholder="Price" className={inp} />
                  </div>
                  <input value={item.description} onChange={e => setMenu(menu.map(m => m.id === item.id ? { ...m, description: e.target.value } : m))} placeholder="Description" className={inp} />
                  <select value={item.category} onChange={e => setMenu(menu.map(m => m.id === item.id ? { ...m, category: e.target.value } : m))} className={inp}>
                    {['Mains', 'Starters', 'Sides', 'Desserts', 'Drinks'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => saveMenuItem(item)} className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-lg">Save</button>
                    <button onClick={() => { setEditingItem(null); load() }} className="px-3 py-1.5 text-xs text-white/40">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/80">{item.name} <span className="text-[10px] text-white/30 ml-2">{item.category}</span></p>
                    <p className="text-xs text-white/40">{item.description}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400 mr-3">${item.price.toFixed(2)}</span>
                  <button onClick={() => setEditingItem(item.id)} className="text-xs text-cyan-400 hover:underline mr-2">Edit</button>
                  <button onClick={() => deleteMenuItem(item.id)} className="text-white/20 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          ))}

          {menu.length === 0 && (
            <div className="text-center py-12 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
              <p className="text-sm text-white/30 mb-3">No menu items yet</p>
              <button onClick={addMenuItem} className="px-4 py-2 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-xl">Add First Item</button>
            </div>
          )}
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div className="text-center py-12 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <ShoppingBag className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30 mb-1">View all orders</p>
          <Link href="/dashboard/orders" className="text-xs text-cyan-400 hover:underline">Open Orders Dashboard →</Link>
        </div>
      )}
    </div>
  )
}
