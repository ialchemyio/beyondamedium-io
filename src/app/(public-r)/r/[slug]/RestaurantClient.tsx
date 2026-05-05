'use client'

import { useState, useMemo, useEffect } from 'react'
import { ShoppingBag, Plus, Minus, X, MapPin, Phone, Loader2, Check } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string | null
}

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string
  cuisine: string
  address: string
  city: string
  phone: string
  primary_color: string
  hero_image: string | null
  accepts_orders: boolean
}

interface CartItem extends MenuItem {
  quantity: number
}

export default function RestaurantClient({ restaurant, menu }: { restaurant: Restaurant; menu: MenuItem[] }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Checkout
  const [showCheckout, setShowCheckout] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')

  // Open cart if URL has cart=open
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('cart=open')) setCartOpen(true)
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map(m => m.category)))
    return ['all', ...cats]
  }, [menu])

  const filteredMenu = activeCategory === 'all' ? menu : menu.filter(m => m.category === activeCategory)

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const tax = subtotal * 0.0875
  const total = subtotal + tax
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)

  const accent = restaurant.primary_color || '#dc2626'

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0))
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setCheckingOut(true)
    setError('')
    try {
      const res = await fetch('/api/restaurants/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          customer: { name: customerName, email: customerEmail, phone: customerPhone },
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { setError(data.error || 'Checkout failed'); setCheckingOut(false) }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
      setCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ─── Top Bar ──────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: accent }}>
              {restaurant.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">{restaurant.name}</h1>
              {restaurant.cuisine && <p className="text-[10px] text-slate-500 mt-0.5">{restaurant.cuisine}{restaurant.city && ` • ${restaurant.city}`}</p>}
            </div>
          </div>

          {restaurant.accepts_orders && itemCount > 0 && (
            <button onClick={() => setCartOpen(true)} className="relative px-3 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all hover:brightness-110" style={{ background: accent }}>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>${subtotal.toFixed(2)}</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border-2 text-[9px] font-bold flex items-center justify-center" style={{ color: accent, borderColor: accent }}>{itemCount}</span>
            </button>
          )}
        </div>
      </header>

      {/* ─── Hero ─────────────────────── */}
      <section className="relative">
        <div className="h-44 sm:h-56" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-3xl mx-auto px-4 py-8 sm:py-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{restaurant.name}</h2>
            {restaurant.description && <p className="text-white/85 text-sm mt-1 max-w-md">{restaurant.description}</p>}
            <div className="flex items-center gap-3 mt-3 text-[11px] text-white/85">
              {restaurant.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {restaurant.city}</span>}
              {restaurant.phone && <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:text-white"><Phone className="w-3 h-3" /> {restaurant.phone}</a>}
            </div>
          </div>
        </div>

        {!restaurant.accepts_orders && (
          <div className="bg-amber-50 border-y border-amber-200 px-4 py-3 text-center">
            <p className="text-xs text-amber-800">Online ordering will be available soon. Stay tuned!</p>
          </div>
        )}
      </section>

      {/* ─── Category Tabs ───────────── */}
      {categories.length > 2 && (
        <div className="sticky top-14 z-30 bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 flex gap-1.5 overflow-x-auto py-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors capitalize ${
                  activeCategory === cat ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={activeCategory === cat ? { background: accent } : undefined}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Menu ─────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {menu.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-400">Menu coming soon</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMenu.map(item => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                    {item.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>}
                    <p className="text-sm font-bold mt-1.5" style={{ color: accent }}>${item.price.toFixed(2)}</p>
                  </div>

                  {restaurant.accepts_orders && (
                    inCart ? (
                      <div className="flex items-center gap-2 bg-slate-50 rounded-full p-1">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-bold w-5 text-center">{inCart.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full text-white flex items-center justify-center hover:brightness-110" style={{ background: accent }}><Plus className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)} className="w-9 h-9 rounded-full text-white flex items-center justify-center hover:brightness-110 transition-all shrink-0" style={{ background: accent }}>
                        <Plus className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ─── Sticky Cart (mobile) ────── */}
      {restaurant.accepts_orders && itemCount > 0 && !cartOpen && !showCheckout && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-96 z-30">
          <button onClick={() => setCartOpen(true)} className="w-full text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-between px-5 hover:brightness-110 transition-all" style={{ background: accent }}>
            <span className="text-sm flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> {itemCount} item{itemCount > 1 ? 's' : ''}</span>
            <span>View Cart • ${subtotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* ─── Cart Drawer ─────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setCartOpen(false)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold">Your Cart</h3>
              <button onClick={() => setCartOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Cart is empty</p>
              ) : cart.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-full p-0.5">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full text-white flex items-center justify-center" style={{ background: accent }}><Plus className="w-3 h-3" /></button>
                  </div>
                  <p className="text-sm font-bold w-16 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-slate-600"><span>Tax (8.75%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200"><span>Total</span><span style={{ color: accent }}>${total.toFixed(2)}</span></div>
                <button onClick={() => { setCartOpen(false); setShowCheckout(true) }} className="w-full text-white font-bold py-3 rounded-xl mt-3 hover:brightness-110" style={{ background: accent }}>
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Checkout Modal ──────────── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setShowCheckout(false)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCheckout} className="flex-1 overflow-y-auto p-4 space-y-3">
              {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs">{error}</div>}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': accent } as React.CSSProperties} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2" />
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 mt-4">
                {cart.map(i => (
                  <div key={i.id} className="flex justify-between text-xs"><span className="text-slate-600">{i.quantity}× {i.name}</span><span className="font-medium">${(i.price * i.quantity).toFixed(2)}</span></div>
                ))}
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200"><span className="text-slate-500">Tax</span><span className="text-slate-500">${tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-bold pt-1"><span>Total</span><span style={{ color: accent }}>${total.toFixed(2)}</span></div>
              </div>

              <button type="submit" disabled={checkingOut || !customerName || !customerEmail} className="w-full text-white font-bold py-3.5 rounded-xl mt-2 disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2" style={{ background: accent }}>
                {checkingOut ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</> : `Pay $${total.toFixed(2)}`}
              </button>
              <p className="text-[10px] text-slate-400 text-center">Secure payment powered by Stripe</p>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-4 text-center">
        <p className="text-[10px] text-slate-400">Powered by <a href="https://beyondamedium.io" className="font-semibold hover:text-slate-700">BAM</a></p>
      </footer>
    </div>
  )
}
