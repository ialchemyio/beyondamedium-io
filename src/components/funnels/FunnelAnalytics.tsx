'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Eye,
  AlertTriangle, Lightbulb, Clock, ChevronDown, Zap, Target,
} from 'lucide-react'
import type { Node } from '@xyflow/react'

interface StepAnalytics {
  views: number
  clicks: number
  conversions: number
  payments: number
  revenue: number
}

interface FunnelSummary {
  totalViews: number
  totalConversions: number
  totalRevenue: number
  overallConversionRate: string
  highestDropoff: { stepId: string; dropoff: number; rate: number }
  period: string
}

interface FunnelAnalyticsProps {
  funnelId: string
  nodes: Node[]
  onUpdateNodeData?: (nodeId: string, data: Record<string, unknown>) => void
}

// AI insights heuristics
function generateInsights(steps: Record<string, StepAnalytics>, nodes: Node[], summary: FunnelSummary) {
  const insights: Array<{ type: 'warning' | 'tip' | 'success'; text: string }> = []

  // High drop-off detection
  if (summary.highestDropoff.rate > 50) {
    const node = nodes.find(n => n.id === summary.highestDropoff.stepId)
    const label = node ? (node.data as Record<string, string>).label : summary.highestDropoff.stepId
    insights.push({ type: 'warning', text: `High drop-off at "${label}" — ${summary.highestDropoff.rate.toFixed(0)}% of visitors leave. Consider simplifying this step.` })
  }

  // Low conversion rate
  if (parseFloat(summary.overallConversionRate) < 3 && summary.totalViews > 50) {
    insights.push({ type: 'tip', text: 'Overall conversion is below 3%. Try adding urgency (countdown timer) or stronger social proof to your landing page.' })
  }

  // Good conversion
  if (parseFloat(summary.overallConversionRate) > 10) {
    insights.push({ type: 'success', text: `Strong ${summary.overallConversionRate}% conversion rate. Consider scaling traffic to this funnel.` })
  }

  // Steps with zero conversions
  const stepsWithViews = Object.entries(steps).filter(([, s]) => s.views > 10 && s.conversions === 0)
  if (stepsWithViews.length > 0) {
    insights.push({ type: 'warning', text: `${stepsWithViews.length} step(s) have views but zero conversions. Review CTAs and form friction.` })
  }

  // Revenue optimization
  const upsellSteps = Object.entries(steps).filter(([id]) => {
    const node = nodes.find(n => n.id === id)
    return node && (node.data as Record<string, string>).stepType === 'upsell'
  })
  if (upsellSteps.length > 0) {
    const upsellConversions = upsellSteps.reduce((s, [, data]) => s + data.conversions, 0)
    const upsellViews = upsellSteps.reduce((s, [, data]) => s + data.views, 0)
    if (upsellViews > 0 && (upsellConversions / upsellViews) < 0.15) {
      insights.push({ type: 'tip', text: 'Upsell conversion is below 15%. Try a time-limited discount or bundle offer.' })
    }
  }

  // Default tips
  if (insights.length === 0 && summary.totalViews === 0) {
    insights.push({ type: 'tip', text: 'No traffic yet. Publish your funnel and drive visitors to start tracking conversions.' })
  }

  return insights
}

export default function FunnelAnalytics({ funnelId, nodes, onUpdateNodeData }: FunnelAnalyticsProps) {
  const [steps, setSteps] = useState<Record<string, StepAnalytics>>({})
  const [summary, setSummary] = useState<FunnelSummary | null>(null)
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d')
  const [loading, setLoading] = useState(true)
  const [showPeriod, setShowPeriod] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/events?funnelId=${funnelId}&period=${period}`)
      const data = await res.json()
      if (data.steps) {
        setSteps(data.steps)
        setSummary(data.summary)

        // Push metrics to nodes
        if (onUpdateNodeData) {
          for (const [stepId, metrics] of Object.entries(data.steps)) {
            const m = metrics as StepAnalytics
            onUpdateNodeData(stepId, {
              visits: m.views,
              revenue: m.revenue,
              convRate: m.views > 0 ? `${((m.conversions / m.views) * 100).toFixed(1)}%` : '',
            })
          }
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [funnelId, period, onUpdateNodeData])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const insights = summary ? generateInsights(steps, nodes, summary) : []

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3" /> Analytics
        </h3>
        <div className="relative">
          <button onClick={() => setShowPeriod(!showPeriod)} className="flex items-center gap-1 text-[10px] text-white/30 bg-white/[0.04] px-2 py-1 rounded-lg hover:bg-white/[0.06]">
            <Clock className="w-2.5 h-2.5" /> {period} <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showPeriod && (
            <div className="absolute top-full right-0 mt-1 bg-[#0c1018] border border-white/[0.08] rounded-lg py-1 z-50">
              {(['24h', '7d', '30d'] as const).map(p => (
                <button key={p} onClick={() => { setPeriod(p); setShowPeriod(false) }} className={`block w-full text-left px-3 py-1 text-[10px] ${period === p ? 'text-cyan-400' : 'text-white/40 hover:text-white/60'}`}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4"><p className="text-[10px] text-white/20">Loading analytics...</p></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <Eye className="w-3 h-3 text-blue-400/50" />
                <span className="text-[8px] text-white/25 uppercase">Views</span>
              </div>
              <p className="text-lg font-bold text-white/70">{summary?.totalViews ?? 0}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <Target className="w-3 h-3 text-emerald-400/50" />
                <span className="text-[8px] text-white/25 uppercase">Conversions</span>
              </div>
              <p className="text-lg font-bold text-emerald-400/70">{summary?.totalConversions ?? 0}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-cyan-400/50" />
                <span className="text-[8px] text-white/25 uppercase">Conv. Rate</span>
              </div>
              <p className="text-lg font-bold text-cyan-400/70">{summary?.overallConversionRate ?? '0'}%</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-emerald-400/50" />
                <span className="text-[8px] text-white/25 uppercase">Revenue</span>
              </div>
              <p className="text-lg font-bold text-emerald-400/70">${(summary?.totalRevenue ?? 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Drop-off Warning */}
          {summary?.highestDropoff && summary.highestDropoff.rate > 30 && (
            <div className="bg-amber-500/[0.05] border border-amber-500/15 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-amber-400/80 font-medium">High drop-off detected</p>
                <p className="text-[9px] text-white/30 mt-0.5">
                  {summary.highestDropoff.rate.toFixed(0)}% of visitors leave at step "{
                    (() => {
                      const node = nodes.find(n => n.id === summary.highestDropoff.stepId)
                      return node ? (node.data as Record<string, string>).label : summary.highestDropoff.stepId
                    })()
                  }"
                </p>
              </div>
            </div>
          )}

          {/* Per-Step Breakdown */}
          <div>
            <p className="text-[9px] text-white/25 font-semibold uppercase tracking-wider mb-2">Per Step</p>
            <div className="space-y-1">
              {nodes.map((node, i) => {
                const s = steps[node.id] ?? { views: 0, clicks: 0, conversions: 0, payments: 0, revenue: 0 }
                const prevNode = i > 0 ? nodes[i - 1] : null
                const prevViews = prevNode ? (steps[prevNode.id]?.views ?? 0) : 0
                const dropoff = i > 0 && prevViews > 0 ? ((prevViews - s.views) / prevViews * 100) : 0

                return (
                  <div key={node.id} className="bg-white/[0.02] rounded-lg px-3 py-2 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/50 truncate">{(node.data as Record<string, string>).label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-white/20">{s.views} views</span>
                        <span className="text-[9px] text-emerald-400/40">{s.conversions} conv</span>
                        {s.revenue > 0 && <span className="text-[9px] text-emerald-400/40">${s.revenue}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {s.views > 0 ? (
                        <p className="text-[10px] text-cyan-400/60 font-mono">{((s.conversions / s.views) * 100).toFixed(1)}%</p>
                      ) : (
                        <p className="text-[10px] text-white/15 font-mono">—</p>
                      )}
                      {dropoff > 40 && (
                        <div className="flex items-center gap-0.5 justify-end">
                          <TrendingDown className="w-2 h-2 text-red-400/50" />
                          <span className="text-[8px] text-red-400/40">-{dropoff.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <div>
              <p className="text-[9px] text-white/25 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-400/40" /> Insights
              </p>
              <div className="space-y-1.5">
                {insights.map((insight, i) => (
                  <div key={i} className={`rounded-lg px-3 py-2 flex items-start gap-2 ${
                    insight.type === 'warning' ? 'bg-amber-500/[0.04] border border-amber-500/10' :
                    insight.type === 'success' ? 'bg-emerald-500/[0.04] border border-emerald-500/10' :
                    'bg-cyan-500/[0.04] border border-cyan-500/10'
                  }`}>
                    {insight.type === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-400/50 mt-0.5 shrink-0" />}
                    {insight.type === 'success' && <TrendingUp className="w-3 h-3 text-emerald-400/50 mt-0.5 shrink-0" />}
                    {insight.type === 'tip' && <Zap className="w-3 h-3 text-cyan-400/50 mt-0.5 shrink-0" />}
                    <p className="text-[9px] text-white/40 leading-relaxed">{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
