'use client'

import { useState, useCallback, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  Handle, Position, type Connection, type Node, type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Zap, Plus, Play, Pause, Mail, Database, Bot, Gift, Globe,
  Clock, CreditCard, FileText, Filter, ArrowRight, X, Check,
  Settings, Trash2, ChevronRight, BarChart3, AlertCircle, Webhook,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────
interface Automation {
  id: string
  name: string
  isActive: boolean
  runsThisMonth: number
  lastTriggered: string | null
  nodes: Node[]
  edges: Edge[]
}

interface NodeConfig {
  type: 'trigger' | 'condition' | 'action'
  subtype: string
  label: string
  config: Record<string, string | boolean>
}

// ─── Custom Node Components ─────────────────────────────────
function TriggerNode({ data }: { data: { label: string; subtype: string } }) {
  return (
    <div className="bg-[#0d1117] border-2 border-emerald-500/40 rounded-xl px-4 py-3 min-w-[180px] shadow-lg shadow-emerald-500/5">
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-[#0d1117]" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Trigger</span>
      </div>
      <p className="text-xs text-white/80 font-medium">{data.label}</p>
      <p className="text-[9px] text-white/30 mt-0.5">{data.subtype}</p>
    </div>
  )
}

function ConditionNode({ data }: { data: { label: string; subtype: string } }) {
  return (
    <div className="bg-[#0d1117] border-2 border-amber-500/40 rounded-xl px-4 py-3 min-w-[180px] shadow-lg shadow-amber-500/5">
      <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-[#0d1117]" />
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-[#0d1117]" id="yes" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Condition</span>
      </div>
      <p className="text-xs text-white/80 font-medium">{data.label}</p>
      <p className="text-[9px] text-white/30 mt-0.5">{data.subtype}</p>
    </div>
  )
}

function ActionNode({ data }: { data: { label: string; subtype: string } }) {
  return (
    <div className="bg-[#0d1117] border-2 border-cyan-500/40 rounded-xl px-4 py-3 min-w-[180px] shadow-lg shadow-cyan-500/5">
      <Handle type="target" position={Position.Top} className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-[#0d1117]" />
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-[#0d1117]" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          {data.subtype === 'send_email' && <Mail className="w-3.5 h-3.5 text-cyan-400" />}
          {data.subtype === 'add_to_db' && <Database className="w-3.5 h-3.5 text-cyan-400" />}
          {data.subtype === 'ai_agent' && <Bot className="w-3.5 h-3.5 text-cyan-400" />}
          {data.subtype === 'show_upsell' && <Gift className="w-3.5 h-3.5 text-cyan-400" />}
          {data.subtype === 'webhook' && <Webhook className="w-3.5 h-3.5 text-cyan-400" />}
          {!['send_email', 'add_to_db', 'ai_agent', 'show_upsell', 'webhook'].includes(data.subtype) && <Zap className="w-3.5 h-3.5 text-cyan-400" />}
        </div>
        <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">Action</span>
      </div>
      <p className="text-xs text-white/80 font-medium">{data.label}</p>
      <p className="text-[9px] text-white/30 mt-0.5">{data.subtype}</p>
    </div>
  )
}

const nodeTypes = { trigger: TriggerNode, condition: ConditionNode, action: ActionNode }

// ─── Node Library ────────────────────────────────────────────
const TRIGGERS = [
  { subtype: 'form_submitted', label: 'Form Submitted', icon: FileText },
  { subtype: 'payment_received', label: 'Payment Received', icon: CreditCard },
  { subtype: 'page_published', label: 'Page Published', icon: Globe },
  { subtype: 'time_based', label: 'Time-Based Trigger', icon: Clock },
]

const CONDITIONS = [
  { subtype: 'field_equals', label: 'Field Equals Value', icon: Filter },
  { subtype: 'amount_greater', label: 'Amount Greater Than', icon: CreditCard },
  { subtype: 'email_contains', label: 'Email Contains', icon: Mail },
]

const ACTIONS = [
  { subtype: 'send_email', label: 'Send Email', icon: Mail },
  { subtype: 'add_to_db', label: 'Add to Database', icon: Database },
  { subtype: 'ai_agent', label: 'Trigger AI Agent', icon: Bot },
  { subtype: 'show_upsell', label: 'Show Upsell', icon: Gift },
  { subtype: 'webhook', label: 'Webhook', icon: Webhook },
]

// ─── Quick Templates ─────────────────────────────────────────
const TEMPLATES = [
  {
    name: 'Lead Capture → Email',
    nodes: [
      { id: 't1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Form Submitted', subtype: 'form_submitted' } },
      { id: 'a1', type: 'action', position: { x: 250, y: 200 }, data: { label: 'Send Welcome Email', subtype: 'send_email' } },
      { id: 'a2', type: 'action', position: { x: 250, y: 350 }, data: { label: 'Add to CRM', subtype: 'add_to_db' } },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'a1' }, { id: 'e2', source: 'a1', target: 'a2' }],
  },
  {
    name: 'Payment → Upsell',
    nodes: [
      { id: 't1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Payment Received', subtype: 'payment_received' } },
      { id: 'c1', type: 'condition', position: { x: 250, y: 200 }, data: { label: 'Amount > $50?', subtype: 'amount_greater' } },
      { id: 'a1', type: 'action', position: { x: 250, y: 350 }, data: { label: 'Show Premium Upsell', subtype: 'show_upsell' } },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'c1' }, { id: 'e2', source: 'c1', target: 'a1', sourceHandle: 'yes' }],
  },
  {
    name: 'Publish → SEO',
    nodes: [
      { id: 't1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Page Published', subtype: 'page_published' } },
      { id: 'a1', type: 'action', position: { x: 250, y: 200 }, data: { label: 'Run SEO Agent', subtype: 'ai_agent' } },
      { id: 'a2', type: 'action', position: { x: 250, y: 350 }, data: { label: 'Send Notification', subtype: 'send_email' } },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'a1' }, { id: 'e2', source: 'a1', target: 'a2' }],
  },
  {
    name: 'Booking → Confirm',
    nodes: [
      { id: 't1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Form Submitted', subtype: 'form_submitted' } },
      { id: 'a1', type: 'action', position: { x: 250, y: 200 }, data: { label: 'Send Confirmation', subtype: 'send_email' } },
      { id: 'a2', type: 'action', position: { x: 250, y: 350 }, data: { label: 'Add to Calendar', subtype: 'add_to_db' } },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'a1' }, { id: 'e2', source: 'a1', target: 'a2' }],
  },
]

// ─── Input styles ────────────────────────────────────────────
const inp = 'w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder:text-white/20 focus:border-cyan-500/30 focus:outline-none'
const lbl = 'block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5'

// ─── Main Component ──────────────────────────────────────────
export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [activeAuto, setActiveAuto] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showNodeLib, setShowNodeLib] = useState(false)
  const [newName, setNewName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const reactFlowRef = useRef<HTMLDivElement>(null)

  // Limits
  const maxAutomations = 20
  const maxRuns = 1000
  const totalRuns = automations.reduce((s, a) => s + a.runsThisMonth, 0)

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, animated: true, style: { stroke: '#22d3ee', strokeWidth: 2 } }, eds))
  }, [setEdges])

  function createAutomation() {
    if (!newName.trim()) return
    const auto: Automation = {
      id: Date.now().toString(),
      name: newName,
      isActive: false,
      runsThisMonth: 0,
      lastTriggered: null,
      nodes: [],
      edges: [],
    }
    setAutomations([auto, ...automations])
    setActiveAuto(auto.id)
    setNodes([])
    setEdges([])
    setShowCreate(false)
    setNewName('')
  }

  function loadAutomation(id: string) {
    const auto = automations.find(a => a.id === id)
    if (!auto) return
    setActiveAuto(id)
    setNodes(auto.nodes)
    setEdges(auto.edges)
    setSelectedNode(null)
  }

  function saveAutomation() {
    if (!activeAuto) return
    setAutomations(automations.map(a => a.id === activeAuto ? { ...a, nodes, edges } : a))
  }

  function toggleAutomation(id: string) {
    if (automations.length >= maxAutomations && !automations.find(a => a.id === id)?.isActive) return
    setAutomations(automations.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))
  }

  function deleteAutomation(id: string) {
    setAutomations(automations.filter(a => a.id !== id))
    if (activeAuto === id) { setActiveAuto(null); setNodes([]); setEdges([]) }
  }

  function addNode(type: 'trigger' | 'condition' | 'action', subtype: string, label: string) {
    const id = `${type}-${Date.now()}`
    const newNode: Node = {
      id,
      type,
      position: { x: 250, y: (nodes.length + 1) * 150 },
      data: { label, subtype },
    }
    setNodes(nds => [...nds, newNode])
    setShowNodeLib(false)
  }

  function loadTemplate(template: typeof TEMPLATES[0]) {
    setNodes(template.nodes as Node[])
    setEdges(template.edges as Edge[])

    if (!activeAuto) {
      const auto: Automation = {
        id: Date.now().toString(), name: template.name, isActive: false,
        runsThisMonth: 0, lastTriggered: null, nodes: template.nodes as Node[], edges: template.edges as Edge[],
      }
      setAutomations([auto, ...automations])
      setActiveAuto(auto.id)
    }
  }

  // Config panel for selected node
  function renderConfig() {
    if (!selectedNode) return (
      <div className="text-center py-12">
        <Settings className="w-8 h-8 text-white/10 mx-auto mb-3" />
        <p className="text-xs text-white/30">Select a node to configure</p>
      </div>
    )

    const subtype = (selectedNode.data as { subtype?: string }).subtype

    return (
      <div className="space-y-4">
        <div>
          <label className={lbl}>Node Type</label>
          <p className="text-xs text-white/60 capitalize">{selectedNode.type}</p>
        </div>
        <div>
          <label className={lbl}>Label</label>
          <input defaultValue={(selectedNode.data as { label?: string }).label} className={inp} onChange={e => {
            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))
          }} />
        </div>

        {subtype === 'send_email' && (
          <>
            <div><label className={lbl}>To</label><input placeholder="{{lead.email}}" className={inp} /></div>
            <div><label className={lbl}>Subject</label><input placeholder="Welcome to..." className={inp} /></div>
            <div><label className={lbl}>Body</label><textarea rows={4} placeholder="Hi {{name}},..." className={inp + ' resize-y'} /></div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded" />
              <span className="text-[10px] text-white/40">Generate with AI</span>
            </label>
          </>
        )}

        {subtype === 'add_to_db' && (
          <>
            <div><label className={lbl}>Table</label><input placeholder="leads" className={inp} /></div>
            <div><label className={lbl}>Data (JSON)</label><textarea rows={3} placeholder='{"name": "{{name}}", "email": "{{email}}"}' className={inp + ' resize-y font-mono'} /></div>
          </>
        )}

        {subtype === 'ai_agent' && (
          <>
            <div><label className={lbl}>Agent Task</label><textarea rows={3} placeholder="Optimize this page for SEO..." className={inp + ' resize-y'} /></div>
            <div><label className={lbl}>Target</label><input placeholder="{{page.url}}" className={inp} /></div>
          </>
        )}

        {subtype === 'show_upsell' && (
          <>
            <div><label className={lbl}>Upsell Product</label><input placeholder="Premium Plan" className={inp} /></div>
            <div><label className={lbl}>Discount %</label><input type="number" placeholder="20" className={inp} /></div>
          </>
        )}

        {subtype === 'webhook' && (
          <>
            <div><label className={lbl}>URL</label><input placeholder="https://api.example.com/hook" className={inp + ' font-mono'} /></div>
            <div><label className={lbl}>Method</label>
              <select className={inp}><option>POST</option><option>GET</option><option>PUT</option></select>
            </div>
          </>
        )}

        {(subtype === 'field_equals' || subtype === 'amount_greater' || subtype === 'email_contains') && (
          <>
            <div><label className={lbl}>Field</label><input placeholder="email" className={inp} /></div>
            <div><label className={lbl}>{subtype === 'amount_greater' ? 'Threshold' : 'Value'}</label><input placeholder={subtype === 'amount_greater' ? '50' : 'value'} className={inp} /></div>
          </>
        )}

        <button onClick={() => { setNodes(nds => nds.filter(n => n.id !== selectedNode.id)); setSelectedNode(null) }} className="w-full py-2 text-xs text-red-400/60 hover:text-red-400 flex items-center justify-center gap-1.5 hover:bg-red-500/5 rounded-lg transition-colors">
          <Trash2 className="w-3 h-3" /> Delete Node
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#06080d] flex" style={{ zIndex: 50, top: '56px' }}>
      {/* Left Sidebar — Automation List */}
      <div className="w-[260px] border-r border-white/[0.06] bg-[#0a0d12] flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/70">Automations</h2>
            <button onClick={() => setShowCreate(true)} className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Limits */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[9px] text-white/30 mb-1"><span>{automations.length} / {maxAutomations} automations</span></div>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden"><div className="h-full bg-cyan-500/50 rounded-full transition-all" style={{ width: `${(automations.length / maxAutomations) * 100}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-white/30 mb-1"><span>{totalRuns} / {maxRuns} runs</span></div>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden"><div className="h-full bg-emerald-500/50 rounded-full transition-all" style={{ width: `${(totalRuns / maxRuns) * 100}%` }} /></div>
            </div>
          </div>
        </div>

        {/* Create */}
        {showCreate && (
          <div className="p-3 border-b border-white/[0.06]">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Automation name" className={inp} autoFocus onKeyDown={e => e.key === 'Enter' && createAutomation()} />
            <div className="flex gap-1.5 mt-2">
              <button onClick={createAutomation} className="flex-1 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-medium">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-[10px] text-white/30">Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {automations.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-6 h-6 text-white/10 mx-auto mb-2" />
              <p className="text-[10px] text-white/20">No automations yet</p>
            </div>
          ) : (
            automations.map(auto => (
              <div key={auto.id} onClick={() => loadAutomation(auto.id)} className={`p-3 rounded-xl cursor-pointer transition-colors group ${activeAuto === auto.id ? 'bg-white/[0.05] border border-white/[0.08]' : 'hover:bg-white/[0.02]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white/70 truncate">{auto.name}</span>
                  <button onClick={e => { e.stopPropagation(); toggleAutomation(auto.id) }} className={`w-7 h-4 rounded-full transition-colors relative ${auto.isActive ? 'bg-emerald-500/40' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${auto.isActive ? 'left-3.5 bg-emerald-400' : 'left-0.5 bg-white/30'}`} />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-white/25">
                  <span>{auto.runsThisMonth} runs</span>
                  <span>{auto.lastTriggered ? `Last: ${auto.lastTriggered}` : 'Never run'}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteAutomation(auto.id) }} className="opacity-0 group-hover:opacity-100 mt-1 text-[9px] text-red-400/40 hover:text-red-400 transition-all">Delete</button>
              </div>
            ))
          )}
        </div>

        {/* Templates */}
        <div className="p-3 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">Quick Start</p>
          <div className="space-y-1">
            {TEMPLATES.map(t => (
              <button key={t.name} onClick={() => loadTemplate(t)} className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors flex items-center gap-1.5">
                <ArrowRight className="w-2.5 h-2.5" /> {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center — Flow Canvas */}
      <div className="flex-1 relative" ref={reactFlowRef}>
        {activeAuto ? (
          <>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              fitView
              defaultEdgeOptions={{ animated: true, style: { stroke: '#22d3ee', strokeWidth: 2 } }}
              proOptions={{ hideAttribution: true }}
              style={{ background: '#0a0d12' }}
            >
              <Background color="#ffffff08" gap={24} />
              <Controls className="!bg-[#0d1117] !border-white/[0.08] !rounded-xl [&>button]:!bg-transparent [&>button]:!border-white/[0.06] [&>button]:!text-white/40 [&>button:hover]:!text-white/70" />
              <MiniMap className="!bg-[#0d1117] !border-white/[0.08] !rounded-xl" nodeColor="#22d3ee20" maskColor="#06080dee" />
            </ReactFlow>

            {/* Add Node Button */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <div className="relative">
                <button onClick={() => setShowNodeLib(!showNodeLib)} className="px-5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-xs text-white/60 font-medium hover:border-cyan-500/30 hover:text-cyan-400 transition-colors flex items-center gap-2 shadow-xl">
                  <Plus className="w-4 h-4" /> Add Node
                </button>

                {showNodeLib && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[320px] bg-[#0d1117] border border-white/[0.08] rounded-2xl shadow-2xl p-3 space-y-3">
                    <div>
                      <p className="text-[9px] text-emerald-400/60 font-semibold uppercase tracking-wider mb-1.5 px-1">Triggers</p>
                      <div className="grid grid-cols-2 gap-1">
                        {TRIGGERS.map(t => (<button key={t.subtype} onClick={() => addNode('trigger', t.subtype, t.label)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/5 text-[10px] text-white/50 hover:text-emerald-400 transition-colors"><t.icon className="w-3 h-3" /> {t.label}</button>))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-amber-400/60 font-semibold uppercase tracking-wider mb-1.5 px-1">Conditions</p>
                      <div className="grid grid-cols-2 gap-1">
                        {CONDITIONS.map(c => (<button key={c.subtype} onClick={() => addNode('condition', c.subtype, c.label)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/5 text-[10px] text-white/50 hover:text-amber-400 transition-colors"><c.icon className="w-3 h-3" /> {c.label}</button>))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-cyan-400/60 font-semibold uppercase tracking-wider mb-1.5 px-1">Actions</p>
                      <div className="grid grid-cols-2 gap-1">
                        {ACTIONS.map(a => (<button key={a.subtype} onClick={() => addNode('action', a.subtype, a.label)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/5 text-[10px] text-white/50 hover:text-cyan-400 transition-colors"><a.icon className="w-3 h-3" /> {a.label}</button>))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save indicator */}
            <button onClick={saveAutomation} className="absolute top-4 right-[280px] z-10 px-3 py-1.5 bg-[#0d1117] border border-white/[0.08] rounded-lg text-[10px] text-white/40 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Save
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Zap className="w-12 h-12 text-white/5 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white/30 mb-2">Automation Builder</h3>
              <p className="text-xs text-white/20 mb-6 max-w-xs">Create an automation or pick a quick-start template to get started.</p>
              <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 transition-all">
                Create Automation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar — Config */}
      <div className="w-[260px] border-l border-white/[0.06] bg-[#0a0d12] flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-xs font-semibold text-white/50 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Node Configuration</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {renderConfig()}
        </div>

        {/* Execution Stats */}
        {activeAuto && (
          <div className="p-4 border-t border-white/[0.06] space-y-2">
            <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Execution</p>
            {(() => {
              const auto = automations.find(a => a.id === activeAuto)
              if (!auto) return null
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">Status</span>
                    <span className={`text-[10px] font-medium ${auto.isActive ? 'text-emerald-400' : 'text-white/30'}`}>{auto.isActive ? 'Active' : 'Paused'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">Runs this month</span>
                    <span className="text-[10px] text-white/50">{auto.runsThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">Last triggered</span>
                    <span className="text-[10px] text-white/50">{auto.lastTriggered ?? 'Never'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">Nodes</span>
                    <span className="text-[10px] text-white/50">{nodes.length}</span>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
