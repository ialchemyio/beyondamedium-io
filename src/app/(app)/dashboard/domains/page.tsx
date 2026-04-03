'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Globe, Plus, Check, AlertCircle, ExternalLink, Trash2, Shield } from 'lucide-react'

interface Project {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  is_published: boolean
}

export default function DomainsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showConnect, setShowConnect] = useState(false)
  const [domain, setDomain] = useState('')
  const [selectedProject, setSelectedProject] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('projects').select('id, name, slug, custom_domain, is_published').order('created_at', { ascending: false })
      setProjects(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function connectDomain() {
    if (!domain.trim() || !selectedProject) return
    const supabase = createClient()
    await supabase.from('projects').update({ custom_domain: domain.trim() }).eq('id', selectedProject)
    setProjects(projects.map(p => p.id === selectedProject ? { ...p, custom_domain: domain.trim() } : p))
    setShowConnect(false)
    setDomain('')
    setSelectedProject('')
  }

  async function removeDomain(projectId: string) {
    const supabase = createClient()
    await supabase.from('projects').update({ custom_domain: null }).eq('id', projectId)
    setProjects(projects.map(p => p.id === projectId ? { ...p, custom_domain: null } : p))
  }

  const connectedProjects = projects.filter(p => p.custom_domain)
  const unconnectedProjects = projects.filter(p => !p.custom_domain)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Domains</h1>
          <p className="text-sm text-white/40 mt-1">Connect your own domains to published sites</p>
        </div>
        <button onClick={() => setShowConnect(true)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Connect Domain
        </button>
      </div>

      {/* Connect Domain Modal */}
      {showConnect && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/70">Connect a Custom Domain</h3>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Domain Name</label>
            <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="www.yourdomain.com" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white font-mono placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Connect to Project</label>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:border-cyan-500/30 focus:outline-none">
              <option value="">Select a project...</option>
              {unconnectedProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* DNS Instructions */}
          {domain && (
            <div className="bg-cyan-500/[0.04] border border-cyan-500/10 rounded-xl p-4 space-y-3">
              <p className="text-xs text-white/50 font-medium">Configure these DNS records at your registrar:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-4 bg-[#0a0e16] rounded-lg px-3 py-2">
                  <span className="text-[10px] text-white/30 font-mono w-12">Type</span>
                  <span className="text-[10px] text-white/30 font-mono w-20">Host</span>
                  <span className="text-[10px] text-white/30 font-mono flex-1">Value</span>
                </div>
                <div className="flex items-center gap-4 bg-[#0a0e16] rounded-lg px-3 py-2">
                  <span className="text-xs text-cyan-400 font-mono w-12">A</span>
                  <span className="text-xs text-white/60 font-mono w-20">@</span>
                  <span className="text-xs text-white/60 font-mono flex-1">76.76.21.21</span>
                </div>
                <div className="flex items-center gap-4 bg-[#0a0e16] rounded-lg px-3 py-2">
                  <span className="text-xs text-cyan-400 font-mono w-12">CNAME</span>
                  <span className="text-xs text-white/60 font-mono w-20">www</span>
                  <span className="text-xs text-white/60 font-mono flex-1">cname.vercel-dns.com</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400/60" />
                <span className="text-[10px] text-white/30">SSL certificate will be auto-provisioned after DNS propagation</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setShowConnect(false)} className="px-4 py-2 text-xs text-white/40">Cancel</button>
            <button onClick={connectDomain} disabled={!domain.trim() || !selectedProject} className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 disabled:opacity-30 transition-all">Connect</button>
          </div>
        </div>
      )}

      {/* Connected Domains */}
      {loading ? (
        <div className="text-center py-12 text-white/20 text-sm">Loading...</div>
      ) : connectedProjects.length === 0 && !showConnect ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <Globe className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white/40 mb-1">No domains connected</h3>
          <p className="text-xs text-white/20 mb-6">Connect your own domain to give your site a professional URL</p>
        </div>
      ) : (
        <div className="space-y-3">
          {connectedProjects.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.08] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70 font-mono">{p.custom_domain}</p>
                  <p className="text-[10px] text-white/25">{p.name} &middot; {p.is_published ? 'Published' : 'Draft'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`https://${p.custom_domain}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-white/20 hover:text-white/50 rounded-lg transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => removeDomain(p.id)} className="p-1.5 text-white/20 hover:text-red-400 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
