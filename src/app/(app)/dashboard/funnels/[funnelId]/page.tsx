'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  Handle, Position, type Connection, type Node, type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowLeft, Save, Play, Pause, Globe, Plus, Trash2, Check,
  Layout, CreditCard, Gift, Heart, FileText, DollarSign,
  Megaphone, ShoppingBag, TrendingUp, Settings, ChevronDown,
  ChevronRight, Mail, Database, Bot, Zap, Rocket, Eye,
  BarChart3, Clock, Users, ExternalLink, Pencil, FlaskConical,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import FunnelAnalytics from '@/components/funnels/FunnelAnalytics'
import ABTestPanel from '@/components/funnels/ABTestPanel'

// ─── Types ───────────────────────────────────────────────────
interface FunnelData {
  id: string
  name: string
  steps: { nodes: Node[]; edges: Edge[] }
  is_active: boolean
  conversion_rate: number
  total_revenue: number
  created_at: string
}

// ─── Step Colors & Icons ─────────────────────────────────────
const STEP_THEME: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  landing:  { border: 'border-cyan-500/50',    bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    glow: 'shadow-cyan-500/10' },
  optin:    { border: 'border-blue-500/50',    bg: 'bg-blue-500/10',    text: 'text-blue-400',    glow: 'shadow-blue-500/10' },
  offer:    { border: 'border-violet-500/50',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  glow: 'shadow-violet-500/10' },
  webinar:  { border: 'border-indigo-500/50',  bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  glow: 'shadow-indigo-500/10' },
  checkout: { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
  upsell:   { border: 'border-amber-500/50',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   glow: 'shadow-amber-500/10' },
  downsell: { border: 'border-orange-500/50',  bg: 'bg-orange-500/10',  text: 'text-orange-400',  glow: 'shadow-orange-500/10' },
  thankyou: { border: 'border-pink-500/50',    bg: 'bg-pink-500/10',    text: 'text-pink-400',    glow: 'shadow-pink-500/10' },
}

const STEP_ICON: Record<string, typeof Layout> = {
  landing: Layout, optin: FileText, offer: Gift, webinar: Megaphone,
  checkout: CreditCard, upsell: DollarSign, downsell: ShoppingBag, thankyou: Heart,
}

// ─── Step Actions ────────────────────────────────────────────
const AVAILABLE_ACTIONS = [
  { id: 'send_email', label: 'Send Email', icon: Mail, color: 'text-cyan-400', desc: 'Send confirmation or follow-up email' },
  { id: 'add_to_db', label: 'Add to Database', icon: Database, color: 'text-blue-400', desc: 'Save lead or order data' },
  { id: 'ai_agent', label: 'Trigger AI Agent', icon: Bot, color: 'text-violet-400', desc: 'Run AI task on this event' },
  { id: 'show_upsell', label: 'Show Upsell', icon: Gift, color: 'text-amber-400', desc: 'Present upgrade offer' },
  { id: 'trigger_automation', label: 'Run Automation', icon: Zap, color: 'text-emerald-400', desc: 'Trigger a global automation' },
]

// ─── Step Library ────────────────────────────────────────────
const STEP_LIBRARY = [
  { type: 'landing', label: 'Landing Page' },
  { type: 'optin', label: 'Opt-In Page' },
  { type: 'offer', label: 'Offer Page' },
  { type: 'webinar', label: 'Webinar Page' },
  { type: 'checkout', label: 'Checkout' },
  { type: 'upsell', label: 'Upsell' },
  { type: 'downsell', label: 'Downsell' },
  { type: 'thankyou', label: 'Thank You' },
]

// ─── Custom Node ─────────────────────────────────────────────
function FunnelNode({ data }: { data: Record<string, unknown> }) {
  const stepType = (data.stepType as string) || 'landing'
  const theme = STEP_THEME[stepType] || STEP_THEME.landing
  const Icon = STEP_ICON[stepType] || Layout
  const actions = (data.actions as string[]) || []
  const convRate = data.convRate as string | undefined
  const visits = (data.visits as number) ?? 0
  const revenue = (data.revenue as number) ?? 0

  return (
    <div className={`bg-[#0c1018] border-2 ${theme.border} rounded-2xl min-w-[240px] shadow-xl ${theme.glow} transition-shadow hover:shadow-2xl`}>
      <Handle type="target" position={Position.Top} className="!bg-white/30 !w-3.5 !h-3.5 !border-2 !border-[#0c1018] !-top-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-white/30 !w-3.5 !h-3.5 !border-2 !border-[#0c1018] !-bottom-2" />

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${theme.bg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${theme.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[9px] ${theme.text} font-semibold uppercase tracking-widest`}>{stepType}</p>
          <p className="text-sm text-white/85 font-medium truncate">{data.label as string}</p>
        </div>
        <Pencil className="w-3 h-3 text-white/15 hover:text-white/40 cursor-pointer transition-colors" />
      </div>

      {/* Metrics */}
      {(convRate || visits > 0) && (
        <div className="px-4 pb-2 flex items-center gap-3">
          {convRate && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5 text-emerald-400/50" />
              <span className="text-[10px] text-emerald-400/60 font-mono">{convRate}</span>
            </div>
          )}
          {visits > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-white/20" />
              <span className="text-[10px] text-white/25 font-mono">{visits}</span>
            </div>
          )}
          {revenue > 0 && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-2.5 h-2.5 text-emerald-400/40" />
              <span className="text-[10px] text-emerald-400/50 font-mono">${revenue}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions indicator */}
      {actions.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-white/[0.04] flex items-center gap-1.5">
          <Zap className="w-2.5 h-2.5 text-cyan-400/40" />
          <span className="text-[9px] text-white/25">{actions.length} action{actions.length > 1 ? 's' : ''} attached</span>
          <div className="flex -space-x-1 ml-auto">
            {actions.slice(0, 3).map(a => {
              const act = AVAILABLE_ACTIONS.find(x => x.id === a)
              return act ? <act.icon key={a} className={`w-3 h-3 ${act.color} opacity-40`} /> : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const nodeTypes = { funnelStep: FunnelNode }

// ─── Input styles ────────────────────────────────────────────
const inp = 'w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none'
const lbl = 'block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5'

// ─── Main Component ──────────────────────────────────────────
export default function FunnelEditorPage() {
  const params = useParams()
  const router = useRouter()
  const funnelId = params.funnelId as string

  const [funnelName, setFunnelName] = useState('Untitled Funnel')
  const [isActive, setIsActive] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showStepLib, setShowStepLib] = useState(false)
  const [configSection, setConfigSection] = useState<'page' | 'actions' | 'flow' | 'analytics' | 'abtest'>('page')

  // Load funnel if it's a real ID (not 'new')
  useEffect(() => {
    if (funnelId === 'new') return
    // In production, load from Supabase
    // For now, check URL params or local storage
  }, [funnelId])

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({
      ...connection, animated: true,
      style: { stroke: '#475569', strokeWidth: 2 },
      type: 'smoothstep',
    }, eds))
  }, [setEdges])

  function addStep(stepType: string, label: string) {
    const id = `step-${Date.now()}`
    const yPos = nodes.length === 0 ? 80 : Math.max(...nodes.map(n => n.position.y)) + 180
    setNodes(nds => [...nds, {
      id, type: 'funnelStep',
      position: { x: 350, y: yPos },
      data: { label, stepType, actions: [], convRate: '', visits: 0, revenue: 0 },
    }])
    setShowStepLib(false)
  }

  function updateNodeData(nodeId: string, updates: Record<string, unknown>) {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n))
  }

  function deleteNode(nodeId: string) {
    setNodes(nds => nds.filter(n => n.id !== nodeId))
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }

  function toggleAction(actionId: string) {
    if (!selectedNode) return
    const actions = ((selectedNode.data as Record<string, unknown>).actions as string[]) ?? []
    const updated = actions.includes(actionId) ? actions.filter(a => a !== actionId) : [...actions, actionId]
    updateNodeData(selectedNode.id, { actions: updated })
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, actions: updated } })
  }

  async function handleSave() {
    setSaving(true)
    // Save to Supabase funnels table
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handlePublish() {
    setIsActive(!isActive)
  }

  const selectedActions = selectedNode ? ((selectedNode.data as Record<string, unknown>).actions as string[]) ?? [] : []

  return (
    <div className="fixed inset-0 bg-[#06080d] flex flex-col" style={{ zIndex: 9999 }}>
      {/* ─── Top Bar ──────────────────── */}
      <div className="h-12 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 bg-[#0a0d12]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/funnels')} className="p-1.5 text-white/40 hover:text-white/70 rounded-lg hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/[0.06]" />
          <input
            value={funnelName}
            onChange={e => setFunnelName(e.target.value)}
            className="bg-transparent text-sm font-semibold text-white/80 focus:outline-none focus:text-white border-b border-transparent focus:border-white/20 px-1 py-0.5 w-[200px]"
          />
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/30'}`}>
            {isActive ? 'Live' : 'Draft'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/20 mr-2">{nodes.length} steps</span>

          <button onClick={handleSave} disabled={saving} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${saved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-white/50 hover:text-white/70'}`}>
            {saved ? <><Check className="w-3 h-3" /> Saved</> : saving ? 'Saving...' : <><Save className="w-3 h-3" /> Save</>}
          </button>

          <button onClick={handlePublish} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${isActive ? 'bg-white/[0.06] text-white/50 hover:text-white/70' : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110'}`}>
            {isActive ? <><Pause className="w-3 h-3" /> Unpublish</> : <><Rocket className="w-3 h-3" /> Publish Funnel</>}
          </button>
        </div>
      </div>

      {/* ─── Main ─────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              fitView
              defaultEdgeOptions={{ animated: true, type: 'smoothstep', style: { stroke: '#334155', strokeWidth: 2 } }}
              proOptions={{ hideAttribution: true }}
              style={{ background: '#080b11' }}
            >
              <Background color="#ffffff05" gap={32} size={1} />
              <Controls className="!bg-[#0d1117] !border-white/[0.08] !rounded-xl [&>button]:!bg-transparent [&>button]:!border-white/[0.06] [&>button]:!text-white/40" />
              <MiniMap className="!bg-[#0d1117] !border-white/[0.08] !rounded-xl" nodeColor="#22d3ee15" maskColor="#06080dee" />
            </ReactFlow>
          ) : (
            /* Empty state */
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="flex items-center justify-center gap-2 mb-6">
                  {['landing', 'offer', 'checkout', 'upsell', 'thankyou'].map((s, i) => {
                    const Icon = STEP_ICON[s]
                    const theme = STEP_THEME[s]
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl ${theme.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${theme.text} opacity-40`} />
                        </div>
                        {i < 4 && <ChevronRight className="w-3 h-3 text-white/10" />}
                      </div>
                    )
                  })}
                </div>
                <h3 className="text-lg font-bold text-white/40 mb-2">Map your revenue flow</h3>
                <p className="text-xs text-white/20 mb-6">Add steps, connect them, attach actions. Each step is a page in your conversion funnel.</p>
                <button onClick={() => setShowStepLib(true)} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" /> Add First Step
                </button>
              </div>
            </div>
          )}

          {/* Add Step Floating Button */}
          {nodes.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <div className="relative">
                <button onClick={() => setShowStepLib(!showStepLib)} className="px-5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-xs text-white/50 font-medium hover:border-cyan-500/30 hover:text-cyan-400 transition-colors flex items-center gap-2 shadow-2xl">
                  <Plus className="w-4 h-4" /> Add Step
                </button>
                {showStepLib && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0c1018] border border-white/[0.08] rounded-2xl shadow-2xl p-2 grid grid-cols-2 gap-0.5 w-[300px]">
                    {STEP_LIBRARY.map(s => {
                      const Icon = STEP_ICON[s.type] || Layout
                      const theme = STEP_THEME[s.type] || STEP_THEME.landing
                      return (
                        <button key={s.type} onClick={() => addStep(s.type, s.label)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors`}>
                          <div className={`w-7 h-7 rounded-lg ${theme.bg} flex items-center justify-center`}>
                            <Icon className={`w-3.5 h-3.5 ${theme.text}`} />
                          </div>
                          <span className="text-[11px] text-white/50">{s.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Sidebar ──────────── */}
        <div className="w-[300px] border-l border-white/[0.06] bg-[#0a0d12] flex flex-col overflow-hidden shrink-0">
          {selectedNode ? (
            <>
              {/* Node header */}
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {(() => {
                    const st = (selectedNode.data as Record<string, unknown>).stepType as string
                    const Icon = STEP_ICON[st] || Layout
                    const theme = STEP_THEME[st] || STEP_THEME.landing
                    return (
                      <div className={`w-7 h-7 rounded-lg ${theme.bg} flex items-center justify-center`}>
                        <Icon className={`w-3.5 h-3.5 ${theme.text}`} />
                      </div>
                    )
                  })()}
                  <div>
                    <p className="text-xs font-semibold text-white/70">{(selectedNode.data as Record<string, string>).label}</p>
                    <p className="text-[9px] text-white/30 capitalize">{(selectedNode.data as Record<string, string>).stepType} step</p>
                  </div>
                </div>
              </div>

              {/* Section tabs */}
              <div className="flex border-b border-white/[0.04]">
                {([
                  { id: 'page' as const, label: 'Page', icon: Layout },
                  { id: 'actions' as const, label: 'Actions', icon: Zap },
                  { id: 'flow' as const, label: 'Flow', icon: TrendingUp },
                  { id: 'abtest' as const, label: 'A/B Test', icon: FlaskConical },
                  { id: 'analytics' as const, label: 'Stats', icon: BarChart3 },
                ]).map(tab => (
                  <button key={tab.id} onClick={() => setConfigSection(tab.id)} className={`flex-1 py-2.5 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors ${configSection === tab.id ? 'text-cyan-400 border-b border-cyan-400' : 'text-white/30 hover:text-white/50'}`}>
                    <tab.icon className="w-3 h-3" /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* Page Settings */}
                {configSection === 'page' && (
                  <div className="space-y-4">
                    <div>
                      <label className={lbl}>Step Name</label>
                      <input value={(selectedNode.data as Record<string, string>).label} onChange={e => { updateNodeData(selectedNode.id, { label: e.target.value }); setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: e.target.value } }) }} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Connected Page</label>
                      <select className={inp}>
                        <option>None — create new page</option>
                        <option>Select existing page...</option>
                      </select>
                      <button className="mt-2 w-full py-2 border border-dashed border-white/[0.08] rounded-lg text-[10px] text-white/25 hover:text-white/40 hover:border-white/[0.15] transition-colors flex items-center justify-center gap-1">
                        <Plus className="w-3 h-3" /> Create page with AI
                      </button>
                    </div>
                    <div>
                      <label className={lbl}>Page URL</label>
                      <input placeholder="/funnel/step-1" className={inp + ' font-mono'} />
                    </div>
                    <div>
                      <label className={lbl}>Conversion Goal</label>
                      <input placeholder="e.g. Form submission, Purchase" className={inp} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                {configSection === 'actions' && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-white/30">Actions execute when a visitor completes this step.</p>

                    {selectedActions.length > 0 && (
                      <div className="space-y-1.5">
                        {selectedActions.map(actionId => {
                          const action = AVAILABLE_ACTIONS.find(a => a.id === actionId)
                          if (!action) return null
                          return (
                            <div key={actionId} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
                                  <span className="text-[11px] text-white/60 font-medium">{action.label}</span>
                                </div>
                                <button onClick={() => toggleAction(actionId)} className="text-[9px] text-red-400/40 hover:text-red-400">Remove</button>
                              </div>
                              <p className="text-[9px] text-white/20">{action.desc}</p>

                              {/* Inline config */}
                              {actionId === 'send_email' && (
                                <div className="mt-2 space-y-1.5">
                                  <input placeholder="To: {{lead.email}}" className={inp} />
                                  <input placeholder="Subject" className={inp} />
                                </div>
                              )}
                              {actionId === 'ai_agent' && (
                                <div className="mt-2">
                                  <input placeholder="AI task: Optimize for conversion..." className={inp} />
                                </div>
                              )}
                              {actionId === 'show_upsell' && (
                                <div className="mt-2">
                                  <input placeholder="Upsell product name" className={inp} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add action */}
                    <div className="space-y-0.5">
                      {AVAILABLE_ACTIONS.filter(a => !selectedActions.includes(a.id)).map(action => (
                        <button key={action.id} onClick={() => toggleAction(action.id)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors group">
                          <action.icon className={`w-3.5 h-3.5 ${action.color} opacity-40 group-hover:opacity-70`} />
                          <div className="text-left">
                            <p className="text-[10px] text-white/40 group-hover:text-white/60">{action.label}</p>
                            <p className="text-[8px] text-white/15">{action.desc}</p>
                          </div>
                          <Plus className="w-3 h-3 text-white/10 group-hover:text-white/30 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flow Logic */}
                {configSection === 'flow' && (
                  <div className="space-y-4">
                    <div>
                      <label className={lbl}>Next Step (default)</label>
                      <select className={inp}>
                        <option>Auto (next connected node)</option>
                        {nodes.filter(n => n.id !== selectedNode.id).map(n => (
                          <option key={n.id} value={n.id}>{(n.data as Record<string, string>).label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Redirect Rule</label>
                      <select className={inp}>
                        <option>None</option>
                        <option>If payment fails → downsell</option>
                        <option>If time expires → next step</option>
                        <option>Custom rule...</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Delay Before Next</label>
                      <select className={inp}>
                        <option>Immediate</option>
                        <option>1 minute</option>
                        <option>5 minutes</option>
                        <option>1 hour</option>
                        <option>24 hours</option>
                      </select>
                    </div>

                    {/* Metrics placeholder */}
                    <div className="border-t border-white/[0.04] pt-4">
                      <p className="text-[9px] text-white/25 font-semibold uppercase tracking-wider mb-3">Step Metrics</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-white/50">—</p>
                          <p className="text-[8px] text-white/20">Visitors</p>
                        </div>
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-emerald-400/50">—</p>
                          <p className="text-[8px] text-white/20">Conversions</p>
                        </div>
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-cyan-400/50">—%</p>
                          <p className="text-[8px] text-white/20">Conv. Rate</p>
                        </div>
                        <div className="bg-white/[0.02] rounded-lg p-2.5 text-center">
                          <p className="text-lg font-bold text-emerald-400/50">$—</p>
                          <p className="text-[8px] text-white/20">Revenue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* A/B Test */}
                {configSection === 'abtest' && (
                  <ABTestPanel funnelId={funnelId} stepId={selectedNode.id} />
                )}

                {/* Analytics */}
                {configSection === 'analytics' && (
                  <FunnelAnalytics
                    funnelId={funnelId}
                    nodes={nodes}
                    onUpdateNodeData={updateNodeData}
                  />
                )}

                {/* Delete */}
                <div className="mt-6 pt-4 border-t border-white/[0.04]">
                  <button onClick={() => deleteNode(selectedNode.id)} className="w-full py-2 text-xs text-red-400/40 hover:text-red-400 flex items-center justify-center gap-1.5 hover:bg-red-500/5 rounded-lg transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete Step
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <FunnelAnalytics funnelId={funnelId} nodes={nodes} onUpdateNodeData={updateNodeData} />
              <div className="mt-6 text-center">
                <p className="text-[10px] text-white/15">Click a step to configure it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
