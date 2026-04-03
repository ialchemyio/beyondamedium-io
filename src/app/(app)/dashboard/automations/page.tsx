'use client'

import { useState } from 'react'
import { Zap, Plus, ArrowRight, Mail, CreditCard, Globe, Bot, Bell, Database } from 'lucide-react'

const TRIGGERS = [
  { id: 'form_submit', label: 'Form Submitted', icon: Mail, desc: 'When a visitor submits a form' },
  { id: 'payment_received', label: 'Payment Received', icon: CreditCard, desc: 'When a Stripe payment completes' },
  { id: 'page_published', label: 'Page Published', icon: Globe, desc: 'When a page goes live' },
  { id: 'page_visit', label: 'Page Visited', icon: Bell, desc: 'When someone visits a specific page' },
]

const ACTIONS = [
  { id: 'send_email', label: 'Send Email', icon: Mail, desc: 'Send a notification or follow-up email' },
  { id: 'ai_reply', label: 'AI Auto-Reply', icon: Bot, desc: 'Generate and send an AI response' },
  { id: 'update_db', label: 'Update Database', icon: Database, desc: 'Create or update a database record' },
  { id: 'seo_optimize', label: 'SEO Optimize', icon: Zap, desc: 'Run AI SEO optimization on the page' },
]

interface Automation {
  id: string
  name: string
  trigger: string
  action: string
  active: boolean
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [name, setName] = useState('')

  function createAutomation() {
    if (!name || !selectedTrigger || !selectedAction) return
    setAutomations([...automations, {
      id: Date.now().toString(),
      name,
      trigger: selectedTrigger,
      action: selectedAction,
      active: true,
    }])
    setShowCreate(false)
    setName('')
    setSelectedTrigger(null)
    setSelectedAction(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Automations</h1>
          <p className="text-sm text-white/40 mt-1">Turn your sites into business machines</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Automation
        </button>
      </div>

      {/* Create Flow */}
      {showCreate && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6 space-y-6">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Automation Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Welcome email on form submit" className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none" />
          </div>

          {/* Trigger Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">When this happens...</label>
            <div className="grid grid-cols-2 gap-2">
              {TRIGGERS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrigger(t.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                    selectedTrigger === t.id ? 'border-cyan-500/30 bg-cyan-500/[0.05]' : 'border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <t.icon className={`w-4 h-4 mt-0.5 shrink-0 ${selectedTrigger === t.id ? 'text-cyan-400' : 'text-white/25'}`} />
                  <div>
                    <p className={`text-xs font-medium ${selectedTrigger === t.id ? 'text-cyan-300' : 'text-white/60'}`}>{t.label}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Selection */}
          {selectedTrigger && (
            <div>
              <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">Do this...</label>
              <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAction(a.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                      selectedAction === a.id ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : 'border-white/[0.06] hover:border-white/[0.1]'
                    }`}
                  >
                    <a.icon className={`w-4 h-4 mt-0.5 shrink-0 ${selectedAction === a.id ? 'text-emerald-400' : 'text-white/25'}`} />
                    <div>
                      <p className={`text-xs font-medium ${selectedAction === a.id ? 'text-emerald-300' : 'text-white/60'}`}>{a.label}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{a.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs text-white/40 hover:text-white/60 transition-colors">Cancel</button>
            <button onClick={createAutomation} disabled={!name || !selectedTrigger || !selectedAction} className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 disabled:opacity-30 transition-all">
              Create Automation
            </button>
          </div>
        </div>
      )}

      {/* Automations List */}
      {automations.length === 0 && !showCreate ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
          <Zap className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white/40 mb-1">No automations yet</h3>
          <p className="text-xs text-white/20 mb-6">Connect triggers to actions to automate your workflow</p>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2 bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-medium rounded-xl hover:bg-white/[0.08] transition-colors">
            Create Your First Automation
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {automations.map(auto => {
            const trigger = TRIGGERS.find(t => t.id === auto.trigger)
            const action = ACTIONS.find(a => a.id === auto.action)
            return (
              <div key={auto.id} className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.08] transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  {trigger && <trigger.icon className="w-4 h-4 text-cyan-400/60" />}
                  <span className="text-xs text-white/50">{trigger?.label}</span>
                  <ArrowRight className="w-3 h-3 text-white/15" />
                  {action && <action.icon className="w-4 h-4 text-emerald-400/60" />}
                  <span className="text-xs text-white/50">{action?.label}</span>
                </div>
                <span className="text-xs text-white/60 font-medium">{auto.name}</span>
                <div className={`w-2 h-2 rounded-full ${auto.active ? 'bg-emerald-400' : 'bg-white/20'}`} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
