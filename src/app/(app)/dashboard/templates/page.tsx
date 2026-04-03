'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Layout, Download, Search, Sparkles } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  uses: number
  user_id: string
  created_at: string
}

const CATEGORIES = ['all', 'landing', 'saas', 'restaurant', 'portfolio', 'ecommerce', 'blog', 'agency', 'general']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data.templates ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = templates.filter(t => {
    if (category !== 'all' && t.category !== category) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function cloneTemplate(templateId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's first project or create one
    const { data: projects } = await supabase.from('projects').select('id').eq('user_id', user.id).limit(1)
    let projectId = projects?.[0]?.id

    if (!projectId) {
      const { data: newProject } = await supabase.from('projects').insert({
        user_id: user.id, name: 'My Website', slug: `site-${Date.now()}`, description: '',
      }).select().single()
      projectId = newProject?.id
    }

    if (!projectId) return

    const res = await fetch('/api/templates/clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, projectId }),
    })
    const data = await res.json()
    if (data.page) {
      alert(`Template cloned! Open your project editor to see it.`)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <p className="text-sm text-white/40 mt-1">Browse and clone community templates</p>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              category === cat ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-white/[0.03] text-white/30 border border-transparent hover:text-white/50'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-white/[0.02] rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No templates yet. Save a page as a template from the editor!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(template => (
            <div key={template.id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden group hover:border-white/[0.1] transition-colors">
              <div className="h-40 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 flex items-center justify-center">
                <Layout className="w-10 h-10 text-white/10" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white/80 text-sm mb-1">{template.name}</h3>
                <p className="text-xs text-white/30 mb-3 line-clamp-2">{template.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-full">{template.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/20">{template.uses} uses</span>
                    <button
                      onClick={() => cloneTemplate(template.id)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-[10px] font-medium hover:bg-cyan-500/20 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Clone
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
