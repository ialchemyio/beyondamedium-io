'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, Clock, Check, X, ChefHat } from 'lucide-react'

interface Order {
  id: string
  restaurant_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  status: string
  created_at: string
  restaurants: { name: string; slug: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-white/[0.04] text-white/40',
  confirmed: 'bg-cyan-500/10 text-cyan-400',
  preparing: 'bg-amber-500/10 text-amber-400',
  ready: 'bg-violet-500/10 text-violet-400',
  completed: 'bg-emerald-500/10 text-emerald-400',
  cancelled: 'bg-red-500/10 text-red-400',
  refunded: 'bg-orange-500/10 text-orange-400',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('restaurant_orders')
      .select('*, restaurants(name, slug)')
      .order('created_at', { ascending: false })
      .limit(100)
    setOrders((data ?? []) as unknown as Order[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('restaurant_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    completed: orders.filter(o => o.status === 'completed').length,
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-sm text-white/40 mt-1">Manage incoming customer orders</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {(['all', 'pending', 'confirmed', 'preparing', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors capitalize ${
            filter === f ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-white/[0.02] text-white/30 border border-transparent hover:text-white/50'
          }`}>
            {f} <span className="text-[9px] text-white/20 ml-0.5">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="bg-white/[0.02] rounded-xl h-20 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <ShoppingBag className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <div key={order.id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white/80">{order.customer_name}</span>
                    <span className="text-[10px] text-white/30 font-mono">#{order.id.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                  </div>
                  <p className="text-[11px] text-white/40">
                    {order.restaurants?.name} • {order.customer_email} {order.customer_phone && `• ${order.customer_phone}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">${order.total.toFixed(2)}</p>
                  <p className="text-[10px] text-white/25">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {order.items.map((item, i) => (
                  <span key={i} className="text-[10px] text-white/40 bg-white/[0.04] px-2 py-0.5 rounded-full">{item.quantity}× {item.name}</span>
                ))}
              </div>

              {order.status === 'confirmed' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(order.id, 'preparing')} className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-medium rounded-lg hover:bg-amber-500/20">Mark Preparing</button>
                  <button onClick={() => updateStatus(order.id, 'ready')} className="px-3 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-medium rounded-lg hover:bg-violet-500/20">Ready</button>
                  <button onClick={() => updateStatus(order.id, 'completed')} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/20">Complete</button>
                </div>
              )}
              {order.status === 'preparing' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(order.id, 'ready')} className="px-3 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-medium rounded-lg hover:bg-violet-500/20">Mark Ready</button>
                  <button onClick={() => updateStatus(order.id, 'completed')} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/20">Complete</button>
                </div>
              )}
              {order.status === 'ready' && (
                <button onClick={() => updateStatus(order.id, 'completed')} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/20">Mark Completed</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
