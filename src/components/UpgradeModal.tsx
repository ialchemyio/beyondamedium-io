'use client'

import { Zap, X, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'credits' | 'projects'
  needed?: number
}

const plans = [
  { name: 'Builder', price: 19, credits: 100, projects: 5, color: 'from-blue-500 to-cyan-500' },
  { name: 'Pro', price: 39, credits: 400, projects: 'Unlimited', color: 'from-cyan-500 to-blue-500', popular: true },
  { name: 'BAM', price: 99, credits: 1000, projects: 'Unlimited', color: 'from-amber-500 to-orange-500' },
]

const creditPacks = [
  { credits: 50, price: '$10' },
  { credits: 150, price: '$25' },
  { credits: 500, price: '$60' },
]

export default function UpgradeModal({ isOpen, onClose, reason = 'credits', needed }: UpgradeModalProps) {
  if (!isOpen) return null

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
            {reason === 'credits' ? "You've reached your AI limit" : "You've reached your project limit"}
          </h2>
          <p className="text-xs text-white/40 mt-1">
            {reason === 'credits' && needed
              ? `This action requires ${needed} credits. Upgrade your plan or buy credits.`
              : 'Upgrade to continue building.'}
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {plans.map(plan => (
            <Link
              key={plan.name}
              href="/signup"
              className={`p-3 rounded-xl border text-center transition-all hover:scale-[1.02] ${
                plan.popular ? 'border-cyan-500/30 bg-cyan-500/[0.05]' : 'border-white/[0.06] hover:border-white/[0.1]'
              }`}
            >
              {plan.popular && <span className="text-[8px] text-cyan-400 font-bold tracking-wider">POPULAR</span>}
              <p className="text-sm font-bold text-white">${plan.price}<span className="text-[10px] text-white/30">/mo</span></p>
              <p className="text-[10px] text-white/50 font-medium">{plan.name}</p>
              <p className="text-[9px] text-white/25 mt-1">{plan.credits} credits/mo</p>
            </Link>
          ))}
        </div>

        {/* Credit Packs */}
        {reason === 'credits' && (
          <>
            <div className="text-center mb-3">
              <p className="text-[10px] text-white/30">Or buy credits now</p>
            </div>
            <div className="flex gap-2 mb-4">
              {creditPacks.map(pack => (
                <button key={pack.credits} className="flex-1 p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center hover:border-white/[0.1] transition-colors">
                  <p className="text-xs font-bold text-white">{pack.credits}</p>
                  <p className="text-[10px] text-cyan-400 font-mono">{pack.price}</p>
                </button>
              ))}
            </div>
          </>
        )}

        <Link
          href="/signup"
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
        >
          <Sparkles className="w-4 h-4" /> Upgrade Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
