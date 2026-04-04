'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Sparkles, Eye, TrendingUp, Crown, Lock, Rocket,
  DollarSign, Clock, Users, Target, CreditCard, CalendarCheck,
  Megaphone, UserCheck, ShoppingBag, Briefcase, MapPin,
  ArrowRight, X, Check, Zap,
} from 'lucide-react'
import UpgradeModal from '@/components/UpgradeModal'

// ─── Types ───────────────────────────────────────────────────
interface Template {
  id: string
  name: string
  description: string
  category: string
  uses: number
  html: string
  is_premium: boolean
  created_at: string
}

// ─── Revenue System Metadata ─────────────────────────────────
// Map each category to revenue-focused metadata
const SYSTEM_META: Record<string, {
  useCase: string
  revenue: string
  setupTime: string
  conversionFocus: string
  benefits: string[]
}> = {
  saas: { useCase: 'Lead Gen', revenue: '$2k–$20k/mo', setupTime: '10 min', conversionFocus: 'Trial signups', benefits: ['Captures leads', 'Drives trial signups', 'Builds trust with social proof', 'Converts visitors to users'] },
  restaurant: { useCase: 'Booking', revenue: '$3k–$15k/mo', setupTime: '8 min', conversionFocus: 'Reservations & orders', benefits: ['Drives reservations', 'Showcases menu', 'Accepts online orders', 'Builds local presence'] },
  fitness: { useCase: 'Booking', revenue: '$2k–$12k/mo', setupTime: '10 min', conversionFocus: 'Class bookings', benefits: ['Books clients 24/7', 'Sells memberships', 'Showcases programs', 'Captures leads'] },
  ecommerce: { useCase: 'Sales', revenue: '$5k–$50k/mo', setupTime: '12 min', conversionFocus: 'Product sales', benefits: ['Drives purchases', 'Builds brand trust', 'Upsells products', 'Captures email subscribers'] },
  realestate: { useCase: 'Lead Gen', revenue: '$5k–$30k/mo', setupTime: '10 min', conversionFocus: 'Property inquiries', benefits: ['Captures buyer leads', 'Showcases listings', 'Builds agent credibility', 'Drives consultations'] },
  coaching: { useCase: 'Digital Products', revenue: '$3k–$25k/mo', setupTime: '10 min', conversionFocus: 'Course enrollments', benefits: ['Sells courses', 'Books coaching calls', 'Builds authority', 'Grows email list'] },
  agency: { useCase: 'Lead Gen', revenue: '$5k–$40k/mo', setupTime: '10 min', conversionFocus: 'Client inquiries', benefits: ['Generates client leads', 'Showcases portfolio', 'Builds credibility', 'Drives consultations'] },
  medical: { useCase: 'Booking', revenue: '$5k–$25k/mo', setupTime: '8 min', conversionFocus: 'Appointment bookings', benefits: ['Books patients online', 'Builds trust', 'Reduces no-shows', 'Grows practice'] },
  legal: { useCase: 'Lead Gen', revenue: '$5k–$30k/mo', setupTime: '10 min', conversionFocus: 'Consultations', benefits: ['Captures case leads', 'Builds trust', 'Qualifies prospects', 'Books consultations'] },
  construction: { useCase: 'Lead Gen', revenue: '$3k–$20k/mo', setupTime: '8 min', conversionFocus: 'Quote requests', benefits: ['Generates quote requests', 'Showcases projects', 'Builds local trust', 'Converts visitors'] },
  events: { useCase: 'Sales', revenue: '$2k–$15k/mo', setupTime: '10 min', conversionFocus: 'Ticket sales', benefits: ['Sells tickets', 'Builds hype', 'Captures RSVPs', 'Drives attendance'] },
  beauty: { useCase: 'Booking', revenue: '$3k–$15k/mo', setupTime: '8 min', conversionFocus: 'Appointment bookings', benefits: ['Books appointments', 'Showcases services', 'Sells packages', 'Builds loyalty'] },
  nonprofit: { useCase: 'Lead Gen', revenue: '$1k–$10k/mo', setupTime: '8 min', conversionFocus: 'Donations', benefits: ['Drives donations', 'Tells your story', 'Builds community', 'Captures volunteers'] },
  automotive: { useCase: 'Lead Gen', revenue: '$3k–$20k/mo', setupTime: '8 min', conversionFocus: 'Service bookings', benefits: ['Books service appointments', 'Showcases inventory', 'Builds trust', 'Drives walk-ins'] },
}

const USE_CASE_ICONS: Record<string, typeof DollarSign> = {
  'Lead Gen': Target,
  'Booking': CalendarCheck,
  'Sales': ShoppingBag,
  'Digital Products': Briefcase,
}

// ─── Filter Categories (outcome-driven) ──────────────────────
const FILTERS = [
  { id: 'all', label: 'All Systems', icon: Sparkles },
  { id: 'leadgen', label: 'Lead Gen', icon: Target },
  { id: 'booking', label: 'Booking Systems', icon: CalendarCheck },
  { id: 'sales', label: 'Sales Funnels', icon: ShoppingBag },
  { id: 'digital', label: 'Digital Products', icon: Briefcase },
  { id: 'brand', label: 'Personal Brand', icon: UserCheck },
  { id: 'local', label: 'Local Business', icon: MapPin },
]

function getFilterMatch(template: Template, filterId: string): boolean {
  if (filterId === 'all') return true
  if (filterId === 'premium') return template.is_premium
  const meta = SYSTEM_META[template.category]
  if (!meta) return false
  if (filterId === 'leadgen') return meta.useCase === 'Lead Gen'
  if (filterId === 'booking') return meta.useCase === 'Booking'
  if (filterId === 'sales') return meta.useCase === 'Sales'
  if (filterId === 'digital') return meta.useCase === 'Digital Products'
  if (filterId === 'brand') return ['coaching', 'agency'].includes(template.category)
  if (filterId === 'local') return ['restaurant', 'fitness', 'medical', 'beauty', 'construction', 'automotive'].includes(template.category)
  return false
}

// ─── Funnel Steps ────────────────────────────────────────────
const FUNNEL_STEPS = [
  { label: 'Landing', color: 'from-cyan-400 to-blue-500' },
  { label: 'Offer', color: 'from-blue-500 to-violet-500' },
  { label: 'Booking', color: 'from-violet-500 to-purple-500' },
  { label: 'Payment', color: 'from-purple-500 to-pink-500' },
  { label: 'Upsell', color: 'from-pink-500 to-rose-500' },
]

// ─── Main Component ──────────────────────────────────────────
export default function RevenueSystemsPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [funnelViewId, setFunnelViewId] = useState<string | null>(null)
  const [cloning, setCloning] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('starter')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('templates').select('*').eq('is_public', true).eq('is_premium', true).order('uses', { ascending: false })
      setTemplates(data ?? [])
      setLoading(false)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: credits } = await supabase.from('user_credits').select('plan').eq('user_id', user.id).single()
        if (credits) setUserPlan(credits.plan)
      }
    }
    load()
  }, [])

  const filtered = templates.filter(t => {
    if (!getFilterMatch(t, filter)) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function launchSystem(templateId: string) {
    const template = templates.find(t => t.id === templateId)
    if (template?.is_premium && userPlan === 'starter') { setShowUpgrade(true); return }

    setCloning(templateId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: projects } = await supabase.from('projects').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
    let projectId = projects?.[0]?.id
    if (!projectId) {
      const { data: p } = await supabase.from('projects').insert({ user_id: user.id, name: template?.name ?? 'My Website', slug: `site-${Date.now().toString(36)}`, description: template?.description ?? '' }).select().single()
      projectId = p?.id
    }
    if (!projectId) { setCloning(null); return }

    const res = await fetch('/api/templates/clone', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId, projectId }) })
    const data = await res.json()
    setCloning(null)
    if (data.page) router.push(`/dashboard/${projectId}/editor`)
  }

  const previewTemplate = templates.find(t => t.id === previewId)
  const funnelTemplate = templates.find(t => t.id === funnelViewId)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex flex-col" onClick={() => setPreviewId(null)}>
          <div className="h-12 flex items-center justify-between px-6 shrink-0">
            <span className="text-sm font-medium text-white/70">{previewTemplate.name}</span>
            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); launchSystem(previewTemplate.id) }} className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:brightness-110 flex items-center gap-1.5">
                <Rocket className="w-3 h-3" /> Launch This System
              </button>
              <button onClick={() => setPreviewId(null)} className="text-xs text-white/40 hover:text-white/70">Close</button>
            </div>
          </div>
          <div className="flex-1 mx-6 mb-6 bg-white rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <iframe srcDoc={previewTemplate.html} className="w-full h-full border-0" title="Preview" />
          </div>
        </div>
      )}

      {/* Funnel Flow Modal */}
      {funnelTemplate && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center" onClick={() => setFunnelViewId(null)}>
          <div className="bg-[#0d1117] border border-white/[0.08] rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Funnel Flow</h3>
              <button onClick={() => setFunnelViewId(null)} className="p-1 text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-white/40 mb-6">How <span className="text-white/70 font-medium">{funnelTemplate.name}</span> converts visitors into revenue:</p>
            <div className="space-y-3">
              {FUNNEL_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 opacity-80`}>
                    <span className="text-white text-xs font-bold">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/80">{step.label}</p>
                  </div>
                  {i < FUNNEL_STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-white/15" />}
                </div>
              ))}
            </div>
            <button onClick={() => { setFunnelViewId(null); launchSystem(funnelTemplate.id) }} className="w-full mt-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:brightness-110 flex items-center justify-center gap-2">
              <Rocket className="w-4 h-4" /> Launch This System
            </button>
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
            <p className="text-[13px] text-white/40">Pre-built systems designed to generate leads, bookings, and revenue.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-mono">{templates.length} systems</span>
          <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-mono">{templates.filter(t => t.is_premium).length} premium</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search revenue systems..." className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none" />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {FILTERS.map(f => {
          const Icon = f.icon
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === f.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-white/[0.02] text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.04]'}`}>
              <Icon className="w-3 h-3" /> {f.label}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-white/[0.02] rounded-2xl h-96 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No systems found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(template => {
            const meta = SYSTEM_META[template.category] ?? { useCase: 'Lead Gen', revenue: '$1k–$10k/mo', setupTime: '10 min', conversionFocus: 'Conversions', benefits: ['Captures leads', 'Drives conversions'] }
            const UseCaseIcon = USE_CASE_ICONS[meta.useCase] ?? Target

            return (
              <div key={template.id} className={`bg-white/[0.02] border rounded-2xl overflow-hidden group hover:border-white/[0.12] transition-all ${template.is_premium ? 'border-amber-500/15' : 'border-white/[0.05]'}`}>
                {/* Live Preview */}
                <div className="aspect-[16/10] bg-[#0f1115] relative overflow-hidden">
                  <iframe
                    srcDoc={template.html}
                    className="absolute top-0 left-0 w-[1440px] h-[900px] border-0 pointer-events-none origin-top-left"
                    style={{ transform: 'scale(var(--thumb-scale,0.25))' }}
                    title={template.name}
                    loading="lazy"
                    sandbox=""
                    ref={(el) => {
                      if (el) {
                        const obs = new ResizeObserver(([entry]) => {
                          el.style.setProperty('--thumb-scale', String(entry.contentRect.width / 1440))
                        })
                        obs.observe(el.parentElement!)
                      }
                    }}
                  />
                  {template.is_premium && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full z-10">
                      <Crown className="w-2.5 h-2.5 text-white" />
                      <span className="text-[9px] font-bold text-white">PRO</span>
                    </div>
                  )}
                  {template.is_premium && userPlan === 'starter' && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-[5]">
                      <Lock className="w-5 h-5 text-white/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-end justify-center pb-3 gap-2">
                    <button onClick={() => setPreviewId(template.id)} className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-[11px] text-white font-medium flex items-center gap-1.5 hover:bg-white/20">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button onClick={() => setFunnelViewId(template.id)} className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-[11px] text-white font-medium flex items-center gap-1.5 hover:bg-white/20">
                      <Megaphone className="w-3 h-3" /> View Funnel
                    </button>
                  </div>
                </div>

                {/* System Info */}
                <div className="p-4 space-y-3">
                  {/* Title + Social Proof */}
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-white/85 text-sm">{template.name}</h3>
                      <span className="text-[10px] text-emerald-400/70 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0 ml-2">{meta.revenue}</span>
                    </div>
                    <p className="text-[11px] text-white/30 mt-0.5 line-clamp-1">{template.description}</p>
                  </div>

                  {/* Metrics Row */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] text-white/30">
                      <UseCaseIcon className="w-3 h-3 text-cyan-400/60" /> {meta.useCase}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/30">
                      <Clock className="w-3 h-3 text-white/20" /> {meta.setupTime}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/30">
                      <Users className="w-3 h-3 text-white/20" /> {template.uses} launched
                    </div>
                  </div>

                  {/* What this system does */}
                  <div className="flex flex-wrap gap-1">
                    {meta.benefits.slice(0, 3).map(b => (
                      <span key={b} className="text-[9px] text-white/25 bg-white/[0.03] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-2 h-2 text-cyan-400/50" /> {b}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => launchSystem(template.id)}
                    disabled={cloning === template.id}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      template.is_premium && userPlan === 'starter'
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/40'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110'
                    }`}
                  >
                    {template.is_premium && userPlan === 'starter' ? (
                      <><Lock className="w-3 h-3" /> Upgrade to Launch</>
                    ) : cloning === template.id ? (
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
