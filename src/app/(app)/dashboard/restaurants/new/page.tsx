'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChefHat, Plus, Trash2, ArrowRight, ArrowLeft, Check, CreditCard, Rocket, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface MenuItem {
  name: string
  price: string
  description: string
  category: string
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 50)
}

export default function NewRestaurantPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  // Step 1
  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2
  const [menu, setMenu] = useState<MenuItem[]>([
    { name: '', price: '', description: '', category: 'Mains' },
    { name: '', price: '', description: '', category: 'Mains' },
    { name: '', price: '', description: '', category: 'Mains' },
  ])

  function updateMenuItem(i: number, field: keyof MenuItem, value: string) {
    const next = [...menu]
    next[i] = { ...next[i], [field]: value }
    setMenu(next)
  }

  function addMenuItem() { setMenu([...menu, { name: '', price: '', description: '', category: 'Mains' }]) }
  function removeMenuItem(i: number) { if (menu.length > 3) setMenu(menu.filter((_, idx) => idx !== i)) }

  // Step 1 → 2
  async function createRestaurant() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const slug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`

      const { data, error } = await supabase.from('restaurants').insert({
        user_id: user.id,
        name: name.trim(),
        slug,
        cuisine: cuisine.trim(),
        city: city.trim(),
        phone: phone.trim(),
        email: user.email || '',
        is_published: false,
        accepts_orders: false,
      }).select().single()

      if (error) throw error
      setRestaurantId(data.id)
      setStep(2)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally { setLoading(false) }
  }

  // Step 2 → 3
  async function saveMenu() {
    if (!restaurantId) return
    const valid = menu.filter(m => m.name.trim() && parseFloat(m.price) > 0)
    if (valid.length < 3) { alert('Please add at least 3 menu items with prices'); return }

    setLoading(true)
    const supabase = createClient()
    await supabase.from('restaurant_menu_items').insert(valid.map((m, i) => ({
      restaurant_id: restaurantId,
      name: m.name.trim(),
      description: m.description.trim(),
      price: parseFloat(m.price),
      category: m.category,
      sort_order: i,
    })))
    setLoading(false)
    setStep(3)
  }

  // Step 3 — Stripe Connect
  async function connectStripe() {
    if (!restaurantId) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Stripe Connect failed')
        setLoading(false)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
      setLoading(false)
    }
  }

  // Step 4 — Publish
  async function publish() {
    if (!restaurantId) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('restaurants').update({ is_published: true }).eq('id', restaurantId)
    router.push(`/dashboard/restaurants/${restaurantId}`)
  }

  const inp = 'w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none transition-colors'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard/restaurants" className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <span className="text-xs text-white/40 font-mono">Step {step} of 4</span>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {[1,2,3,4].map(n => (
          <div key={n} className={`flex-1 h-1 rounded-full transition-colors ${step >= n ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-white/[0.06]'}`} />
        ))}
      </div>

      {/* Step 1 — Business Info */}
      {step === 1 && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 space-y-5">
          <div className="text-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
              <ChefHat className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Business Info</h1>
            <p className="text-sm text-white/40 mt-1">Tell us about your restaurant</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Business Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lumpia & More" className={inp} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Cuisine</label>
              <input value={cuisine} onChange={e => setCuisine(e.target.value)} placeholder="Filipino, Mexican, etc" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">City</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Santa Paula, CA" className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" className={inp} />
          </div>

          <button onClick={createRestaurant} disabled={!name.trim() || loading} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Continue to Menu
          </button>
        </div>
      )}

      {/* Step 2 — Menu */}
      {step === 2 && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 space-y-4">
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold text-white">Add Menu Items</h1>
            <p className="text-sm text-white/40 mt-1">At least 3 items to get started ({menu.filter(m => m.name && m.price).length}/3)</p>
          </div>

          {menu.map((item, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 space-y-2 relative group">
              {menu.length > 3 && (
                <button onClick={() => removeMenuItem(i)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <div className="grid grid-cols-3 gap-2">
                <input value={item.name} onChange={e => updateMenuItem(i, 'name', e.target.value)} placeholder="Item name" className={inp + ' col-span-2'} />
                <input value={item.price} onChange={e => updateMenuItem(i, 'price', e.target.value)} placeholder="$0.00" type="number" step="0.01" className={inp} />
              </div>
              <input value={item.description} onChange={e => updateMenuItem(i, 'description', e.target.value)} placeholder="Description (optional)" className={inp + ' text-xs'} />
              <select value={item.category} onChange={e => updateMenuItem(i, 'category', e.target.value)} className={inp + ' text-xs'}>
                <option>Mains</option>
                <option>Starters</option>
                <option>Sides</option>
                <option>Desserts</option>
                <option>Drinks</option>
              </select>
            </div>
          ))}

          <button onClick={addMenuItem} className="w-full py-2 border border-dashed border-white/[0.1] rounded-xl text-xs text-white/30 hover:text-white/60 hover:border-white/[0.2] transition-colors flex items-center justify-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Another Item
          </button>

          <button onClick={saveMenu} disabled={loading} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Continue to Payments
          </button>
        </div>
      )}

      {/* Step 3 — Stripe Connect */}
      {step === 3 && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 space-y-5">
          <div className="text-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Connect Stripe</h1>
            <p className="text-sm text-white/40 mt-1">Get paid directly to your bank account</p>
          </div>

          <div className="bg-cyan-500/[0.05] border border-cyan-500/15 rounded-xl p-4 space-y-2">
            <p className="text-xs text-cyan-300 font-medium">How payments work</p>
            <div className="text-[11px] text-white/50 space-y-1.5">
              <div className="flex items-start gap-2"><Check className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" /> Customers pay through Stripe checkout</div>
              <div className="flex items-start gap-2"><Check className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" /> 86% goes directly to your bank account</div>
              <div className="flex items-start gap-2"><Check className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" /> 14% platform fee (covers hosting, support, payments)</div>
              <div className="flex items-start gap-2"><Check className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" /> Daily automatic payouts from Stripe</div>
            </div>
          </div>

          <button onClick={connectStripe} disabled={loading} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl disabled:opacity-30 transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Connect Stripe Account
          </button>

          <button onClick={() => setStep(4)} className="w-full text-[11px] text-white/30 hover:text-white/60 transition-colors">
            Skip for now (you can connect later)
          </button>
        </div>
      )}

      {/* Step 4 — Publish */}
      {step === 4 && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 space-y-5">
          <div className="text-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <Rocket className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Ready to launch</h1>
            <p className="text-sm text-white/40 mt-1">Publish your site and start taking orders</p>
          </div>

          <button onClick={publish} disabled={loading} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Publish Restaurant
          </button>
        </div>
      )}
    </div>
  )
}
