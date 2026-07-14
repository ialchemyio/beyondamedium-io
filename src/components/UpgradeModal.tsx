'use client'

import { useState } from 'react'
import { Zap, X, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'credits' | 'projects'
  needed?: number
}

type Plan = {
  name: string
  key?: 'builder' | 'pro'
  price: number
  caption: string
  href?: string
  external?: boolean
  color: string
  popular?: boolean
  doneForYou?: boolean
}

const plans: Plan[] = [
  { name: 'Builder', key: 'builder', price: 19, caption: '300 credits/mo', color: 'from-blue-500 to-cyan-500' },
  { name: 'Pro', key: 'pro', price: 49, caption: '1,500 credits/mo', color: 'from-cyan-500 to-blue-500', popular: true },
  { name: 'BAM', price: 99, caption: 'BAM team builds for you', href: 'https://beyondamedium.com/contact', external: true, doneForYou: true, color: 'from-amber-500 to-orange-500' },
]

const creditPacks = [
  { pack: 0, credits: 100, price: '$10' },
  { pack: 1, credits: 350, price: '$25' },
  { pack: 2, credits: 1000, price: '$60' },
]

export default function UpgradeModal({ isOpen, onClose, reason = 'credits', needed }: UpgradeModalProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function checkout(body: Record<string, unknown>, key: string) {
    setBusy(key); setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
      setBusy(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d1117] border border-white/[0.08] rounded-2xl w-full max-w-lg p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-white/30 hover:text-white/60 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {reason === 'credits' ? "You're out of AI credits" : "You've reached your project limit"}
          </h2>
          <p className="text-xs text-white/40 mt-1">
            {reason === 'credits' && needed
              ? `This action needs ${needed} credits. Upgrade for more, or grab a credit pack.`
              : 'Upgrade to continue building.'}
          </p>
        </div>

        {error && <div className="mb-4 bg-red-500/10 text-red-300 border border-red-500/20 rounded-lg px-3 py-2 text-xs">{error}</div>}

        {/* Plans */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {plans.map(plan => {
            const inner = (
              <>
                {plan.popular && <span className="text-[8px] text-cyan-400 font-bold tracking-wider">POPULAR</span>}
                {plan.doneForYou && <span className="text-[8px] text-amber-400 font-bold tracking-wider">DONE-FOR-YOU</span>}
                <p className="text-sm font-bold text-white">{plan.doneForYou && <span className="text-[9px] text-white/40">from </span>}${plan.price}<span className="text-[10px] text-white/30">/mo</span></p>
                <p className="text-[10px] text-white/50 font-medium">{plan.name}</p>
                <p className="text-[9px] text-white/25 mt-1">{plan.caption}</p>
              </>
            )
            const cls = `p-3 rounded-xl border text-center transition-all hover:scale-[1.02] ${
              plan.popular ? 'border-cyan-500/30 bg-cyan-500/[0.05]'
              : plan.doneForYou ? 'border-amber-500/30 bg-amber-500/[0.05]'
              : 'border-white/[0.06] hover:border-white/[0.1]'}`

            if (plan.external && plan.href) {
              return <a key={plan.name} href={plan.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
            }
            return (
              <button key={plan.name} onClick={() => plan.key && checkout({ plan: plan.key }, plan.key)} disabled={!!busy} className={cls}>
                {busy === plan.key ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : inner}
              </button>
            )
          })}
        </div>

        {/* Credit Packs */}
        {reason === 'credits' && (
          <>
            <div className="text-center mb-3">
              <p className="text-[10px] text-white/30">Or buy credits now</p>
            </div>
            <div className="flex gap-2 mb-4">
              {creditPacks.map(pk => (
                <button key={pk.pack} onClick={() => checkout({ mode: 'credits', pack: pk.pack }, `pack-${pk.pack}`)} disabled={!!busy}
                  className="flex-1 p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center hover:border-white/[0.1] transition-colors disabled:opacity-50">
                  {busy === `pack-${pk.pack}` ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                    <>
                      <p className="text-xs font-bold text-white">{pk.credits}</p>
                      <p className="text-[10px] text-cyan-400 font-mono">{pk.price}</p>
                    </>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        <Link
          href="/dashboard/billing"
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 text-sm font-medium rounded-xl transition-all"
        >
          See all plans &amp; manage billing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
