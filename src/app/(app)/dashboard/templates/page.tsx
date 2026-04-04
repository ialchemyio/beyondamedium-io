'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Layout, Download, Search, Sparkles, Eye, TrendingUp, Crown, Lock } from 'lucide-react'
import UpgradeModal from '@/components/UpgradeModal'

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

const CATEGORIES = [
  { id: 'all', label: 'All Templates', emoji: '' },
  { id: 'premium', label: 'Premium', emoji: '👑' },
  { id: 'saas', label: 'SaaS & Tech', emoji: '💻' },
  { id: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'ecommerce', label: 'E-commerce', emoji: '🛍️' },
  { id: 'realestate', label: 'Real Estate', emoji: '🏠' },
  { id: 'coaching', label: 'Coaching', emoji: '🎓' },
  { id: 'agency', label: 'Agency', emoji: '✨' },
  { id: 'medical', label: 'Medical', emoji: '🏥' },
  { id: 'legal', label: 'Legal', emoji: '⚖️' },
  { id: 'construction', label: 'Construction', emoji: '🔨' },
  { id: 'events', label: 'Events', emoji: '🎉' },
  { id: 'beauty', label: 'Beauty', emoji: '💅' },
]

const CATEGORY_COLORS: Record<string, string> = {
  saas: 'from-blue-500 to-cyan-500',
  restaurant: 'from-red-500 to-orange-500',
  fitness: 'from-green-500 to-emerald-500',
  ecommerce: 'from-purple-500 to-pink-500',
  realestate: 'from-amber-500 to-yellow-500',
  coaching: 'from-indigo-500 to-blue-500',
  agency: 'from-cyan-500 to-teal-500',
  medical: 'from-sky-500 to-blue-500',
  legal: 'from-slate-500 to-zinc-500',
  construction: 'from-orange-500 to-amber-500',
  events: 'from-pink-500 to-rose-500',
  beauty: 'from-fuchsia-500 to-pink-500',
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [cloning, setCloning] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('starter')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('uses', { ascending: false })
      setTemplates(data ?? [])
      setLoading(false)

      // Get user plan
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: credits } = await supabase.from('user_credits').select('plan').eq('user_id', user.id).single()
        if (credits) setUserPlan(credits.plan)
      }
    }
    load()
  }, [])

  const filtered = templates.filter(t => {
    if (category === 'premium' && !t.is_premium) return false
    if (category !== 'all' && category !== 'premium' && t.category !== category) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const categoryCounts = templates.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1
    return acc
  }, {})

  async function cloneTemplate(templateId: string) {
    // Check premium access
    const template = templates.find(t => t.id === templateId)
    if (template?.is_premium && userPlan === 'starter') {
      setShowUpgrade(true)
      return
    }

    setCloning(templateId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get or create project
    const { data: projects } = await supabase.from('projects').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
    let projectId = projects?.[0]?.id

    if (!projectId) {
      const { data: newProject } = await supabase.from('projects').insert({
        user_id: user.id, name: 'My Website', slug: `site-${Date.now().toString(36)}`, description: '',
      }).select().single()
      projectId = newProject?.id
    }

    if (!projectId) { setCloning(null); return }

    const res = await fetch('/api/templates/clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, projectId }),
    })
    const data = await res.json()
    setCloning(null)
    if (data.page) {
      router.push(`/dashboard/${projectId}/editor`)
    }
  }

  const previewTemplate = templates.find(t => t.id === previewId)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex flex-col" onClick={() => setPreviewId(null)}>
          <div className="h-12 flex items-center justify-between px-6 shrink-0">
            <span className="text-sm font-medium text-white/70">{previewTemplate.name}</span>
            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); cloneTemplate(previewTemplate.id) }} className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:brightness-110">
                Use This Template
              </button>
              <button onClick={() => setPreviewId(null)} className="text-xs text-white/40 hover:text-white/70">Close</button>
            </div>
          </div>
          <div className="flex-1 mx-6 mb-6 bg-white rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <iframe srcDoc={previewTemplate.html} className="w-full h-full border-0" title="Preview" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-mono">{templates.length}</span>
        </div>
        <p className="text-sm text-white/40">One-click clone. Fully customizable. Built to convert.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              category === cat.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'bg-white/[0.02] text-white/30 border border-transparent hover:text-white/50 hover:bg-white/[0.04]'
            }`}
          >
            {cat.emoji && <span>{cat.emoji}</span>}
            {cat.label}
            {cat.id !== 'all' && categoryCounts[cat.id] && (
              <span className="text-[9px] text-white/20 ml-0.5">{categoryCounts[cat.id]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="bg-white/[0.02] rounded-2xl h-72 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No templates found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(template => {
            const gradientColor = CATEGORY_COLORS[template.category] ?? 'from-gray-500 to-zinc-500'
            return (
              <div key={template.id} className={`bg-white/[0.02] border rounded-2xl overflow-hidden group hover:border-white/[0.12] transition-all hover:scale-[1.01] ${template.is_premium ? 'border-amber-500/15' : 'border-white/[0.05]'}`}>
                {/* Live Preview Thumbnail */}
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
                          const w = entry.contentRect.width
                          el.style.setProperty('--thumb-scale', String(w / 1440))
                        })
                        obs.observe(el.parentElement!)
                      }
                    }}
                  />
                  {/* Premium badge */}
                  {template.is_premium && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full z-10">
                      <Crown className="w-2.5 h-2.5 text-white" />
                      <span className="text-[9px] font-bold text-white tracking-wide">PRO</span>
                    </div>
                  )}
                  {/* Lock overlay for free users on premium */}
                  {template.is_premium && userPlan === 'starter' && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-[5]">
                      <Lock className="w-5 h-5 text-white/40" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                    <button onClick={() => setPreviewId(template.id)} className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-xs text-white font-medium flex items-center gap-1.5 hover:bg-white/20 transition-colors">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button
                      onClick={() => cloneTemplate(template.id)}
                      disabled={cloning === template.id}
                      className={`px-3 py-1.5 rounded-lg text-xs text-white font-semibold flex items-center gap-1.5 hover:brightness-110 transition-all ${
                        template.is_premium && userPlan === 'starter'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                    >
                      {template.is_premium && userPlan === 'starter' ? (
                        <><Lock className="w-3 h-3" /> Upgrade</>
                      ) : (
                        <><Download className="w-3 h-3" /> {cloning === template.id ? 'Cloning...' : 'Use'}</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-white/80 text-sm">{template.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-white/20">
                      <TrendingUp className="w-3 h-3" /> {template.uses}
                    </div>
                  </div>
                  <p className="text-[11px] text-white/30 mb-3 line-clamp-1">{template.description}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-full capitalize">{template.category}</span>
                    {template.is_premium && <span className="text-[9px] text-amber-400/60 bg-amber-500/10 px-2 py-0.5 rounded-full">Premium</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} reason="credits" />
    </div>
  )
}
