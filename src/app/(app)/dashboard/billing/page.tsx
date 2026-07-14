'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Sparkles, Loader2, CreditCard, ExternalLink } from 'lucide-react'
import CreditsIndicator from '@/components/CreditsIndicator'

const PLANS = [
  { key: 'builder', name: 'Builder', price: 19, credits: '300 credits / mo', popular: false,
    features: ['5 projects', '300 AI credits / month', 'All components', 'Code export', 'Basic analytics'] },
  { key: 'pro', name: 'Pro', price: 49, credits: '1,500 credits / mo', popular: true,
    features: ['Unlimited projects', '1,500 AI credits / month', 'AI agents (full power)', 'Advanced analytics', 'Priority AI processing'] },
] as const

const CREDIT_PACKS = [
  { pack: 0, credits: 100, price: '$10' },
  { pack: 1, credits: 350, price: '$25' },
  { pack: 2, credits: 1000, price: '$60' },
] as const

function BillingInner() {
  const params = useSearchParams()
  const [plan, setPlan] = useState<string>('starter')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [refresh, setRefresh] = useState(0)

  const loadPlan = useCallback(async () => {
    try {
      const res = await fetch('/api/credits')
      if (res.ok) { const d = await res.json(); setPlan(d.plan) }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadPlan() }, [loadPlan, refresh])

  useEffect(() => {
    if (params.get('plan') === 'success') setNotice({ type: 'ok', msg: 'Subscription active — welcome aboard! Your credits are ready.' })
    else if (params.get('credits') === 'success') setNotice({ type: 'ok', msg: 'Credits added to your account.' })
    else if (params.get('plan') === 'cancelled' || params.get('credits') === 'cancelled') setNotice({ type: 'err', msg: 'Checkout cancelled — no charge was made.' })
    // Poll briefly so the webhook has time to provision before we re-read.
    if (params.get('plan') === 'success' || params.get('credits') === 'success') {
      const t = setInterval(() => setRefresh(r => r + 1), 2000)
      const stop = setTimeout(() => clearInterval(t), 12000)
      return () => { clearInterval(t); clearTimeout(stop) }
    }
  }, [params])

  async function checkout(body: Record<string, unknown>, key: string) {
    setBusy(key); setNotice(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout')
      window.location.href = data.url
    } catch (e) {
      setNotice({ type: 'err', msg: e instanceof Error ? e.message : 'Checkout failed' })
      setBusy(null)
    }
  }

  async function openPortal() {
    setBusy('portal'); setNotice(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not open billing portal')
      window.location.href = data.url
    } catch (e) {
      setNotice({ type: 'err', msg: e instanceof Error ? e.message : 'Portal failed' })
      setBusy(null)
    }
  }

  const isPaid = plan === 'builder' || plan === 'pro' || plan === 'bam'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing &amp; Credits</h1>
        <p className="text-sm text-white/40 mt-1">Manage your plan, top up AI credits, and view usage.</p>
      </div>

      {notice && (
        <div className={`rounded-xl px-4 py-3 text-sm ${notice.type === 'ok' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
          {notice.msg}
        </div>
      )}

      <CreditsIndicator variant="full" refreshTrigger={refresh} />

      {isPaid && (
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div>
            <p className="text-sm font-semibold text-white capitalize">{plan} plan active</p>
            <p className="text-xs text-white/40 mt-0.5">Update payment method, change plan, or cancel anytime.</p>
          </div>
          <button onClick={openPortal} disabled={busy === 'portal'}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
            {busy === 'portal' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Manage subscription
          </button>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-sm font-semibold text-white/70 mb-3">Plans</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {PLANS.map(p => {
            const current = plan === p.key
            return (
              <div key={p.key} className={`rounded-2xl p-5 border flex flex-col ${p.popular ? 'border-cyan-500/30 bg-cyan-500/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  {p.popular && <span className="text-[9px] font-bold tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">POPULAR</span>}
                </div>
                <p className="mt-2"><span className="text-3xl font-bold text-white">${p.price}</span><span className="text-white/30 text-xs">/mo</span></p>
                <p className="text-[11px] text-white/40 mt-1">{p.credits}</p>
                <ul className="space-y-1.5 my-4 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-white/50">
                      <Check className="w-3 h-3 mt-0.5 shrink-0 text-cyan-400/70" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => checkout({ plan: p.key }, p.key)}
                  disabled={current || busy === p.key}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
                    current ? 'bg-white/[0.04] text-white/40 cursor-default'
                    : p.popular ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110'
                    : 'bg-white/[0.06] text-white hover:bg-white/[0.1]'}`}>
                  {busy === p.key ? <Loader2 className="w-4 h-4 animate-spin" />
                    : current ? 'Current plan'
                    : <><Sparkles className="w-3.5 h-3.5" /> Upgrade to {p.name}</>}
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-white/30 mt-3">
          Subscriptions auto-renew monthly until cancelled. Cancel anytime from &ldquo;Manage subscription.&rdquo; See our{' '}
          <a href="/terms" className="text-cyan-400 hover:text-cyan-300">Terms</a>. Need a done-for-you site?{' '}
          <a href="https://beyondamedium.com/contact" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-0.5">BAM plan <ExternalLink className="w-3 h-3" /></a>
        </p>
      </div>

      {/* Credit packs */}
      <div>
        <h2 className="text-sm font-semibold text-white/70 mb-3">Buy credits</h2>
        <p className="text-[11px] text-white/40 mb-3">One-time top-ups. Purchased credits never expire while your account is active and are used before your monthly allotment.</p>
        <div className="grid grid-cols-3 gap-3">
          {CREDIT_PACKS.map(pk => (
            <button key={pk.pack} onClick={() => checkout({ mode: 'credits', pack: pk.pack }, `pack-${pk.pack}`)}
              disabled={busy === `pack-${pk.pack}`}
              className="rounded-2xl p-4 border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] text-center transition-colors disabled:opacity-50">
              {busy === `pack-${pk.pack}` ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                <>
                  <p className="text-lg font-bold text-white">{pk.credits.toLocaleString()}</p>
                  <p className="text-[10px] text-white/40">credits</p>
                  <p className="text-sm text-cyan-400 font-mono mt-1">{pk.price}</p>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-white/40" /></div>}>
      <BillingInner />
    </Suspense>
  )
}
