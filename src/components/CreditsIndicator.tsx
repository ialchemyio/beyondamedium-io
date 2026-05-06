'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Zap, AlertTriangle, ArrowRight, X, TrendingDown } from 'lucide-react'
import Link from 'next/link'

interface CreditState {
  plan: string
  monthly: number
  remaining: number
  purchased: number
  total: number
  used: number
  usagePercent: number
  warningLevel: 'none' | 'warn' | 'urgent' | 'critical'
}

interface CreditsIndicatorProps {
  variant?: 'compact' | 'full' | 'banner'
  refreshTrigger?: number  // bump this to force re-fetch
}

export default function CreditsIndicator({ variant = 'compact', refreshTrigger = 0 }: CreditsIndicatorProps) {
  const [state, setState] = useState<CreditState | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/credits')
      if (!res.ok) return
      const data = await res.json()
      setState(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchCredits() }, [fetchCredits, refreshTrigger])

  // Listen for global credit-update events (fired after AI calls)
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail as Partial<CreditState> | undefined
      if (detail) setState(prev => prev ? { ...prev, ...detail } : null)
      else fetchCredits()
    }
    window.addEventListener('bam:credits-updated', handler)
    return () => window.removeEventListener('bam:credits-updated', handler)
  }, [fetchCredits])

  if (!state) return null

  const { remaining, monthly, total, usagePercent, warningLevel, plan } = state

  // Color scheme based on warning level
  const colors = {
    none: { bg: 'bg-white/[0.04]', text: 'text-white/60', accent: 'bg-cyan-500', glow: '' },
    warn: { bg: 'bg-amber-500/10', text: 'text-amber-300', accent: 'bg-amber-500', glow: 'shadow-amber-500/20' },
    urgent: { bg: 'bg-orange-500/15', text: 'text-orange-300', accent: 'bg-orange-500', glow: 'shadow-orange-500/30' },
    critical: { bg: 'bg-red-500/15', text: 'text-red-300', accent: 'bg-red-500', glow: 'shadow-red-500/40 animate-pulse' },
  }
  const c = colors[warningLevel]

  // ─── Compact (header) ─────────────────────────────────────
  if (variant === 'compact') {
    return (
      <Link
        href="/dashboard/billing"
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg ${c.bg} hover:brightness-110 transition-all`}
      >
        <Sparkles className={`w-3 h-3 ${c.text}`} />
        <span className={`text-[11px] font-mono ${c.text}`}>{total}</span>
        <div className="w-12 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className={`h-full ${c.accent} transition-all`} style={{ width: `${usagePercent}%` }} />
        </div>
      </Link>
    )
  }

  // ─── Banner (escalating warnings) ─────────────────────────
  if (variant === 'banner') {
    if (warningLevel === 'none' || dismissed) return null

    if (warningLevel === 'warn') {
      return (
        <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-xs text-amber-300"><strong>{remaining}</strong> credits left this month — you've used {usagePercent}%</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/billing" className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Top up <ArrowRight className="w-3 h-3" />
            </Link>
            <button onClick={() => setDismissed(true)} className="p-0.5 text-amber-400/40 hover:text-amber-400/70"><X className="w-3 h-3" /></button>
          </div>
        </div>
      )
    }

    if (warningLevel === 'urgent') {
      return (
        <div className="bg-orange-500/[0.1] border border-orange-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 mb-4 shadow-lg shadow-orange-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <p className="text-sm text-orange-300 font-semibold">Almost out of credits</p>
              <p className="text-[11px] text-orange-400/70">Only <strong>{remaining}</strong> credits left ({usagePercent}% used). Upgrade now to keep building uninterrupted.</p>
            </div>
          </div>
          <Link href="/dashboard/billing" className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-lg hover:brightness-110 whitespace-nowrap">
            Upgrade — Save 20%
          </Link>
        </div>
      )
    }

    if (warningLevel === 'critical') {
      return (
        <div className="bg-gradient-to-r from-red-500/[0.12] to-orange-500/[0.12] border border-red-500/40 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 mb-4 shadow-xl shadow-red-500/20 animate-pulse-soft">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-red-300 font-bold">{remaining === 0 ? 'You\'re out of credits' : `${remaining} credit${remaining === 1 ? '' : 's'} left — keep your momentum going`}</p>
              <p className="text-[11px] text-red-200/70">Don't lose your flow. Upgrade now and unlock unlimited AI power.</p>
            </div>
          </div>
          <Link href="/dashboard/billing" className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-lg hover:brightness-110 whitespace-nowrap shadow-lg">
            🔥 Get More Credits
          </Link>
        </div>
      )
    }
  }

  // ─── Full (settings/billing page) ─────────────────────────
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider">AI Credits</p>
          <p className="text-2xl font-bold text-white">{total} <span className="text-sm text-white/30">/ {monthly} /mo</span></p>
        </div>
        <span className="text-[10px] text-white/40 font-mono uppercase bg-white/[0.04] px-2.5 py-1 rounded-full">{plan}</span>
      </div>

      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden mb-2">
        <div className={`h-full ${c.accent} transition-all`} style={{ width: `${usagePercent}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/30">
        <span>{state.used} used</span>
        <span>{remaining} remaining</span>
      </div>
    </div>
  )
}
