'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Globe, FileText, Eye, TrendingUp, Zap } from 'lucide-react'

interface ProjectStats {
  id: string
  name: string
  slug: string
  is_published: boolean
  pageCount: number
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<ProjectStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [publishedCount, setPublishedCount] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: projs } = await supabase.from('projects').select('id, name, slug, is_published').order('created_at', { ascending: false })

      if (projs) {
        const stats: ProjectStats[] = []
        let total = 0
        let published = 0

        for (const p of projs) {
          const { count } = await supabase.from('pages').select('*', { count: 'exact', head: true }).eq('project_id', p.id)
          const pageCount = count ?? 0
          total += pageCount
          if (p.is_published) published++
          stats.push({ ...p, pageCount })
        }

        setProjects(stats)
        setTotalPages(total)
        setPublishedCount(published)
      }
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Projects', value: projects.length, icon: Globe, color: 'from-cyan-400 to-blue-500' },
    { label: 'Published Sites', value: publishedCount, icon: Eye, color: 'from-emerald-400 to-teal-500' },
    { label: 'Total Pages', value: totalPages, icon: FileText, color: 'from-violet-400 to-purple-500' },
    { label: 'AI Generations', value: '—', icon: Zap, color: 'from-amber-400 to-orange-500' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Overview of your projects and usage</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(stat => (
          <div key={stat.label} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 opacity-70`}>
              <stat.icon className="w-4.5 h-4.5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{loading ? '—' : stat.value}</p>
            <p className="text-xs text-white/30 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Projects Table */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-white/30" />
          <span className="text-sm font-semibold text-white/60">Projects Overview</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-white/20 text-sm">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-white/20 text-sm">No projects yet</div>
        ) : (
          <div>
            {projects.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between px-5 py-3 ${i < projects.length - 1 ? 'border-b border-white/[0.03]' : ''} hover:bg-white/[0.02] transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs text-white/30 font-mono">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">{p.name}</p>
                    <p className="text-[10px] text-white/25 font-mono">/{p.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-white/50">{p.pageCount} pages</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/25'}`}>
                    {p.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      <div className="mt-6 bg-gradient-to-r from-cyan-500/[0.05] to-blue-500/[0.05] border border-cyan-500/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white/60">AI Suggestions</span>
        </div>
        <div className="space-y-2">
          {[
            'Add a clear CTA above the fold on your landing pages',
            'Include social proof (testimonials) to increase conversions',
            'Optimize your page titles for SEO with target keywords',
            'Add a favicon and Open Graph image for better sharing',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-cyan-400/50 mt-0.5 shrink-0" />
              <p className="text-xs text-white/40 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
