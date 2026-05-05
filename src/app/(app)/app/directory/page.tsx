'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Search, ChefHat, ExternalLink, Plus, Loader2, Check } from 'lucide-react'

interface DirectoryEntry {
  id: string
  name: string
  slug: string
  category: string
  cuisine: string
  city: string
  state: string
  description: string
  is_claimed: boolean
}

export default function DirectoryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<DirectoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('all')
  const [claiming, setClaiming] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('business_directory').select('*').order('name').limit(100)
    setEntries(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const cities = Array.from(new Set(entries.map(e => e.city).filter(Boolean)))
  const filtered = entries.filter(e => {
    if (city !== 'all' && e.city !== city) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function claimBusiness(id: string) {
    setClaiming(id)
    try {
      const res = await fetch('/api/directory/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directoryId: id }),
      })
      const data = await res.json()
      if (data.restaurantId) {
        router.push(`/dashboard/restaurants/${data.restaurantId}`)
      } else {
        alert(data.error || 'Claim failed')
        setClaiming(null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
      setClaiming(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Business Directory</h1>
        <p className="text-sm text-white/40 mt-1">Local restaurants ready to launch online ordering.</p>
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search businesses..." className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none" />
        </div>
        <select value={city} onChange={e => setCity(e.target.value)} className="px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white focus:border-cyan-500/30 focus:outline-none">
          <option value="all">All cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white/[0.02] rounded-2xl h-48 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <ChefHat className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No businesses found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(entry => (
            <div key={entry.id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:border-white/[0.1] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold opacity-60">
                  {entry.name.charAt(0)}
                </div>
                {entry.is_claimed && (
                  <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full"><Check className="w-2.5 h-2.5" /> Claimed</span>
                )}
              </div>
              <h3 className="font-semibold text-white/85 text-sm">{entry.name}</h3>
              {entry.cuisine && <p className="text-[11px] text-white/40 mt-0.5">{entry.cuisine}</p>}
              {entry.city && (
                <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {entry.city}{entry.state && `, ${entry.state}`}</p>
              )}
              {entry.description && <p className="text-xs text-white/35 mt-2 line-clamp-2">{entry.description}</p>}

              <div className="mt-4 flex gap-2">
                {entry.is_claimed ? (
                  <a href={`/r/${entry.slug}`} target="_blank" className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500/10 text-cyan-400 text-xs font-medium rounded-lg hover:bg-cyan-500/20">
                    <ExternalLink className="w-3 h-3" /> Order Online
                  </a>
                ) : (
                  <button onClick={() => claimBusiness(entry.id)} disabled={claiming === entry.id} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:brightness-110 disabled:opacity-50">
                    {claiming === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    {claiming === entry.id ? 'Claiming...' : 'Claim This Page'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
