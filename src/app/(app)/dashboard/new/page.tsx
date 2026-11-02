'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Wand2, AlertTriangle, Lock } from 'lucide-react'
import { DESIGN_DIRECTIONS } from '@/lib/beyond-design'
import { previewFor, readableOn } from '@/lib/direction-previews'
import { CREDIT_COSTS } from '@/lib/credit-costs'
import {
  EMPTY_BRIEF, INDUSTRY_OPTIONS, MAX_EXTRA_PAGES, PAGE_OPTIONS,
  buildSitePrompt, validateBrief, type SiteBrief,
} from '@/lib/site-brief'
import { createClient } from '@/lib/supabase/client'
import { parseQuota, quotaReached, quotaLabel, type ProjectQuota } from '@/lib/project-limits'

const STEPS = ['Business', 'Details', 'Pages', 'Design', 'Build'] as const

type Phase = 'form' | 'building' | 'done' | 'error'
interface BuildResult {
  projectId?: string
  projectName?: string
  pages?: Array<{ title: string }>
  plan?: Array<{ step: number; description: string }>
}

const inputCls = 'w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-[15px] text-white placeholder:text-white/35 focus:outline-none focus:border-[#4aa8ff]/60 focus:bg-white/[0.05] transition-colors'
const labelCls = 'block text-[13px] font-medium text-white/75 mb-2'

export default function SiteWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [brief, setBrief] = useState<SiteBrief>(EMPTY_BRIEF)
  const [servicesText, setServicesText] = useState('')
  const [style, setStyle] = useState('auto')
  const [errors, setErrors] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('form')
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<BuildResult | null>(null)
  const [failure, setFailure] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [quota, setQuota] = useState<ProjectQuota | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  // Know up front whether the plan has room for another project.
  useEffect(() => {
    createClient().rpc('my_project_quota').then(({ data }) => setQuota(parseQuota(data)), () => {})
  }, [])
  const atLimit = quotaReached(quota)
  const openProjectUpgrade = () => window.dispatchEvent(new CustomEvent('bam:show-upgrade', { detail: { reason: 'projects' } }))

  const set = <K extends keyof SiteBrief>(k: K, v: SiteBrief[K]) => setBrief(b => ({ ...b, [k]: v }))
  const fullBrief = (): SiteBrief => ({ ...brief, services: servicesText.split('\n') })

  function stepErrors(i: number): string[] {
    const b = fullBrief()
    if (i === 0) return b.name.trim() ? [] : ['Add your business name.']
    if (i === 1) return b.offer.trim() ? [] : ['Tell us what your business offers.']
    if (i === 2) return b.pages.length > MAX_EXTRA_PAGES ? [`Choose up to ${MAX_EXTRA_PAGES} pages besides Home.`] : []
    return []
  }

  function next() {
    const errs = stepErrors(step)
    setErrors(errs)
    if (!errs.length) setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  function togglePage(p: string) {
    setErrors([])
    setBrief(b => {
      if (b.pages.includes(p)) return { ...b, pages: b.pages.filter(x => x !== p) }
      if (b.pages.length >= MAX_EXTRA_PAGES) return b
      return { ...b, pages: [...b.pages, p] }
    })
  }

  async function build() {
    const b = fullBrief()
    const errs = validateBrief(b)
    setErrors(errs)
    if (errs.length) return

    setPhase('building')
    setElapsed(0)
    timer.current = setInterval(() => setElapsed(s => s + 1), 1000)
    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildSitePrompt(b), style }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 402 || data.upgrade) {
        if (data.reason === 'projects') {
          openProjectUpgrade()
          throw new Error(data.error || 'You have reached your plan\'s project limit.')
        }
        window.dispatchEvent(new CustomEvent('bam:show-upgrade', { detail: { reason: 'credits', needed: data.needed ?? CREDIT_COSTS.agent_build } }))
        throw new Error(`A full site build needs ${CREDIT_COSTS.agent_build} credits. Top up or upgrade to continue.`)
      }
      if (res.status === 401) throw new Error('Your session has expired. Log in again, then try the build again.')
      if (res.status === 429) throw new Error('Too many builds in a short time. Wait a minute, then try again.')
      if (!res.ok || data.error) throw new Error(data.error || `Build failed (${res.status})`)
      if (data.credits) window.dispatchEvent(new CustomEvent('bam:credits-updated', { detail: data.credits }))
      setResult(data)
      setPhase('done')
      if (data.projectId) setTimeout(() => router.push(`/dashboard/${data.projectId}/editor`), 4000)
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Build failed')
      setPhase('error')
    } finally {
      if (timer.current) clearInterval(timer.current)
    }
  }

  // ── Building / done / error screens ──────────────────────────
  if (phase !== 'form') {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="bam-glow-card p-8 sm:p-10 text-center">
          {phase === 'building' && (
            <>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#4aa8ff] to-[#8b5cf6] flex items-center justify-center mb-6">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
              <h1 className="font-display text-[26px] font-bold">BEYOND DESIGN is building {brief.name.trim()}</h1>
              <p className="mt-3 text-[15px] text-white/70">
                Designing and writing {1 + brief.pages.length} pages. This usually takes 40 to 90 seconds,
                so keep this tab open.
              </p>
              <p className="mt-6 font-mono text-[14px] text-[#8ec5ff]" aria-live="polite">{elapsed}s elapsed</p>
              <div className="mt-4 h-1.5 rounded-full bam-shimmer" />
            </>
          )}
          {phase === 'done' && result && (
            <>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center mb-6">
                <Check className="w-7 h-7 text-emerald-300" />
              </div>
              <h1 className="font-display text-[26px] font-bold">{result.projectName ?? brief.name} is ready</h1>
              <p className="mt-3 text-[15px] text-white/70">
                Built {result.pages?.length ?? 0} page{result.pages?.length === 1 ? '' : 's'} in {elapsed}s:{' '}
                {(result.pages ?? []).map(p => p.title).join(', ')}. Opening the editor…
              </p>
              {result.plan && result.plan.length > 0 && (
                <ol className="mt-6 text-left space-y-2 max-w-md mx-auto">
                  {result.plan.map(s => (
                    <li key={s.step} className="flex gap-3 text-[14px] text-white/75">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" /> {s.description}
                    </li>
                  ))}
                </ol>
              )}
              {result.projectId && (
                <Link href={`/dashboard/${result.projectId}/editor`} className="bam-pill mt-8 text-[15px] px-7 py-3">
                  Open the editor <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </>
          )}
          {phase === 'error' && (
            <>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-400/40 flex items-center justify-center mb-6">
                <AlertTriangle className="w-7 h-7 text-red-300" />
              </div>
              <h1 className="font-display text-[26px] font-bold">The build didn&rsquo;t finish</h1>
              <p className="mt-3 text-[15px] text-white/75">{failure}</p>
              <p className="mt-2 text-[13px] text-white/60">If credits were taken for a failed build, they have been returned.</p>
              <div className="mt-8 flex justify-center gap-3">
                <button onClick={() => setPhase('form')} className="bam-pill-ghost text-[15px] px-6 py-3">Edit answers</button>
                <button onClick={build} className="bam-pill text-[15px] px-6 py-3">Try again</button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Projects
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4aa8ff] to-[#8b5cf6] flex items-center justify-center">
          <Wand2 className="w-4.5 h-4.5 text-white" />
        </span>
        <h1 className="font-display text-[28px] sm:text-[32px] font-bold">AI Site Wizard</h1>
      </div>
      <p className="text-[15px] text-white/65 mb-8">Answer a few questions. BEYOND DESIGN writes and designs every page from your real details.</p>

      {/* Progress */}
      <ol className="grid grid-cols-5 gap-2 mb-8" aria-label="Wizard progress">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i >= step}
              className="w-full text-left disabled:cursor-default"
              aria-current={i === step ? 'step' : undefined}
            >
              <span className={`block h-1.5 rounded-full transition-colors ${i <= step ? 'bg-[#4aa8ff]' : 'bg-white/10'}`} />
              <span className={`hidden sm:block mt-2 text-[12px] ${i === step ? 'text-white' : i < step ? 'text-white/70' : 'text-white/45'}`}>{s}</span>
            </button>
          </li>
        ))}
      </ol>

      {atLimit && quota && (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="flex-1 text-[14px] text-amber-100">
            You&rsquo;ve used your plan&rsquo;s projects ({quotaLabel(quota)}). Upgrade to build another site, or rebuild an existing project from its editor.
          </p>
          <button type="button" onClick={openProjectUpgrade} className="bam-pill px-5 py-2 text-[13px] shrink-0">See plans</button>
        </div>
      )}

      <div className="bam-glass rounded-3xl p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="w-name" className={labelCls}>Business name *</label>
              <input id="w-name" value={brief.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Harbor & Vine" className={inputCls} autoFocus />
            </div>
            <fieldset>
              <legend className={labelCls}>What kind of business is it?</legend>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map(opt => (
                  <button
                    key={opt} type="button" aria-pressed={brief.industry === opt}
                    onClick={() => set('industry', brief.industry === opt ? '' : opt)}
                    className={`px-3.5 py-2 rounded-full text-[13px] border transition-colors ${brief.industry === opt ? 'border-[#4aa8ff] bg-[#1f8fff]/15 text-white' : 'border-white/10 text-white/70 hover:border-white/25'}`}
                  >{opt}</button>
                ))}
              </div>
              <input
                aria-label="Other business type"
                value={INDUSTRY_OPTIONS.includes(brief.industry as typeof INDUSTRY_OPTIONS[number]) ? '' : brief.industry}
                onChange={e => set('industry', e.target.value)}
                placeholder="Something else? Type it here"
                className={`${inputCls} mt-3`}
              />
            </fieldset>
            <div>
              <label htmlFor="w-loc" className={labelCls}>Location <span className="text-white/45">(optional)</span></label>
              <input id="w-loc" value={brief.location} onChange={e => set('location', e.target.value)} placeholder="City, State" className={inputCls} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="w-offer" className={labelCls}>What does {brief.name.trim() || 'the business'} offer? *</label>
              <textarea id="w-offer" rows={4} value={brief.offer} onChange={e => set('offer', e.target.value)} placeholder="Describe what you do, what makes it different, and the feeling you want visitors to get." className={`${inputCls} resize-y`} autoFocus />
            </div>
            <div>
              <label htmlFor="w-aud" className={labelCls}>Who is it for? <span className="text-white/45">(optional)</span></label>
              <input id="w-aud" value={brief.audience} onChange={e => set('audience', e.target.value)} placeholder="e.g. Couples and small groups looking for a special night out" className={inputCls} />
            </div>
            <div>
              <label htmlFor="w-svc" className={labelCls}>Services or products, one per line <span className="text-white/45">(optional)</span></label>
              <textarea id="w-svc" rows={3} value={servicesText} onChange={e => setServicesText(e.target.value)} placeholder={'Tasting menu\nPrivate dining\nWine pairings'} className={`${inputCls} resize-y`} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {([['phone', 'Phone', 'tel'], ['email', 'Email', 'email'], ['address', 'Address', 'text'], ['hours', 'Hours', 'text']] as const).map(([k, label, type]) => (
                <div key={k}>
                  <label htmlFor={`w-${k}`} className={labelCls}>{label} <span className="text-white/45">(optional)</span></label>
                  <input id={`w-${k}`} type={type} value={brief[k]} onChange={e => set(k, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
            <p className="text-[13px] text-white/60">Only what you enter here goes on the site. Anything you leave out becomes a marked placeholder, never a made-up fact.</p>
          </div>
        )}

        {step === 2 && (
          <fieldset>
            <legend className={labelCls}>Which pages do you need? Home is always included, plus up to {MAX_EXTRA_PAGES} more.</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
              <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border border-[#4aa8ff]/50 bg-[#1f8fff]/10">
                <Lock className="w-4 h-4 text-[#8ec5ff]" /> <span className="text-[15px]">Home</span>
              </div>
              {PAGE_OPTIONS.map(p => {
                const on = brief.pages.includes(p)
                const full = !on && brief.pages.length >= MAX_EXTRA_PAGES
                return (
                  <button
                    key={p} type="button" aria-pressed={on} onClick={() => togglePage(p)} disabled={full}
                    className={`flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border text-left transition-colors disabled:opacity-40 ${on ? 'border-[#4aa8ff] bg-[#1f8fff]/15' : 'border-white/10 hover:border-white/25'}`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${on ? 'bg-[#1f8fff] border-[#1f8fff]' : 'border-white/30'}`}>
                      {on && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="text-[15px]">{p}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-4 text-[13px] text-white/60">You can add more pages in the editor afterwards.</p>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend className={labelCls}>Pick a design direction</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
              {DESIGN_DIRECTIONS.map(d => {
                const p = previewFor(d.key)
                const on = style === d.key
                return (
                  <button
                    key={d.key} type="button" aria-pressed={on} onClick={() => setStyle(d.key)}
                    className={`rounded-2xl overflow-hidden border text-left transition-all ${on ? 'border-[#4aa8ff] ring-2 ring-[#4aa8ff]/40' : 'border-white/10 hover:border-white/25'}`}
                  >
                    <div className="aspect-[16/10] p-3 flex flex-col justify-end" style={{ background: p.bg, color: p.fg, fontFamily: p.font }}>
                      {d.key === 'auto'
                        ? <Sparkles className="w-6 h-6 text-[#8ec5ff] mb-auto" />
                        : <span className="text-[18px] leading-tight font-semibold mb-auto">Aa</span>}
                      <span className="self-start text-[11px] px-2 py-0.5 rounded-sm" style={{ background: p.accent, color: readableOn(p.accent) }}>{d.key === 'auto' ? 'AI picks' : 'Button'}</span>
                    </div>
                    <div className="px-3 py-2.5 bg-[#0b0d14]">
                      <p className="text-[14px] font-semibold text-white">{d.name}</p>
                      <p className="text-[12px] text-white/60 leading-snug">{d.tagline}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display text-[20px] font-semibold">Ready to build</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
              <div><dt className="text-white/55">Business</dt><dd className="text-white">{brief.name}{brief.industry && ` · ${brief.industry}`}</dd></div>
              <div><dt className="text-white/55">Location</dt><dd className="text-white">{brief.location || '—'}</dd></div>
              <div><dt className="text-white/55">Pages</dt><dd className="text-white">{['Home', ...brief.pages].join(', ')}</dd></div>
              <div><dt className="text-white/55">Design</dt><dd className="text-white">{DESIGN_DIRECTIONS.find(d => d.key === style)?.name}</dd></div>
              <div className="sm:col-span-2"><dt className="text-white/55">What it offers</dt><dd className="text-white/85 line-clamp-3">{brief.offer}</dd></div>
            </dl>
            <div className="flex items-center gap-3 rounded-2xl border border-[#4aa8ff]/30 bg-[#1f8fff]/10 px-4 py-3">
              <Sparkles className="w-4 h-4 text-[#8ec5ff] shrink-0" />
              <p className="text-[14px] text-white/85">This build uses <strong>{CREDIT_COSTS.agent_build} credits</strong>. If it fails, they&rsquo;re returned automatically.</p>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div role="alert" className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[14px] text-red-200">
            {errors.join(' ')}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button" onClick={() => { setErrors([]); setStep(s => Math.max(0, s - 1)) }}
            className={`bam-pill-ghost text-[14px] px-5 py-2.5 ${step === 0 ? 'invisible' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="bam-pill text-[14px] px-6 py-2.5">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={atLimit ? openProjectUpgrade : build} className="bam-pill text-[15px] px-7 py-3">
              <Sparkles className="w-4 h-4" /> {atLimit ? 'Upgrade to build' : 'Build my site'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
