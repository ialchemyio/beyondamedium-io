'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Sparkles, Eye, TrendingUp, Lock, Rocket,
  DollarSign, Clock, Users, Target, CreditCard, CalendarCheck,
  Megaphone, UserCheck, ShoppingBag, Briefcase, MapPin,
  ArrowRight, X, Check, Zap, Server, Plug, BarChart3,
} from 'lucide-react'
import UpgradeModal from '@/components/UpgradeModal'

interface RevenueSystem {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  revenue_potential: string
  setup_time: string
  conversion_focus: string
  use_case: string
  html: string
  backend_features: string[]
  funnel_steps: string[]
  integrations: string[]
  api_endpoints: string[]
  benefits: string[]
  launches: number
  avg_conversions: number
}

const FILTERS = [
  { id: 'all', label: 'All Systems', icon: Zap },
  { id: 'leadgen', label: 'Lead Gen', icon: Target },
  { id: 'booking', label: 'Booking', icon: CalendarCheck },
  { id: 'sales', label: 'Sales Funnels', icon: ShoppingBag },
  { id: 'digital', label: 'Digital Products', icon: Briefcase },
  { id: 'brand', label: 'Personal Brand', icon: UserCheck },
  { id: 'local', label: 'Local Business', icon: MapPin },
]

const CATEGORY_COLORS: Record<string, string> = {
  leadgen: 'from-cyan-500 to-blue-500',
  booking: 'from-emerald-500 to-teal-500',
  sales: 'from-violet-500 to-purple-500',
  digital: 'from-blue-500 to-indigo-500',
  brand: 'from-pink-500 to-rose-500',
  local: 'from-amber-500 to-orange-500',
}

const CATEGORY_LABELS: Record<string, string> = {
  leadgen: 'Lead Generation',
  booking: 'Booking System',
  sales: 'Sales Funnel',
  digital: 'Digital Products',
  brand: 'Personal Brand',
  local: 'Local Business',
}

export default function RevenueSystemsPage() {
  const router = useRouter()
  const [systems, setSystems] = useState<RevenueSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [cloning, setCloning] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('starter')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('revenue_systems').select('*').eq('is_active', true).order('launches', { ascending: false })
      setSystems(data ?? [])
      setLoading(false)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: credits } = await supabase.from('user_credits').select('plan').eq('user_id', user.id).single()
        if (credits) setUserPlan(credits.plan)
      }
    }
    load()
  }, [])

  const filtered = systems.filter(s => {
    if (filter !== 'all' && s.category !== filter) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function launchSystem(systemId: string) {
    if (userPlan === 'starter') { setShowUpgrade(true); return }
    setCloning(systemId)
    const system = systems.find(s => s.id === systemId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !system) { setCloning(null); return }

    const slug = system.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + Date.now().toString(36)
    const { data: project } = await supabase.from('projects').insert({
      user_id: user.id, name: system.name, slug, description: system.description,
    }).select().single()

    if (!project) { setCloning(null); return }

    await supabase.from('pages').insert({
      project_id: project.id, title: 'Home', slug: 'index', html: system.html, css: system.html.includes('<style>') ? '' : '', is_home: true, sort_order: 0,
    })

    // Increment launches
    await supabase.from('revenue_systems').update({ launches: (system.launches || 0) + 1 }).eq('id', systemId)

    setCloning(null)
    router.push(`/dashboard/${project.id}/editor`)
  }

  const previewSystem = systems.find(s => s.id === previewId)
  const detailSystem = systems.find(s => s.id === detailId)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Full Preview Modal */}
      {previewSystem && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex flex-col" onClick={() => setPreviewId(null)}>
          <div className="h-12 flex items-center justify-between px-6 shrink-0">
            <span className="text-sm font-medium text-white/70">{previewSystem.name}</span>
            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); launchSystem(previewSystem.id) }} className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:brightness-110 flex items-center gap-1.5">
                <Rocket className="w-3 h-3" /> Launch This System
              </button>
              <button onClick={() => setPreviewId(null)} className="text-xs text-white/40 hover:text-white/70">Close</button>
            </div>
          </div>
          <div className="flex-1 mx-6 mb-6 bg-white rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <iframe srcDoc={previewSystem.html} className="w-full h-full border-0" title="Preview" />
          </div>
        </div>
      )}

      {/* System Detail Modal */}
      {detailSystem && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setDetailId(null)}>
          <div className="bg-[#0d1117] border border-white/[0.08] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/[0.06] flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r ${CATEGORY_COLORS[detailSystem.category]} bg-clip-text text-transparent`}>{CATEGORY_LABELS[detailSystem.category]}</span>
                <h2 className="text-xl font-bold text-white mt-1">{detailSystem.name}</h2>
                <p className="text-xs text-white/40 mt-1">{detailSystem.tagline}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="p-1 text-white/30 hover:text-white/60"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: DollarSign, label: 'Revenue', value: detailSystem.revenue_potential, color: 'text-emerald-400' },
                  { icon: Clock, label: 'Setup', value: detailSystem.setup_time, color: 'text-cyan-400' },
                  { icon: Users, label: 'Launched', value: `${detailSystem.launches}`, color: 'text-blue-400' },
                  { icon: BarChart3, label: 'Avg Conv.', value: `${detailSystem.avg_conversions}/day`, color: 'text-violet-400' },
                ].map(m => (
                  <div key={m.label} className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <m.icon className={`w-4 h-4 ${m.color} mx-auto mb-1`} />
                    <p className="text-xs font-bold text-white">{m.value}</p>
                    <p className="text-[9px] text-white/25">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Funnel Flow */}
              <div>
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Megaphone className="w-3 h-3" /> Funnel Flow</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {detailSystem.funnel_steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-[11px] text-white/60 bg-white/[0.04] px-2.5 py-1 rounded-lg">{step}</span>
                      {i < detailSystem.funnel_steps.length - 1 && <ArrowRight className="w-3 h-3 text-white/15 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Backend Features */}
              <div>
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Server className="w-3 h-3" /> Backend Features</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {detailSystem.backend_features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-[11px] text-white/40">
                      <Check className="w-3 h-3 text-cyan-400/60 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrations */}
              <div>
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Plug className="w-3 h-3" /> Integrations</h3>
                <div className="flex flex-wrap gap-1.5">
                  {detailSystem.integrations.map(i => (
                    <span key={i} className="text-[10px] text-white/30 bg-white/[0.03] px-2.5 py-1 rounded-full border border-white/[0.05]">{i}</span>
                  ))}
                </div>
              </div>

              {/* API Endpoints */}
              <div>
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">API Endpoints</h3>
                <div className="bg-[#0a0e16] rounded-xl p-3 space-y-1">
                  {detailSystem.api_endpoints.map(ep => (
                    <p key={ep} className="text-[11px] text-cyan-400/60 font-mono">{ep}</p>
                  ))}
                </div>
              </div>

              {/* Social Proof */}
              <div className="bg-emerald-500/[0.05] border border-emerald-500/10 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-400/80">Used by <span className="font-bold text-emerald-400">{detailSystem.launches}</span> creators — avg <span className="font-bold text-emerald-400">{detailSystem.avg_conversions}</span> conversions/day</p>
              </div>

              {/* Launch CTA */}
              <button onClick={() => { setDetailId(null); launchSystem(detailSystem.id) }} className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:brightness-110 flex items-center justify-center gap-2">
                <Rocket className="w-4 h-4" /> Launch This System
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Revenue Systems</h1>
            <p className="text-[13px] text-white/40">Pre-built business systems with frontend + backend. Generate leads, book clients, close sales.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-mono">{systems.length} systems</span>
          <span className="text-xs bg-white/[0.04] text-white/30 px-2.5 py-1 rounded-full">Pro / BAM plans</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search revenue systems..." className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none" />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2">
        {FILTERS.map(f => {
          const Icon = f.icon
          const count = f.id === 'all' ? systems.length : systems.filter(s => s.category === f.id).length
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === f.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-white/[0.02] text-white/30 border border-transparent hover:text-white/50'}`}>
              <Icon className="w-3 h-3" /> {f.label} <span className="text-[9px] text-white/20">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white/[0.02] rounded-2xl h-[400px] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No systems found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(system => {
            const color = CATEGORY_COLORS[system.category] ?? 'from-gray-500 to-zinc-500'
            return (
              <div key={system.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden group hover:border-white/[0.12] transition-all">
                {/* Live Preview */}
                <div className="aspect-[16/10] bg-[#0f1115] relative overflow-hidden">
                  <iframe
                    srcDoc={system.html}
                    className="absolute top-0 left-0 w-[1440px] h-[900px] border-0 pointer-events-none origin-top-left"
                    style={{ transform: 'scale(var(--thumb-scale,0.25))' }}
                    title={system.name}
                    loading="lazy"
                    sandbox=""
                    ref={(el) => {
                      if (el) {
                        const obs = new ResizeObserver(([entry]) => { el.style.setProperty('--thumb-scale', String(entry.contentRect.width / 1440)) })
                        obs.observe(el.parentElement!)
                      }
                    }}
                  />
                  {/* Category badge */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r ${color} rounded-full z-10`}>
                    <span className="text-[9px] font-bold text-white tracking-wide">{CATEGORY_LABELS[system.category]?.toUpperCase()}</span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-end justify-center pb-3 gap-2">
                    <button onClick={() => setPreviewId(system.id)} className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-[11px] text-white font-medium flex items-center gap-1.5 hover:bg-white/20">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button onClick={() => setDetailId(system.id)} className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-[11px] text-white font-medium flex items-center gap-1.5 hover:bg-white/20">
                      <Server className="w-3 h-3" /> System Details
                    </button>
                  </div>
                </div>

                {/* System Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-white/85 text-sm">{system.name}</h3>
                      <span className="text-[10px] text-emerald-400/70 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0 ml-2">{system.revenue_potential}</span>
                    </div>
                    <p className="text-[11px] text-white/30 mt-0.5">{system.tagline}</p>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 text-[10px] text-white/30">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-white/20" /> {system.setup_time}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 text-white/20" /> {system.launches} launched</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400/40" /> {system.avg_conversions}/day</span>
                  </div>

                  {/* Backend features preview */}
                  <div className="flex flex-wrap gap-1">
                    {system.backend_features.slice(0, 3).map(f => (
                      <span key={f} className="text-[9px] text-white/20 bg-white/[0.03] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Server className="w-2 h-2 text-cyan-400/40" /> {f}
                      </span>
                    ))}
                    {system.backend_features.length > 3 && (
                      <span className="text-[9px] text-white/15 px-1">+{system.backend_features.length - 3} more</span>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => launchSystem(system.id)}
                    disabled={cloning === system.id}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      userPlan === 'starter'
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110'
                    }`}
                  >
                    {userPlan === 'starter' ? (
                      <><Lock className="w-3 h-3" /> Upgrade to Launch</>
                    ) : cloning === system.id ? (
                      'Launching...'
                    ) : (
                      <><Rocket className="w-3 h-3" /> Launch This System</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} reason="credits" />
    </div>
  )
}
