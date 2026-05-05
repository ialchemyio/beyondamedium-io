'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, ChefHat, ExternalLink, Settings, Check, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string
  cuisine: string
  city: string
  is_published: boolean
  accepts_orders: boolean
  stripe_account_status: string
  created_at: string
}

export default function RestaurantsPage() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false })
      setRestaurants(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const stats = {
    total: restaurants.length,
    accepting: restaurants.filter(r => r.accepts_orders).length,
    pending: restaurants.filter(r => r.stripe_account_status === 'pending').length,
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Restaurants</h1>
          <p className="text-sm text-white/40 mt-1">Launch and manage food ordering sites</p>
        </div>
        <Link href="/dashboard/restaurants/new" className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Restaurant
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white/30 text-[10px] uppercase tracking-wider mb-2"><ChefHat className="w-3 h-3" /> Total</div>
          <p className="text-2xl font-bold text-white/80">{stats.total}</p>
        </div>
        <div className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-emerald-400/70 text-[10px] uppercase tracking-wider mb-2"><Check className="w-3 h-3" /> Accepting Orders</div>
          <p className="text-2xl font-bold text-emerald-400/80">{stats.accepting}</p>
        </div>
        <div className="bg-amber-500/[0.04] border border-amber-500/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-amber-400/70 text-[10px] uppercase tracking-wider mb-2"><Clock className="w-3 h-3" /> Setup Pending</div>
          <p className="text-2xl font-bold text-amber-400/80">{stats.pending}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white/[0.02] rounded-2xl h-32 animate-pulse" />)}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <ChefHat className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white/40 mb-2">No restaurants yet</h3>
          <p className="text-sm text-white/25 mb-6">Launch your first food ordering site in 4 steps.</p>
          <Link href="/dashboard/restaurants/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:brightness-110">
            <Plus className="w-4 h-4" /> Launch a Restaurant
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {restaurants.map(r => (
            <div key={r.id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:border-white/[0.1] transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white/85">{r.name}</h3>
                  <p className="text-[10px] text-white/30 font-mono">/r/{r.slug}</p>
                </div>
                {r.accepts_orders ? (
                  <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full"><Check className="w-2.5 h-2.5" /> Live</span>
                ) : r.stripe_account_status === 'pending' ? (
                  <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[10px] font-medium px-2 py-0.5 rounded-full"><Clock className="w-2.5 h-2.5" /> Setup needed</span>
                ) : (
                  <span className="flex items-center gap-1 bg-white/[0.04] text-white/30 text-[10px] font-medium px-2 py-0.5 rounded-full"><AlertCircle className="w-2.5 h-2.5" /> Draft</span>
                )}
              </div>
              {r.description && <p className="text-xs text-white/40 mb-3 line-clamp-2">{r.description}</p>}
              <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/dashboard/restaurants/${r.id}`} className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.05] text-white/60 text-[11px] rounded-lg hover:bg-white/[0.08]">
                  <Settings className="w-3 h-3" /> Manage
                </Link>
                <a href={`/r/${r.slug}`} target="_blank" className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 text-[11px] rounded-lg hover:bg-cyan-500/20">
                  <ExternalLink className="w-3 h-3" /> View Site
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
