'use client'

import { useState, useCallback } from 'react'
import {
  ReactFlow, Background, Controls,
  addEdge, useNodesState, useEdgesState,
  Handle, Position, type Connection, type Node, type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Plus, Layout, CreditCard, Gift, Heart, Trash2, ArrowLeft,
  DollarSign, Users, TrendingUp, Settings, Eye, BarChart3,
  Megaphone, ShoppingBag, FileText, Rocket, Check, X,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────
interface Funnel {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  isActive: boolean
  visits: number
  conversions: number
  revenue: number
}

// ─── Custom Funnel Step Nodes ────────────────────────────────
const STEP_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  landing: { border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  offer: { border: 'border-violet-500/50', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  checkout: { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  upsell: { border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  thankyou: { border: 'border-pink-500/50', bg: 'bg-pink-500/10', text: 'text-pink-400' },
  optin: { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  webinar: { border: 'border-indigo-500/50', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  downsell: { border: 'border-orange-500/50', bg: 'bg-orange-500/10', text: 'text-orange-400' },
}

const STEP_ICONS: Record<string, typeof Layout> = {
  landing: Layout, offer: Gift, checkout: CreditCard, upsell: DollarSign,
  thankyou: Heart, optin: FileText, webinar: Megaphone, downsell: ShoppingBag,
}

function FunnelStepNode({ data }: { data: { label: string; stepType: string; convRate?: string } }) {
  const colors = STEP_COLORS[data.stepType] || STEP_COLORS.landing
  const Icon = STEP_ICONS[data.stepType] || Layout

  return (
    <div className={`bg-[#0d1117] border-2 ${colors.border} rounded-xl px-5 py-4 min-w-[200px] shadow-lg`}>
      <Handle type="target" position={Position.Top} className="!bg-white/30 !w-3 !h-3 !border-2 !border-[#0d1117]" />
      <Handle type="source" position={Position.Bottom} className="!bg-white/30 !w-3 !h-3 !border-2 !border-[#0d1117]" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div>
          <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">{data.stepType}</p>
          <p className="text-xs text-white/80 font-medium">{data.label}</p>
        </div>
      </div>
      {data.convRate && (
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3 text-emerald-400/50" />
          <span className="text-[10px] text-emerald-400/60 font-mono">{data.convRate} conv.</span>
        </div>
      )}
    </div>
  )
}

const nodeTypes = { funnelStep: FunnelStepNode }

// ─── Step Library ────────────────────────────────────────────
const STEP_TYPES = [
  { type: 'landing', label: 'Landing Page' },
  { type: 'optin', label: 'Opt-In Page' },
  { type: 'offer', label: 'Offer Page' },
  { type: 'webinar', label: 'Webinar Page' },
  { type: 'checkout', label: 'Checkout' },
  { type: 'upsell', label: 'Upsell' },
  { type: 'downsell', label: 'Downsell' },
  { type: 'thankyou', label: 'Thank You' },
]

// ─── Funnel Templates ────────────────────────────────────────
const FUNNEL_TEMPLATES = [
  {
    name: 'Lead Magnet Funnel',
    nodes: [
      { id: 's1', type: 'funnelStep', position: { x: 300, y: 50 }, data: { label: 'Free Guide Landing', stepType: 'landing', convRate: '35%' } },
      { id: 's2', type: 'funnelStep', position: { x: 300, y: 220 }, data: { label: 'Email Opt-In', stepType: 'optin', convRate: '28%' } },
      { id: 's3', type: 'funnelStep', position: { x: 300, y: 390 }, data: { label: 'Thank You + Offer', stepType: 'thankyou', convRate: '12%' } },
    ],
    edges: [{ id: 'e1', source: 's1', target: 's2' }, { id: 'e2', source: 's2', target: 's3' }],
  },
  {
    name: 'Product Sales Funnel',
    nodes: [
      { id: 's1', type: 'funnelStep', position: { x: 300, y: 50 }, data: { label: 'Sales Page', stepType: 'landing', convRate: '8%' } },
      { id: 's2', type: 'funnelStep', position: { x: 300, y: 220 }, data: { label: 'Checkout', stepType: 'checkout', convRate: '65%' } },
      { id: 's3', type: 'funnelStep', position: { x: 150, y: 390 }, data: { label: 'Upsell #1', stepType: 'upsell', convRate: '25%' } },
      { id: 's4', type: 'funnelStep', position: { x: 450, y: 390 }, data: { label: 'Downsell', stepType: 'downsell', convRate: '15%' } },
      { id: 's5', type: 'funnelStep', position: { x: 300, y: 560 }, data: { label: 'Order Confirmation', stepType: 'thankyou' } },
    ],
    edges: [
      { id: 'e1', source: 's1', target: 's2' },
      { id: 'e2', source: 's2', target: 's3' },
      { id: 'e3', source: 's2', target: 's4' },
      { id: 'e4', source: 's3', target: 's5' },
      { id: 'e5', source: 's4', target: 's5' },
    ],
  },
  {
    name: 'Webinar Funnel',
    nodes: [
      { id: 's1', type: 'funnelStep', position: { x: 300, y: 50 }, data: { label: 'Registration Page', stepType: 'landing', convRate: '40%' } },
      { id: 's2', type: 'funnelStep', position: { x: 300, y: 220 }, data: { label: 'Webinar Room', stepType: 'webinar', convRate: '55%' } },
      { id: 's3', type: 'funnelStep', position: { x: 300, y: 390 }, data: { label: 'Special Offer', stepType: 'offer', convRate: '18%' } },
      { id: 's4', type: 'funnelStep', position: { x: 300, y: 560 }, data: { label: 'Checkout', stepType: 'checkout', convRate: '70%' } },
    ],
    edges: [{ id: 'e1', source: 's1', target: 's2' }, { id: 'e2', source: 's2', target: 's3' }, { id: 'e3', source: 's3', target: 's4' }],
  },
  {
    name: 'High-Ticket Application',
    nodes: [
      { id: 's1', type: 'funnelStep', position: { x: 300, y: 50 }, data: { label: 'VSL Page', stepType: 'landing', convRate: '12%' } },
      { id: 's2', type: 'funnelStep', position: { x: 300, y: 220 }, data: { label: 'Application Form', stepType: 'optin', convRate: '35%' } },
      { id: 's3', type: 'funnelStep', position: { x: 300, y: 390 }, data: { label: 'Calendar Booking', stepType: 'checkout', convRate: '50%' } },
      { id: 's4', type: 'funnelStep', position: { x: 300, y: 560 }, data: { label: 'Confirmation', stepType: 'thankyou' } },
    ],
    edges: [{ id: 'e1', source: 's1', target: 's2' }, { id: 'e2', source: 's2', target: 's3' }, { id: 'e3', source: 's3', target: 's4' }],
  },
]

const inp = 'w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none'

// ─── Main Component ──────────────────────────────────────────
export default function FunnelsPage() {
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [activeFunnel, setActiveFunnel] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showStepLib, setShowStepLib] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: '#64748b', strokeWidth: 2 } }, eds))
  }, [setEdges])

  function createFunnel() {
    if (!newName.trim()) return
    const funnel: Funnel = { id: Date.now().toString(), name: newName, nodes: [], edges: [], isActive: false, visits: 0, conversions: 0, revenue: 0 }
    setFunnels([funnel, ...funnels])
    setActiveFunnel(funnel.id)
    setNodes([])
    setEdges([])
    setShowCreate(false)
    setNewName('')
  }

  function loadFunnel(id: string) {
    const f = funnels.find(f => f.id === id)
    if (!f) return
    setActiveFunnel(id)
    setNodes(f.nodes)
    setEdges(f.edges)
    setSelectedNode(null)
  }

  function saveFunnel() {
    if (!activeFunnel) return
    setFunnels(funnels.map(f => f.id === activeFunnel ? { ...f, nodes, edges } : f))
  }

  function loadTemplate(template: typeof FUNNEL_TEMPLATES[0]) {
    setNodes(template.nodes as Node[])
    setEdges(template.edges as Edge[])
    if (!activeFunnel) {
      const funnel: Funnel = { id: Date.now().toString(), name: template.name, nodes: template.nodes as Node[], edges: template.edges as Edge[], isActive: false, visits: 0, conversions: 0, revenue: 0 }
      setFunnels([funnel, ...funnels])
      setActiveFunnel(funnel.id)
    }
  }

  function addStep(stepType: string, label: string) {
    const id = `step-${Date.now()}`
    setNodes(nds => [...nds, { id, type: 'funnelStep', position: { x: 300, y: (nds.length + 1) * 170 }, data: { label, stepType } }])
    setShowStepLib(false)
  }

  return (
    <div className="fixed inset-0 bg-[#06080d] flex" style={{ zIndex: 50, top: '56px' }}>
      {/* Left — Funnel List */}
      <div className="w-[260px] border-r border-white/[0.06] bg-[#0a0d12] flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/70">Funnels</h2>
          <button onClick={() => setShowCreate(true)} className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20"><Plus className="w-3.5 h-3.5" /></button>
        </div>

        {showCreate && (
          <div className="p-3 border-b border-white/[0.06]">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Funnel name" className={inp} autoFocus onKeyDown={e => e.key === 'Enter' && createFunnel()} />
            <div className="flex gap-1.5 mt-2">
              <button onClick={createFunnel} className="flex-1 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-medium">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-[10px] text-white/30">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {funnels.map(f => (
            <div key={f.id} onClick={() => loadFunnel(f.id)} className={`p-3 rounded-xl cursor-pointer transition-colors ${activeFunnel === f.id ? 'bg-white/[0.05] border border-white/[0.08]' : 'hover:bg-white/[0.02]'}`}>
              <p className="text-xs font-medium text-white/70 truncate">{f.name}</p>
              <div className="flex items-center gap-3 mt-1 text-[9px] text-white/25">
                <span>{f.nodes.length} steps</span>
                <span>{f.visits} visits</span>
              </div>
            </div>
          ))}
        </div>

        {/* Templates */}
        <div className="p-3 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">Funnel Templates</p>
          {FUNNEL_TEMPLATES.map(t => (
            <button key={t.name} onClick={() => loadTemplate(t)} className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors flex items-center gap-1.5">
              <Rocket className="w-2.5 h-2.5" /> {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Center — Flow Canvas */}
      <div className="flex-1 relative">
        {activeFunnel ? (
          <>
            <ReactFlow
              nodes={nodes} edges={edges}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              fitView
              defaultEdgeOptions={{ animated: true, style: { stroke: '#475569', strokeWidth: 2 } }}
              proOptions={{ hideAttribution: true }}
              style={{ background: '#0a0d12' }}
            >
              <Background color="#ffffff06" gap={24} />
              <Controls className="!bg-[#0d1117] !border-white/[0.08] !rounded-xl [&>button]:!bg-transparent [&>button]:!border-white/[0.06] [&>button]:!text-white/40" />
            </ReactFlow>

            {/* Add Step */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 relative">
              <button onClick={() => setShowStepLib(!showStepLib)} className="px-5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-xs text-white/60 font-medium hover:border-cyan-500/30 hover:text-cyan-400 transition-colors flex items-center gap-2 shadow-xl">
                <Plus className="w-4 h-4" /> Add Step
              </button>
              {showStepLib && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0d1117] border border-white/[0.08] rounded-2xl shadow-2xl p-3 grid grid-cols-2 gap-1 w-[280px]">
                  {STEP_TYPES.map(s => {
                    const Icon = STEP_ICONS[s.type] || Layout
                    const colors = STEP_COLORS[s.type] || STEP_COLORS.landing
                    return (
                      <button key={s.type} onClick={() => addStep(s.type, s.label)} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg hover:${colors.bg} text-[10px] text-white/50 hover:${colors.text} transition-colors`}>
                        <Icon className="w-3.5 h-3.5" /> {s.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <button onClick={saveFunnel} className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-[#0d1117] border border-white/[0.08] rounded-lg text-[10px] text-white/40 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Save
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Megaphone className="w-12 h-12 text-white/5 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white/30 mb-2">Funnel Builder</h3>
              <p className="text-xs text-white/20 mb-6 max-w-xs">Build conversion funnels visually. Landing → Offer → Checkout → Upsell → Thank You.</p>
              <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl hover:brightness-110">
                Create Funnel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right — Step Config */}
      <div className="w-[260px] border-l border-white/[0.06] bg-[#0a0d12] flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-xs font-semibold text-white/50 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Step Configuration</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Step Type</label>
                <p className="text-xs text-white/60 capitalize">{(selectedNode.data as Record<string, string>).stepType}</p>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Label</label>
                <input defaultValue={(selectedNode.data as Record<string, string>).label} className={inp} onChange={e => {
                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))
                }} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Page URL</label>
                <input placeholder="/funnel/step-1" className={inp + ' font-mono'} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Connected Page</label>
                <select className={inp}><option>None (create new)</option><option>From templates...</option></select>
              </div>
              <button onClick={() => { setNodes(nds => nds.filter(n => n.id !== selectedNode.id)); setSelectedNode(null) }} className="w-full py-2 text-xs text-red-400/60 hover:text-red-400 flex items-center justify-center gap-1.5 hover:bg-red-500/5 rounded-lg">
                <Trash2 className="w-3 h-3" /> Delete Step
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Settings className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-xs text-white/30">Select a step to configure</p>
            </div>
          )}
        </div>

        {/* Funnel Stats */}
        {activeFunnel && (() => {
          const f = funnels.find(f => f.id === activeFunnel)
          return f ? (
            <div className="p-4 border-t border-white/[0.06] space-y-2">
              <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Funnel Metrics</p>
              <div className="flex items-center justify-between"><span className="text-[10px] text-white/30">Steps</span><span className="text-[10px] text-white/50">{nodes.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-white/30">Visits</span><span className="text-[10px] text-white/50">{f.visits}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-white/30">Conversions</span><span className="text-[10px] text-emerald-400/60">{f.conversions}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-white/30">Revenue</span><span className="text-[10px] text-emerald-400/60">${f.revenue}</span></div>
            </div>
          ) : null
        })()}
      </div>
    </div>
  )
}
