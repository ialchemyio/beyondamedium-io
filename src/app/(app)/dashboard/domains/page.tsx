'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Globe, Plus, Check, Clock, ExternalLink, Trash2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { normalizeDomain } from '@/lib/custom-domains'

interface Project { id: string; name: string; slug: string; is_published: boolean }
interface DomainRow {
  domain: string
  project_id: string
  status: 'requested' | 'active' | 'rejected'
  note: string | null
  created_at: string
  activated_at: string | null
}

// Where customers point DNS. Set by the BAM team in the environment; when unset
// we don't guess, we tell the customer the team will send the records.
const DNS_TARGET = process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_TARGET?.trim() || ''
const TARGET_IS_IP = /^\d{1,3}(\.\d{1,3}){3}$/.test(DNS_TARGET)

const inputCls = 'w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] text-white placeholder:text-white/35 focus:outline-none focus:border-[#4aa8ff]/60'

export default function DomainsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [input, setInput] = useState('')
  const [projectId, setProjectId] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: p }, { data: d }] = await Promise.all([
        supabase.from('projects').select('id, name, slug, is_published').order('created_at', { ascending: false }),
        supabase.from('custom_domains').select('domain, project_id, status, note, created_at, activated_at').order('created_at', { ascending: false }),
      ])
      setProjects(p ?? [])
      setDomains((d as DomainRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const byProject = useMemo(() => new Map(domains.map(d => [d.project_id, d])), [domains])
  const available = projects.filter(p => !byProject.has(p.id))
  const parsed = input.trim() ? normalizeDomain(input) : null
  const chosen = projects.find(p => p.id === projectId)

  async function request() {
    if (!parsed || 'error' in parsed || !projectId) return
    setBusy('request'); setError('')
    try {
      const res = await fetch('/api/domains', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, domain: parsed.domain }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) throw new Error('Your session has expired. Log in again, then request the domain.')
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      setDomains(prev => [data.domain, ...prev])
      setShowForm(false); setInput(''); setProjectId('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(null)
    }
  }

  async function remove(row: DomainRow) {
    const live = row.status === 'active'
    if (!confirm(live ? `Disconnect ${row.domain}? Visitors to it will stop seeing your site.` : `Cancel the request for ${row.domain}?`)) return
    setBusy(row.domain); setError('')
    try {
      const res = await fetch('/api/domains', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: row.project_id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Remove failed (${res.status})`)
      setDomains(prev => prev.filter(d => d.domain !== row.domain))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remove failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-[28px] font-bold text-white">Custom domains</h1>
          <p className="text-[14px] text-white/60 mt-1">Put a published site on a domain you own.</p>
        </div>
        {!showForm && available.length > 0 && (
          <button onClick={() => { setShowForm(true); setError('') }} className="bam-pill px-5 py-2.5 text-[14px]">
            <Plus className="w-4 h-4" /> Add a domain
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-200">{error}</div>
      )}

      {showForm && (
        <div className="bam-glass rounded-3xl p-6 sm:p-7 mb-8 space-y-5">
          <h2 className="font-display text-[19px] font-semibold text-white">Add a custom domain</h2>
          <div>
            <label htmlFor="d-domain" className="block text-[13px] font-medium text-white/75 mb-2">Your domain</label>
            <input id="d-domain" value={input} onChange={e => setInput(e.target.value)} placeholder="yourbusiness.com" className={`${inputCls} font-mono`} autoFocus />
            {parsed && 'error' in parsed && <p className="mt-2 text-[13px] text-amber-300">{parsed.error}</p>}
            {parsed && 'domain' in parsed && (
              <p className="mt-2 text-[13px] text-white/60">
                Your site will load at <span className="font-mono text-white">{parsed.domain}</span> and <span className="font-mono text-white">www.{parsed.domain}</span>.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="d-project" className="block text-[13px] font-medium text-white/75 mb-2">Site</label>
            <select id="d-project" value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
              <option value="" className="bg-[#0b0d14]">Choose a site…</option>
              {available.map(p => <option key={p.id} value={p.id} className="bg-[#0b0d14]">{p.name}{p.is_published ? '' : ' (not published)'}</option>)}
            </select>
            {chosen && !chosen.is_published && (
              <p className="mt-2 text-[13px] text-amber-300 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> This site isn&rsquo;t published yet. Publish it so visitors see it once the domain is live.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
            <p className="text-[13px] font-medium text-white/80">How it works</p>
            <ol className="space-y-1.5 text-[13px] text-white/65 list-decimal pl-5">
              <li>You request the domain here.</li>
              {DNS_TARGET ? (
                <li>At your domain registrar, add the DNS records below.</li>
              ) : (
                <li>The BAM team emails you the exact DNS records to add at your registrar.</li>
              )}
              <li>The BAM team connects it and sets up the security certificate, then it shows as <span className="text-emerald-300">Live</span> here.</li>
            </ol>
            {DNS_TARGET && (
              <div className="rounded-xl bg-[#0a0d14] border border-white/[0.06] overflow-hidden">
                <div className="grid grid-cols-[70px_80px_1fr] gap-3 px-3 py-2 text-[12px] text-white/50 border-b border-white/[0.06]">
                  <span>Type</span><span>Host</span><span>Value</span>
                </div>
                {TARGET_IS_IP ? (
                  <>
                    <div className="grid grid-cols-[70px_80px_1fr] gap-3 px-3 py-2 text-[13px] font-mono"><span className="text-[#8ec5ff]">A</span><span className="text-white/80">@</span><span className="text-white/80 break-all">{DNS_TARGET}</span></div>
                    <div className="grid grid-cols-[70px_80px_1fr] gap-3 px-3 py-2 text-[13px] font-mono"><span className="text-[#8ec5ff]">CNAME</span><span className="text-white/80">www</span><span className="text-white/80 break-all">{parsed && 'domain' in parsed ? parsed.domain : 'yourbusiness.com'}</span></div>
                  </>
                ) : (
                  <div className="grid grid-cols-[70px_80px_1fr] gap-3 px-3 py-2 text-[13px] font-mono"><span className="text-[#8ec5ff]">CNAME</span><span className="text-white/80">www</span><span className="text-white/80 break-all">{DNS_TARGET}</span></div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setError('') }} className="bam-pill-ghost px-5 py-2.5 text-[14px]">Cancel</button>
            <button onClick={request} disabled={!parsed || 'error' in parsed || !projectId || busy === 'request'} className="bam-pill px-5 py-2.5 text-[14px] disabled:opacity-40">
              {busy === 'request' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Request domain
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-white/50 text-[14px]">Loading…</div>
      ) : domains.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/[0.07] rounded-3xl">
          <Globe className="w-10 h-10 text-white/25 mx-auto mb-3" />
          <h2 className="font-display text-[17px] font-semibold text-white mb-1">No custom domains yet</h2>
          <p className="text-[14px] text-white/60 mb-6 px-6">Every published site already lives at beyondamedium.io/p/your-site. Add your own domain for a professional address.</p>
          {available.length > 0 ? (
            <button onClick={() => setShowForm(true)} className="bam-pill px-5 py-2.5 text-[14px]"><Plus className="w-4 h-4" /> Add a domain</button>
          ) : (
            <Link href="/dashboard/new" className="bam-pill px-5 py-2.5 text-[14px]">Build a site first</Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {domains.map(d => {
            const p = projects.find(x => x.id === d.project_id)
            return (
              <li key={d.domain} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${d.status === 'active' ? 'bg-emerald-500/15' : d.status === 'rejected' ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
                  {d.status === 'active' ? <Check className="w-5 h-5 text-emerald-300" /> : d.status === 'rejected' ? <XCircle className="w-5 h-5 text-red-300" /> : <Clock className="w-5 h-5 text-amber-300" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-[15px] text-white truncate">{d.domain}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : d.status === 'rejected' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-200'}`}>
                      {d.status === 'active' ? 'Live' : d.status === 'rejected' ? 'Not approved' : 'Requested'}
                    </span>
                  </div>
                  <p className="text-[13px] text-white/60 mt-1">
                    {p?.name ?? 'Unknown site'}
                    {d.status === 'requested' && ' · The BAM team is setting this up and will email you.'}
                    {d.status === 'rejected' && (d.note ? ` · ${d.note}` : ' · Contact the BAM team for details.')}
                    {d.status === 'active' && p && !p.is_published && ' · Site is unpublished, so visitors see a not-found page.'}
                  </p>
                </div>
                <div className="flex items-center gap-1 self-end sm:self-center">
                  {d.status === 'active' && (
                    <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${d.domain}`} className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/[0.06]">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => remove(d)} disabled={busy === d.domain} aria-label={`Remove ${d.domain}`} className="p-2 text-white/60 hover:text-red-300 rounded-lg hover:bg-white/[0.06] disabled:opacity-40">
                    {busy === d.domain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
