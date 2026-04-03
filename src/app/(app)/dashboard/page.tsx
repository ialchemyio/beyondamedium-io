'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Globe, Settings, ExternalLink, Layout, Sparkles, Bot, Loader2, Check, ArrowRight } from 'lucide-react'
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

  // Agent state
  const [agentPrompt, setAgentPrompt] = useState('')
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentSteps, setAgentSteps] = useState<Array<{ step: number; action: string; description: string; done?: boolean }>>([])

  async function runAgent() {
    if (!agentPrompt.trim() || agentRunning) return
    setAgentRunning(true)
    setAgentSteps([
      { step: 1, action: 'planning', description: 'Analyzing your requirements...' },
      { step: 2, action: 'structure', description: 'Planning site structure...' },
    ])

    try {
      // Simulate step progression
      const stepTimer = setInterval(() => {
        setAgentSteps(prev => {
          const next = [...prev]
          const pending = next.find(s => !s.done)
          if (pending) pending.done = true
          if (next.filter(s => s.done).length < 4) {
            const newSteps = [
              { step: 3, action: 'content', description: 'Writing content and copy...' },
              { step: 4, action: 'styling', description: 'Designing layout and styling...' },
              { step: 5, action: 'building', description: 'Generating production code...' },
            ]
            const added = next.length
            if (added < 5) next.push(newSteps[added - 2])
          }
          return next
        })
      }, 2000)

      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: agentPrompt }),
      })
      clearInterval(stepTimer)

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Mark all steps done
      setAgentSteps(prev => prev.map(s => ({ ...s, done: true })))
      setAgentSteps(prev => [...prev, { step: prev.length + 1, action: 'complete', description: `Site "${data.projectName}" created with ${data.pages?.length ?? 0} pages!`, done: true }])

      // Refresh projects list
      const supabase = createClient()
      const { data: projs } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      setProjects(projs ?? [])

      // Navigate to editor after short delay
      setTimeout(() => {
        if (data.projectId) router.push(`/dashboard/${data.projectId}/editor`)
      }, 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Agent failed'
      setAgentSteps(prev => [...prev, { step: prev.length + 1, action: 'error', description: msg, done: true }])
    } finally {
      setAgentRunning(false)
    }
  }

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

      {/* Agent Builder */}
      <div className="mb-8 bg-gradient-to-r from-cyan-500/[0.04] to-blue-500/[0.04] border border-cyan-500/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/80">AI Builder Agent</h2>
            <p className="text-[11px] text-white/30">Describe what you want — AI builds it autonomously</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-[#0a0e16] border border-white/[0.08] rounded-xl overflow-hidden focus-within:border-cyan-500/30 transition-colors">
            <div className="flex items-center">
              <span className="pl-3 text-cyan-400/50 text-sm font-mono">$</span>
              <input
                value={agentPrompt}
                onChange={e => setAgentPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runAgent() }}
                placeholder="Build me a gym landing page with booking and pricing..."
                className="flex-1 px-3 py-3 bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none font-mono"
                disabled={agentRunning}
              />
              <button
                onClick={runAgent}
                disabled={agentRunning || !agentPrompt.trim()}
                className="px-5 py-2 m-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:brightness-110 disabled:opacity-30 transition-all flex items-center gap-1.5"
              >
                {agentRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {agentRunning ? 'Building...' : 'Build'}
              </button>
            </div>
          </div>
        </div>

        {/* Agent Timeline */}
        {agentSteps.length > 0 && (
          <div className="space-y-1.5 mt-4">
            {agentSteps.map((step) => (
              <div key={step.step} className="flex items-center gap-2.5">
                {step.done ? (
                  step.action === 'error' ?
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0"><span className="text-red-400 text-[10px]">!</span></div> :
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-emerald-400" /></div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0"><Loader2 className="w-3 h-3 text-cyan-400 animate-spin" /></div>
                )}
                <span className={`text-xs ${step.action === 'error' ? 'text-red-400' : step.action === 'complete' ? 'text-emerald-400 font-medium' : step.done ? 'text-white/40' : 'text-white/60'}`}>
                  {step.description}
                </span>
                {step.action === 'complete' && (
                  <ArrowRight className="w-3 h-3 text-emerald-400 ml-1" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick prompts */}
        {agentSteps.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              'SaaS landing page with pricing',
              'Restaurant site with menu and booking',
              'Portfolio for a photographer',
              'Fitness studio with class schedule',
            ].map(p => (
              <button
                key={p}
                onClick={() => setAgentPrompt(p)}
                className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[10px] text-white/30 hover:text-white/50 hover:border-white/[0.1] transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}
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
