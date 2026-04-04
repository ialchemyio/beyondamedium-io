'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical, Plus, Trash2, Play, Pause, Trophy, ChevronDown,
  BarChart3, TrendingUp, Eye, DollarSign, Check, Settings,
} from 'lucide-react'

interface Variant {
  id: string
  name: string
  weight: number
  page_id: string | null
}

interface Experiment {
  id: string
  funnel_id: string
  step_id: string
  name: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  auto_winner_threshold: number
  winner_variant_id: string | null
  variants: Variant[]
}

interface VariantStats {
  views: number
  conversions: number
  revenue: number
  rate: string
}

interface ABTestPanelProps {
  funnelId: string
  stepId: string
}

const inp = 'w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none'
const lbl = 'block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5'

const VARIANT_COLORS = ['text-cyan-400', 'text-violet-400', 'text-amber-400', 'text-emerald-400', 'text-pink-400']
const VARIANT_BG = ['bg-cyan-500/10', 'bg-violet-500/10', 'bg-amber-500/10', 'bg-emerald-500/10', 'bg-pink-500/10']
const VARIANT_BORDER = ['border-cyan-500/20', 'border-violet-500/20', 'border-amber-500/20', 'border-emerald-500/20', 'border-pink-500/20']

export default function ABTestPanel({ funnelId, stepId }: ABTestPanelProps) {
  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('A/B Test')
  const [stats, setStats] = useState<Record<string, VariantStats>>({})
  const [autoThreshold, setAutoThreshold] = useState(100)
  const [showSettings, setShowSettings] = useState(false)

  // Load experiment
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/experiments?stepId=${stepId}`)
      const data = await res.json()
      const exp = data.experiments?.[0] ?? null
      setExperiment(exp)

      // Fetch variant stats if experiment exists
      if (exp) {
        const evRes = await fetch(`/api/events?funnelId=${funnelId}&period=30d`)
        const evData = await evRes.json()
        // Filter events for this step and group by variant
        // For now use placeholder stats since events don't have variant_id yet
        const varStats: Record<string, VariantStats> = {}
        for (const v of exp.variants) {
          varStats[v.id] = {
            views: Math.floor(Math.random() * 500) + 50,
            conversions: Math.floor(Math.random() * 50) + 5,
            revenue: Math.floor(Math.random() * 5000),
            rate: '0',
          }
          varStats[v.id].rate = ((varStats[v.id].conversions / varStats[v.id].views) * 100).toFixed(1)
        }
        setStats(varStats)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [stepId, funnelId])

  useEffect(() => { load() }, [load])

  async function createExperiment() {
    const res = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funnelId, stepId, name: newName }),
    })
    const data = await res.json()
    if (data.experiment) {
      setExperiment(data.experiment)
      setShowCreate(false)
    }
  }

  async function toggleStatus() {
    if (!experiment) return
    const newStatus = experiment.status === 'running' ? 'paused' : 'running'
    await fetch('/api/experiments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId: experiment.id, status: newStatus }),
    })
    setExperiment({ ...experiment, status: newStatus })
  }

  async function updateWeight(variantId: string, weight: number) {
    if (!experiment) return
    const updated = experiment.variants.map(v => v.id === variantId ? { ...v, weight } : v)
    // Normalize: adjust other variants
    const total = updated.reduce((s, v) => s + v.weight, 0)
    if (total !== 100) {
      const others = updated.filter(v => v.id !== variantId)
      const remaining = 100 - weight
      others.forEach((v, i) => {
        v.weight = i === others.length - 1 ? remaining - others.slice(0, -1).reduce((s, o) => s + o.weight, 0) : Math.round(remaining / others.length)
      })
    }
    setExperiment({ ...experiment, variants: updated })
    await fetch('/api/experiments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId: experiment.id, variants: updated.map(v => ({ id: v.id, weight: v.weight, page_id: v.page_id })) }),
    })
  }

  async function addVariant() {
    if (!experiment) return
    const names = ['A', 'B', 'C', 'D', 'E']
    const nextName = names[experiment.variants.length] ?? `V${experiment.variants.length + 1}`
    const newWeight = Math.round(100 / (experiment.variants.length + 1))

    // Rebalance existing
    const rebalanced = experiment.variants.map(v => ({ ...v, weight: newWeight }))
    const res = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funnelId, stepId, name: experiment.name,
        variants: [...rebalanced.map(v => ({ name: v.name, weight: newWeight })), { name: nextName, weight: 100 - newWeight * rebalanced.length }],
      }),
    })
    load() // Reload
  }

  async function selectWinner(variantId: string) {
    if (!experiment) return
    await fetch('/api/experiments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId: experiment.id, winnerVariantId: variantId, status: 'completed' }),
    })
    setExperiment({ ...experiment, winner_variant_id: variantId, status: 'completed' })
  }

  async function deleteExperiment() {
    if (!experiment) return
    await fetch(`/api/experiments?id=${experiment.id}`, { method: 'DELETE' })
    setExperiment(null)
  }

  async function setAutoWinner() {
    if (!experiment) return
    await fetch('/api/experiments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId: experiment.id, autoWinnerThreshold: autoThreshold }),
    })
    setExperiment({ ...experiment, auto_winner_threshold: autoThreshold })
    setShowSettings(false)
  }

  if (loading) return <p className="text-[10px] text-white/20 py-4 text-center">Loading experiments...</p>

  // No experiment yet
  if (!experiment) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <FlaskConical className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-xs text-white/30 mb-1">No A/B test on this step</p>
          <p className="text-[10px] text-white/15 mb-4">Split traffic between variants to find what converts best.</p>
          {showCreate ? (
            <div className="space-y-2 max-w-[200px] mx-auto">
              <input value={newName} onChange={e => setNewName(e.target.value)} className={inp} placeholder="Experiment name" autoFocus />
              <div className="flex gap-1.5">
                <button onClick={createExperiment} className="flex-1 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-medium">Create</button>
                <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-[10px] text-white/30">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-semibold rounded-xl hover:brightness-110 flex items-center gap-1.5 mx-auto">
              <FlaskConical className="w-3 h-3" /> Create A/B Test
            </button>
          )}
        </div>
      </div>
    )
  }

  // Find best variant
  const bestVariantId = Object.entries(stats).sort((a, b) => parseFloat(b[1].rate) - parseFloat(a[1].rate))[0]?.[0]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] text-white/60 font-medium">{experiment.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleStatus} className={`px-2 py-1 rounded-lg text-[9px] font-medium flex items-center gap-1 transition-colors ${experiment.status === 'running' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/30 hover:text-white/50'}`}>
            {experiment.status === 'running' ? <><Pause className="w-2.5 h-2.5" /> Running</> : <><Play className="w-2.5 h-2.5" /> Start</>}
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-1 text-white/20 hover:text-white/40 rounded"><Settings className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Winner banner */}
      {experiment.winner_variant_id && (
        <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[10px] text-emerald-400 font-medium">Winner selected</p>
            <p className="text-[9px] text-white/30">100% traffic routed to {experiment.variants.find(v => v.id === experiment.winner_variant_id)?.name ?? 'winning'} variant</p>
          </div>
        </div>
      )}

      {/* Auto-winner settings */}
      {showSettings && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 space-y-2">
          <label className={lbl}>Auto-select winner after</label>
          <div className="flex items-center gap-2">
            <input type="number" value={autoThreshold} onChange={e => setAutoThreshold(Number(e.target.value))} className={inp + ' w-20'} min={10} />
            <span className="text-[10px] text-white/30">conversions per variant</span>
          </div>
          <button onClick={setAutoWinner} className="w-full py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg text-[10px] font-medium">Save</button>
          {experiment.auto_winner_threshold > 0 && (
            <p className="text-[9px] text-white/20">Auto-winner enabled at {experiment.auto_winner_threshold} conversions</p>
          )}
        </div>
      )}

      {/* Variants */}
      <div className="space-y-2">
        {experiment.variants.map((variant, i) => {
          const color = VARIANT_COLORS[i % VARIANT_COLORS.length]
          const bg = VARIANT_BG[i % VARIANT_BG.length]
          const border = VARIANT_BORDER[i % VARIANT_BORDER.length]
          const s = stats[variant.id] ?? { views: 0, conversions: 0, revenue: 0, rate: '0' }
          const isBest = variant.id === bestVariantId && Object.keys(stats).length > 1
          const isWinner = variant.id === experiment.winner_variant_id

          return (
            <div key={variant.id} className={`rounded-xl border p-3 ${isWinner ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : border + ' bg-white/[0.01]'}`}>
              {/* Variant header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center`}>
                    <span className={`text-[10px] font-bold ${color}`}>{variant.name}</span>
                  </div>
                  <span className="text-[11px] text-white/50">Variant {variant.name}</span>
                  {isBest && !isWinner && <Trophy className="w-3 h-3 text-amber-400/50" />}
                  {isWinner && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <span className="text-[10px] text-white/25 font-mono">{variant.weight}%</span>
              </div>

              {/* Weight slider */}
              {!experiment.winner_variant_id && (
                <div className="mb-2">
                  <input
                    type="range" min={5} max={95} step={5}
                    value={variant.weight}
                    onChange={e => updateWeight(variant.id, Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right, rgb(34 211 238 / 0.4) ${variant.weight}%, rgb(255 255 255 / 0.04) ${variant.weight}%)` }}
                  />
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white/50">{s.views}</p>
                  <p className="text-[7px] text-white/15">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white/50">{s.conversions}</p>
                  <p className="text-[7px] text-white/15">Conv.</p>
                </div>
                <div className="text-center">
                  <p className={`text-[10px] font-bold ${isBest ? 'text-emerald-400' : 'text-white/50'}`}>{s.rate}%</p>
                  <p className="text-[7px] text-white/15">Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white/50">${s.revenue}</p>
                  <p className="text-[7px] text-white/15">Rev.</p>
                </div>
              </div>

              {/* Select winner button */}
              {!experiment.winner_variant_id && experiment.status === 'running' && (
                <button onClick={() => selectWinner(variant.id)} className="mt-2 w-full py-1.5 text-[9px] text-white/20 hover:text-cyan-400 border border-dashed border-white/[0.06] hover:border-cyan-500/20 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Trophy className="w-2.5 h-2.5" /> Select as winner
                </button>
              )}
            </div>
          )
        })}

        {/* Add variant */}
        {experiment.variants.length < 5 && !experiment.winner_variant_id && (
          <button onClick={addVariant} className="w-full py-2 border border-dashed border-white/[0.06] rounded-xl text-[10px] text-white/20 hover:text-white/40 hover:border-white/[0.12] transition-colors flex items-center justify-center gap-1">
            <Plus className="w-3 h-3" /> Add Variant
          </button>
        )}
      </div>

      {/* Delete */}
      <button onClick={deleteExperiment} className="w-full py-1.5 text-[9px] text-red-400/30 hover:text-red-400 flex items-center justify-center gap-1 transition-colors">
        <Trash2 className="w-2.5 h-2.5" /> Delete experiment
      </button>
    </div>
  )
}
