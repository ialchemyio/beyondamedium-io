'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Globe, Settings, ExternalLink, Layout } from 'lucide-react'
import Link from 'next/link'

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

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      setProjects(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const slug = newSlug || slugify(newName)

    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: newName.trim(), slug, description: '' })
      .select()
      .single()

    if (error) {
      alert(error.message)
      setCreating(false)
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Projects</h1>
          <p className="text-sm text-white/40 mt-1">Build and manage your websites</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-6">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Project Name</label>
                <input
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)) }}
                  placeholder="My Awesome Website"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-purple-500/40 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Slug</label>
                <input
                  value={newSlug}
                  onChange={e => setNewSlug(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-white/20 focus:border-purple-500/40 focus:outline-none"
                />
                {newSlug && <p className="text-[10px] text-white/20 mt-1">beyondamedium.io/{newSlug}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-white/5 text-white/50 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">Cancel</button>
                <button type="submit" disabled={creating || !newName.trim()} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 disabled:opacity-50 transition-colors">
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
          <h3 className="text-lg font-semibold text-white/60 mb-2">No projects yet</h3>
          <p className="text-sm text-white/30 mb-6">Create your first website to get started.</p>
          <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Layout className="w-5 h-5 text-purple-400" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${project.is_published ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                  {project.is_published ? 'Live' : 'Draft'}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-1">{project.name}</h3>
              <p className="text-xs text-white/30 mb-4">/{project.slug}</p>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/dashboard/${project.id}/editor`} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-600/30">
                  <ExternalLink className="w-3 h-3" /> Editor
                </Link>
                <Link href={`/dashboard/${project.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white/50 rounded-lg text-xs font-medium hover:bg-white/10">
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
