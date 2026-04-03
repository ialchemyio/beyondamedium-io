'use client'

import { useState } from 'react'
import { Plus, ArrowRight, Layout, CreditCard, Gift, Heart, Trash2, GripVertical } from 'lucide-react'

interface FunnelStep {
  id: string
  type: 'landing' | 'offer' | 'checkout' | 'upsell' | 'thankyou'
  title: string
  pageId?: string
}

interface Funnel {
  id: string
  name: string
  steps: FunnelStep[]
}

const STEP_TYPES = [
  { type: 'landing' as const, label: 'Landing Page', icon: Layout, color: 'from-cyan-400 to-blue-500' },
  { type: 'offer' as const, label: 'Offer Page', icon: Gift, color: 'from-violet-400 to-purple-500' },
  { type: 'checkout' as const, label: 'Checkout', icon: CreditCard, color: 'from-emerald-400 to-teal-500' },
  { type: 'upsell' as const, label: 'Upsell', icon: Heart, color: 'from-amber-400 to-orange-500' },
  { type: 'thankyou' as const, label: 'Thank You', icon: Heart, color: 'from-pink-400 to-rose-500' },
]

export default function FunnelsPage() {
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingFunnel, setEditingFunnel] = useState<string | null>(null)

  function createFunnel() {
    if (!newName.trim()) return
    const funnel: Funnel = {
      id: Date.now().toString(),
      name: newName,
      steps: [
        { id: '1', type: 'landing', title: 'Landing Page' },
        { id: '2', type: 'offer', title: 'Offer' },
        { id: '3', type: 'checkout', title: 'Checkout' },
        { id: '4', type: 'thankyou', title: 'Thank You' },
      ],
    }
    setFunnels([funnel, ...funnels])
    setShowCreate(false)
    setNewName('')
    setEditingFunnel(funnel.id)
  }

  function addStep(funnelId: string, type: FunnelStep['type']) {
    setFunnels(funnels.map(f => {
      if (f.id !== funnelId) return f
      const stepType = STEP_TYPES.find(s => s.type === type)
      return { ...f, steps: [...f.steps, { id: Date.now().toString(), type, title: stepType?.label || type }] }
    }))
  }

  function removeStep(funnelId: string, stepId: string) {
    setFunnels(funnels.map(f => {
      if (f.id !== funnelId) return f
      return { ...f, steps: f.steps.filter(s => s.id !== stepId) }
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Funnels</h1>
          <p className="text-sm text-white/40 mt-1">Build conversion funnels that multiply revenue</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Funnel
        </button>
      </div>

      {/* Create */}
      {showCreate && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-white/70 mb-4">Create Funnel</h3>
          <div className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Product Launch Funnel" className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none" autoFocus onKeyDown={e => e.key === 'Enter' && createFunnel()} />
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs text-white/40">Cancel</button>
            <button onClick={createFunnel} disabled={!newName.trim()} className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl disabled:opacity-30">Create</button>
          </div>
        </div>
      )}

      {/* Funnels */}
      {funnels.length === 0 && !showCreate ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <Layout className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white/40 mb-1">No funnels yet</h3>
          <p className="text-xs text-white/20 mb-6">Create a conversion funnel: Landing → Offer → Checkout → Upsell → Thank You</p>
        </div>
      ) : (
        <div className="space-y-4">
          {funnels.map(funnel => (
            <div key={funnel.id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] cursor-pointer" onClick={() => setEditingFunnel(editingFunnel === funnel.id ? null : funnel.id)}>
                <span className="text-sm font-semibold text-white/70">{funnel.name}</span>
                <span className="text-[10px] text-white/25">{funnel.steps.length} steps</span>
              </div>

              {editingFunnel === funnel.id && (
                <div className="p-5">
                  {/* Visual Funnel Flow */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-4">
                    {funnel.steps.map((step, i) => {
                      const stepType = STEP_TYPES.find(s => s.type === step.type)
                      return (
                        <div key={step.id} className="flex items-center gap-2 shrink-0">
                          <div className="relative group">
                            <div className={`w-32 bg-gradient-to-br ${stepType?.color ?? 'from-gray-400 to-gray-500'} rounded-xl p-3 opacity-80 hover:opacity-100 transition-opacity`}>
                              <div className="flex items-center justify-between mb-2">
                                {stepType && <stepType.icon className="w-4 h-4 text-white/80" />}
                                <button onClick={() => removeStep(funnel.id, step.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/20 rounded text-white/50">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[11px] font-semibold text-white">{step.title}</p>
                              <p className="text-[9px] text-white/60 mt-0.5">{stepType?.label}</p>
                            </div>
                            <GripVertical className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 text-white/10" />
                          </div>
                          {i < funnel.steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-white/15 shrink-0" />
                          )}
                        </div>
                      )
                    })}

                    {/* Add Step */}
                    <div className="shrink-0">
                      <div className="w-28 border-2 border-dashed border-white/[0.08] rounded-xl p-3 hover:border-white/[0.15] transition-colors">
                        <p className="text-[10px] text-white/25 mb-2">Add step</p>
                        <div className="flex flex-wrap gap-1">
                          {STEP_TYPES.map(st => (
                            <button key={st.type} onClick={() => addStep(funnel.id, st.type)} className="px-1.5 py-0.5 bg-white/[0.04] rounded text-[8px] text-white/30 hover:text-white/50 hover:bg-white/[0.08] transition-colors">
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
