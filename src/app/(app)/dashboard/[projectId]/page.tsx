'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Trash2, ExternalLink, Check } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string; name: string; slug: string; description: string
  custom_domain: string | null; is_published: boolean; created_at: string
}

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).single()
      if (data) setProject(data)
    }
    load()
  }, [projectId])

  async function handleSave() {
    if (!project) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('projects').update({
      name: project.name, slug: project.slug, description: project.description,
      custom_domain: project.custom_domain, is_published: project.is_published,
    }).eq('id', projectId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    if (!confirm('Are you sure? This will permanently delete this project and all its pages.')) return
    const supabase = createClient()
    await supabase.from('projects').delete().eq('id', projectId)
    router.push('/dashboard')
  }

  if (!project) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  )

  const inp = 'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-purple-500/40 focus:outline-none transition-colors'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/50" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{project.name}</h1>
          <p className="text-xs text-white/30">Project Settings</p>
        </div>
        <Link href={`/dashboard/${projectId}/editor`} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
          <ExternalLink className="w-4 h-4" /> Open Editor
        </Link>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Project Name</label>
          <input value={project.name} onChange={e => setProject({ ...project, name: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Slug</label>
          <input value={project.slug} onChange={e => setProject({ ...project, slug: e.target.value })} className={inp + ' font-mono'} />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Description</label>
          <textarea value={project.description} onChange={e => setProject({ ...project, description: e.target.value })} rows={3} className={inp + ' resize-y'} />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Custom Domain</label>
          <input value={project.custom_domain ?? ''} onChange={e => setProject({ ...project, custom_domain: e.target.value || null })} placeholder="www.example.com" className={inp} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={project.is_published} onChange={e => setProject({ ...project, is_published: e.target.checked })} className="w-4 h-4 rounded" />
          <span className="text-sm text-white/60">Published</span>
        </label>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button onClick={handleDelete} className="text-xs text-red-400/60 hover:text-red-400 flex items-center gap-1.5 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete Project
          </button>
          <button onClick={handleSave} disabled={saving} className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${saved ? 'bg-green-500/20 text-green-400' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>
            {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
