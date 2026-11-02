'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Globe, Settings, ExternalLink, Layout, Wand2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { isProjectLimitError, parseQuota, quotaReached, quotaLabel, type ProjectQuota } from '@/lib/project-limits'
import { newProjectSettings } from '@/lib/theme'

interface Project {
  id: string
  name: string
  slug: string
  description: string
  is_published: boolean
  created_at: string
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [quota, setQuota] = useState<ProjectQuota | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data }, { data: quotaRow }] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.rpc('my_project_quota'),
      ])
      setProjects(data ?? [])
      setQuota(parseQuota(quotaRow))
      setLoading(false)
    }
    load()
  }, [])

  const atLimit = quotaReached(quota)
  const openProjectUpgrade = () => window.dispatchEvent(new CustomEvent('bam:show-upgrade', { detail: { reason: 'projects' } }))
  // At the plan limit, "new project" actions open the upgrade modal instead.
  const startBlank = () => (atLimit ? openProjectUpgrade() : setShowCreate(true))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCreating(false); return }

    const slug = newSlug || slugify(newName)

    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: newName.trim(), slug, description: '', settings: newProjectSettings() })
      .select()
      .single()

    if (error) {
      setCreating(false)
      if (isProjectLimitError(error)) {
        setShowCreate(false)
        openProjectUpgrade()
        return
      }
      alert(error.message)
      return
    }

    // Create default home page
    await supabase.from('pages').insert({
      project_id: data.id,
      title: 'Home',
      slug: 'index',
      is_home: true,
      sort_order: 0,
    })

    router.push(`/dashboard/${data.id}`)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-[28px] font-bold text-white">Your projects</h1>
          <p className="text-[14px] text-white/60 mt-1">Build, edit, and publish your websites.</p>
        </div>
        <div className="flex items-center gap-3">
          {quota && (
            <span className={`text-[12px] px-3 py-1.5 rounded-full border ${atLimit ? 'border-amber-400/35 bg-amber-500/10 text-amber-200' : 'border-white/10 text-white/65'}`}>
              {quotaLabel(quota)}
            </span>
          )}
          <button onClick={startBlank} className="bam-pill-ghost px-5 py-2.5 text-[14px]">
            <Plus className="w-4 h-4" /> Blank project
          </button>
        </div>
      </div>

      {atLimit && (
        <div role="status" className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="flex-1 text-[14px] text-amber-100">
            Your plan&rsquo;s project limit is reached. Upgrade to create more sites. You can still edit and rebuild the projects you have.
          </p>
          <button onClick={openProjectUpgrade} className="bam-pill px-5 py-2 text-[13px] shrink-0">See plans</button>
        </div>
      )}

      {/* AI Site Wizard launch card */}
      <Link
        href="/dashboard/new"
        className="group bam-glow-card mb-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6"
      >
        <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4aa8ff] to-[#8b5cf6] flex items-center justify-center shrink-0">
          <Wand2 className="w-7 h-7 text-white" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-[22px] font-bold text-white">Build a site with AI</h2>
          <p className="text-[15px] text-white/65 mt-1">
            Answer a few questions about your business and BEYOND DESIGN writes and designs every page.
          </p>
        </div>
        <span className="bam-pill px-6 py-3 text-[14px] self-start sm:self-center">
          Start the wizard <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0b0d14] border border-white/10 rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-[20px] font-semibold text-white mb-6">New blank project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Project Name</label>
                <input
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)) }}
                  placeholder="My Awesome Website"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-[#4aa8ff]/60 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Slug</label>
                <input
                  value={newSlug}
                  onChange={e => setNewSlug(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-white/20 focus:border-[#4aa8ff]/60 focus:outline-none"
                />
                {newSlug && <p className="text-[12px] text-white/50 mt-1">beyondamedium.io/p/{newSlug}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-white/5 text-white/50 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">Cancel</button>
                <button type="submit" disabled={creating || !newName.trim()} className="flex-1 bam-pill py-2.5 text-sm disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white/[0.02] rounded-2xl h-48 animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
          <Globe className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-sm text-white/60 mb-6">Create your first website to get started.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/new" className="bam-pill px-6 py-2.5 text-sm"><Wand2 className="w-4 h-4" /> Build with AI</Link>
            <button onClick={startBlank} className="bam-pill-ghost px-6 py-2.5 text-sm">Blank project</button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 hover:border-[#4aa8ff]/35 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1f8fff]/12 flex items-center justify-center">
                  <Layout className="w-5 h-5 text-[#6db8ff]" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${project.is_published ? 'bg-emerald-500/12 text-emerald-300' : 'bg-white/5 text-white/60'}`}>
                  {project.is_published ? 'Live' : 'Draft'}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-1">{project.name}</h3>
              <p className="text-xs text-white/55 mb-4">/p/{project.slug}</p>
              <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                <Link href={`/dashboard/${project.id}/editor`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f8fff]/15 text-[#a9d4ff] rounded-lg text-xs font-medium hover:bg-[#1f8fff]/25">
                  <ExternalLink className="w-3 h-3" /> Editor
                </Link>
                <Link href={`/dashboard/${project.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white/70 rounded-lg text-xs font-medium hover:bg-white/10">
                  <Settings className="w-3 h-3" /> Settings
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
