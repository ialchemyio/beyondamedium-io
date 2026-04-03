'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Save, Monitor, Tablet, Smartphone, Code2,
  Eye, Undo2, Redo2, Check, Sparkles, Plus, FileText,
  ChevronDown, Trash2, Cpu,
} from 'lucide-react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GjsEditor = any

// ─── Types ───────────────────────────────────────────────────
interface PageData {
  id: string
  title: string
  slug: string
  html: string
  css: string
  js: string
  gjs_data: Record<string, unknown>
  is_home: boolean
  sort_order: number
}

interface ProjectData {
  id: string
  name: string
  slug: string
}

// ─── Editor Component ────────────────────────────────────────
export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const editorRef = useRef<GjsEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [project, setProject] = useState<ProjectData | null>(null)
  const [pages, setPages] = useState<PageData[]>([])
  const [activePage, setActivePage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showCode, setShowCode] = useState(false)
  const [codeHtml, setCodeHtml] = useState('')
  const [codeCss, setCodeCss] = useState('')
  const [editorReady, setEditorReady] = useState(false)
  const [showPages, setShowPages] = useState(false)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')

  // Load project + pages
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: proj } = await supabase
        .from('projects').select('id, name, slug').eq('id', projectId).single()
      if (proj) setProject(proj)

      const { data: pgs } = await supabase
        .from('pages').select('*').eq('project_id', projectId).order('sort_order')
      if (pgs && pgs.length > 0) {
        setPages(pgs)
        setActivePage(pgs[0].id)
      }
    }
    load()
  }, [projectId])

  // Initialize GrapeJS
  useEffect(() => {
    if (!containerRef.current || !activePage || editorRef.current) return

    const page = pages.find(p => p.id === activePage)
    if (!page) return

    async function initEditor() {
      const grapesjs = (await import('grapesjs')).default
      const blocksBasic = (await import('grapesjs-blocks-basic')).default
      const presetWebpage = (await import('grapesjs-preset-webpage')).default
      const pluginForms = (await import('grapesjs-plugin-forms')).default
      const customCode = (await import('grapesjs-custom-code')).default
      const tabs = (await import('grapesjs-tabs')).default
      const navbar = (await import('grapesjs-navbar')).default

      // Import GrapeJS CSS
      if (!document.getElementById('gjs-css')) {
        const link = document.createElement('link')
        link.id = 'gjs-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/grapesjs@0.22.14/dist/css/grapes.min.css'
        document.head.appendChild(link)
      }

      const editor = grapesjs.init({
        container: containerRef.current!,
        height: '100%',
        width: 'auto',
        storageManager: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins: [blocksBasic, presetWebpage, pluginForms, customCode, tabs, navbar] as any[],
        pluginsOpts: {
          [blocksBasic as unknown as string]: {
            flexGrid: true,
          },
          [presetWebpage as unknown as string]: {
            modalImportTitle: 'Import Code',
            modalImportLabel: '<div style="margin-bottom:10px">Paste HTML/CSS here</div>',
            modalImportContent: '',
          },
        },
        canvas: {
          styles: [
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
            'https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css',
          ],
        },
        deviceManager: {
          devices: [
            { name: 'Desktop', width: '' },
            { name: 'Tablet', width: '768px', widthMedia: '992px' },
            { name: 'Mobile', width: '375px', widthMedia: '480px' },
          ],
        },
        panels: { defaults: [] },
        blockManager: {
          appendTo: '#blocks-panel',
        },
        layerManager: {
          appendTo: '#layers-panel',
        },
        styleManager: {
          appendTo: '#styles-panel',
          sectors: [
            {
              name: 'Layout',
              open: true,
              properties: [
                'display', 'flex-direction', 'justify-content', 'align-items',
                'flex-wrap', 'gap', 'width', 'height', 'min-height', 'max-width',
                'overflow',
              ],
            },
            {
              name: 'Spacing',
              open: false,
              properties: ['padding', 'margin'],
            },
            {
              name: 'Typography',
              open: false,
              properties: [
                'font-family', 'font-size', 'font-weight', 'letter-spacing',
                'color', 'line-height', 'text-align', 'text-decoration',
                'text-transform',
              ],
            },
            {
              name: 'Background',
              open: false,
              properties: ['background-color', 'background-image', 'background-size', 'background-position'],
            },
            {
              name: 'Borders',
              open: false,
              properties: ['border-radius', 'border', 'box-shadow'],
            },
            {
              name: 'Position',
              open: false,
              properties: ['position', 'top', 'right', 'bottom', 'left', 'z-index'],
            },
          ],
        },
        selectorManager: {
          appendTo: '#selectors-panel',
        },
        traitManager: {
          appendTo: '#traits-panel',
        },
      })

      // Add custom blocks
      addCustomBlocks(editor)

      // Load saved content
      if (page!.gjs_data && Object.keys(page!.gjs_data).length > 0) {
        editor.loadProjectData(page!.gjs_data as Record<string, unknown>)
      } else if (page!.html) {
        editor.setComponents(page!.html)
        if (page!.css) editor.setStyle(page!.css)
      }

      // Track changes
      editor.on('change:changesCount', () => setHasChanges(true))

      // Dark theme overrides
      applyDarkTheme()

      editorRef.current = editor
      setEditorReady(true)
    }

    initEditor()

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
        setEditorReady(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage])

  // Device switching
  useEffect(() => {
    if (!editorRef.current) return
    const deviceMap = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' }
    editorRef.current.setDevice(deviceMap[device])
  }, [device])

  // Save
  const handleSave = useCallback(async () => {
    if (!editorRef.current || !activePage) return
    setSaving(true)

    const editor = editorRef.current
    const html = editor.getHtml()
    const css = editor.getCss()
    const gjsData = editor.getProjectData()

    const supabase = createClient()
    await supabase.from('pages').update({
      html, css, gjs_data: gjsData, updated_at: new Date().toISOString(),
    }).eq('id', activePage)

    setSaving(false)
    setSaved(true)
    setHasChanges(false)
    setTimeout(() => setSaved(false), 2000)
  }, [activePage])

  // Code view
  function toggleCodeView() {
    if (!editorRef.current) return
    if (!showCode) {
      setCodeHtml(editorRef.current.getHtml())
      setCodeCss(editorRef.current.getCss() ?? '')
    }
    setShowCode(!showCode)
  }

  function applyCodeChanges() {
    if (!editorRef.current) return
    editorRef.current.setComponents(codeHtml)
    editorRef.current.setStyle(codeCss)
    setShowCode(false)
    setHasChanges(true)
  }

  // Page management
  async function createPage() {
    if (!newPageTitle.trim()) return
    const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    const supabase = createClient()
    const { data } = await supabase.from('pages').insert({
      project_id: projectId,
      title: newPageTitle.trim(),
      slug,
      sort_order: pages.length,
    }).select().single()
    if (data) {
      setPages([...pages, data])
      setShowNewPage(false)
      setNewPageTitle('')
      // Switch to new page
      switchPage(data.id)
    }
  }

  async function deletePage(pageId: string) {
    if (pages.length <= 1) { alert('Cannot delete the last page'); return }
    if (!confirm('Delete this page?')) return
    const supabase = createClient()
    await supabase.from('pages').delete().eq('id', pageId)
    const remaining = pages.filter(p => p.id !== pageId)
    setPages(remaining)
    if (activePage === pageId) switchPage(remaining[0].id)
  }

  function switchPage(pageId: string) {
    if (editorRef.current) {
      // Save current page state first
      const editor = editorRef.current
      const currentPage = pages.find(p => p.id === activePage)
      if (currentPage) {
        const gjsData = editor.getProjectData()
        const html = editor.getHtml()
        const css = editor.getCss()
        setPages(prev => prev.map(p => p.id === activePage ? { ...p, html: html ?? '', css: css ?? '', gjs_data: gjsData } : p))
      }
      editor.destroy()
      editorRef.current = null
      setEditorReady(false)
    }
    setActivePage(pageId)
  }

  function handleExit() {
    if (hasChanges && !confirm('You have unsaved changes. Leave without saving?')) return
    router.push('/dashboard')
  }

  if (!project) {
    return (
      <div className="fixed inset-0 bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0d1117] flex flex-col" style={{ zIndex: 9999 }}>
      {/* ─── Top Bar ──────────────────── */}
      <div className="h-11 border-b border-white/[0.06] flex items-center justify-between px-3 shrink-0 bg-[#0d1117]">
        <div className="flex items-center gap-2">
          <button onClick={handleExit} className="p-1.5 text-white/40 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/[0.06]" />
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Cpu className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-medium text-white/70 truncate max-w-[150px]">{project.name}</span>
          </div>

          {/* Page switcher */}
          <div className="relative ml-2">
            <button onClick={() => setShowPages(!showPages)} className="flex items-center gap-1 px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[11px] text-white/50 hover:text-white/70 transition-colors">
              <FileText className="w-3 h-3" />
              {pages.find(p => p.id === activePage)?.title ?? 'Page'}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showPages && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#161b22] border border-white/[0.08] rounded-xl shadow-2xl py-1 z-50">
                {pages.map(p => (
                  <div key={p.id} className="flex items-center group">
                    <button
                      onClick={() => { switchPage(p.id); setShowPages(false) }}
                      className={`flex-1 text-left px-3 py-1.5 text-xs transition-colors ${p.id === activePage ? 'text-cyan-400 bg-cyan-500/5' : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]'}`}
                    >
                      {p.title} {p.is_home && <span className="text-[9px] text-white/20 ml-1">(home)</span>}
                    </button>
                    {!p.is_home && (
                      <button onClick={() => deletePage(p.id)} className="p-1 mr-1 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="border-t border-white/[0.04] mt-1 pt-1">
                  {showNewPage ? (
                    <div className="px-2 py-1 flex gap-1">
                      <input value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} placeholder="Page name" className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none" autoFocus onKeyDown={e => e.key === 'Enter' && createPage()} />
                      <button onClick={createPage} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-[10px] font-medium">Add</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowNewPage(true)} className="w-full text-left px-3 py-1.5 text-xs text-white/30 hover:text-white/50 flex items-center gap-1.5">
                      <Plus className="w-3 h-3" /> New Page
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Undo/Redo */}
          <button onClick={() => editorRef.current?.UndoManager.undo()} className="p-1.5 text-white/30 hover:text-white/60 rounded-lg hover:bg-white/5 transition-colors">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => editorRef.current?.UndoManager.redo()} className="p-1.5 text-white/30 hover:text-white/60 rounded-lg hover:bg-white/5 transition-colors">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-white/[0.06] mx-1" />

          {/* Devices */}
          {([
            { mode: 'desktop' as const, icon: Monitor },
            { mode: 'tablet' as const, icon: Tablet },
            { mode: 'mobile' as const, icon: Smartphone },
          ]).map(({ mode, icon: Icon }) => (
            <button key={mode} onClick={() => setDevice(mode)} className={`p-1.5 rounded-lg transition-colors ${device === mode ? 'bg-white/[0.08] text-cyan-400' : 'text-white/25 hover:text-white/50'}`}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <div className="w-px h-4 bg-white/[0.06] mx-1" />

          {/* Code view */}
          <button onClick={toggleCodeView} className={`p-1.5 rounded-lg transition-colors ${showCode ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/25 hover:text-white/50'}`}>
            <Code2 className="w-3.5 h-3.5" />
          </button>

          {/* Preview */}
          <button onClick={() => editorRef.current?.runCommand('preview')} className="p-1.5 text-white/25 hover:text-white/50 rounded-lg hover:bg-white/5 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/[0.06] mx-1" />

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              saved ? 'bg-emerald-500/20 text-emerald-400' :
              hasChanges ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110' :
              'bg-white/[0.06] text-white/40'
            }`}
          >
            {saved ? <><Check className="w-3 h-3" /> Saved</> :
             saving ? 'Saving...' :
             <><Save className="w-3 h-3" /> Save</>}
            {hasChanges && !saving && !saved && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
          </button>
        </div>
      </div>

      {/* ─── Main Area ────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor Overlay */}
        {showCode && (
          <div className="absolute inset-0 z-50 bg-[#0d1117]/95 backdrop-blur-sm flex flex-col" style={{ top: '44px' }}>
            <div className="flex-1 flex gap-0">
              <div className="flex-1 flex flex-col border-r border-white/[0.06]">
                <div className="px-4 py-2 border-b border-white/[0.06] text-[11px] text-white/40 font-mono">HTML</div>
                <textarea
                  value={codeHtml}
                  onChange={e => setCodeHtml(e.target.value)}
                  className="flex-1 p-4 bg-transparent text-white/80 font-mono text-xs resize-none focus:outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 border-b border-white/[0.06] text-[11px] text-white/40 font-mono">CSS</div>
                <textarea
                  value={codeCss}
                  onChange={e => setCodeCss(e.target.value)}
                  className="flex-1 p-4 bg-transparent text-white/80 font-mono text-xs resize-none focus:outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/[0.06]">
              <button onClick={() => setShowCode(false)} className="px-4 py-2 text-xs text-white/40 hover:text-white/60 transition-colors">Cancel</button>
              <button onClick={applyCodeChanges} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all">
                Apply Changes
              </button>
            </div>
          </div>
        )}

        {/* Left Panel — Blocks */}
        <div className="w-[240px] border-r border-white/[0.06] bg-[#0d1117] flex flex-col overflow-hidden shrink-0">
          <div className="flex border-b border-white/[0.06]">
            <PanelTab id="blocks" label="Blocks" />
            <PanelTab id="layers" label="Layers" />
          </div>
          <div id="blocks-panel" className="flex-1 overflow-y-auto gjs-blocks-panel" />
          <div id="layers-panel" className="flex-1 overflow-y-auto hidden" />
        </div>

        {/* Center — Canvas */}
        <div className="flex-1 overflow-hidden bg-[#161b22] relative">
          {!editorReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-white/30">Loading editor...</p>
              </div>
            </div>
          )}
          <div ref={containerRef} className="h-full" />
        </div>

        {/* Right Panel — Styles + Traits */}
        <div className="w-[260px] border-l border-white/[0.06] bg-[#0d1117] flex flex-col overflow-hidden shrink-0">
          <div className="flex border-b border-white/[0.06]">
            <PanelTab id="styles" label="Style" />
            <PanelTab id="traits" label="Settings" />
          </div>
          <div id="selectors-panel" className="border-b border-white/[0.06]" />
          <div id="styles-panel" className="flex-1 overflow-y-auto gjs-styles-panel" />
          <div id="traits-panel" className="flex-1 overflow-y-auto hidden" />
        </div>
      </div>

      {/* Dark theme styles */}
      <style jsx global>{`
        /* GrapeJS Dark Theme Override */
        .gjs-one-bg { background-color: #0d1117 !important; }
        .gjs-two-color { color: rgba(255,255,255,0.6) !important; }
        .gjs-three-bg { background-color: #161b22 !important; }
        .gjs-four-color, .gjs-four-color-h:hover { color: #22d3ee !important; }

        .gjs-block {
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          border-radius: 8px !important;
          color: rgba(255,255,255,0.5) !important;
          padding: 8px !important;
          margin: 3px !important;
          min-height: auto !important;
          transition: all 0.15s !important;
        }
        .gjs-block:hover {
          border-color: rgba(34,211,238,0.3) !important;
          background: rgba(34,211,238,0.05) !important;
        }
        .gjs-block svg { fill: rgba(255,255,255,0.3) !important; }
        .gjs-block__media { margin-bottom: 4px !important; }
        .gjs-block-label { font-size: 10px !important; }

        .gjs-category-title, .gjs-layer-title, .gjs-sm-sector-title {
          background: transparent !important;
          border-bottom: 1px solid rgba(255,255,255,0.04) !important;
          color: rgba(255,255,255,0.4) !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 10px 12px !important;
        }

        .gjs-field {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 6px !important;
          color: rgba(255,255,255,0.7) !important;
        }
        .gjs-field:focus-within {
          border-color: rgba(34,211,238,0.4) !important;
        }
        .gjs-field input, .gjs-field select, .gjs-field textarea {
          color: rgba(255,255,255,0.7) !important;
        }

        .gjs-sm-property { padding: 4px 10px !important; }
        .gjs-sm-label { color: rgba(255,255,255,0.35) !important; font-size: 10px !important; }

        .gjs-layer {
          background: transparent !important;
          color: rgba(255,255,255,0.5) !important;
        }
        .gjs-layer:hover { background: rgba(255,255,255,0.03) !important; }
        .gjs-layer.gjs-selected { background: rgba(34,211,238,0.08) !important; color: #22d3ee !important; }

        .gjs-pn-panel { background: #0d1117 !important; }
        .gjs-pn-btn { color: rgba(255,255,255,0.4) !important; }
        .gjs-pn-btn:hover { color: rgba(255,255,255,0.7) !important; }
        .gjs-pn-btn.gjs-pn-active { color: #22d3ee !important; }

        .gjs-cv-canvas { background: #161b22 !important; }
        .gjs-frame-wrapper { border-radius: 8px; overflow: hidden; }

        .gjs-toolbar { background: #0d1117 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; }
        .gjs-toolbar-item { color: rgba(255,255,255,0.5) !important; }

        .gjs-badge { background: #0891b2 !important; }
        .gjs-highlighter, .gjs-hovered { outline-color: #22d3ee !important; }

        .gjs-clm-tags { padding: 8px !important; }
        .gjs-clm-tag { background: rgba(34,211,238,0.1) !important; color: #22d3ee !important; border-radius: 4px !important; }

        .gjs-mdl-dialog { background: #161b22 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; }
        .gjs-mdl-title { color: white !important; }

        .gjs-blocks-panel .gjs-blocks-cs { padding: 8px !important; }

        /* Hide default panels */
        .gjs-pn-panels { display: none !important; }

        /* Scrollbar */
        .gjs-blocks-panel::-webkit-scrollbar, .gjs-styles-panel::-webkit-scrollbar { width: 4px; }
        .gjs-blocks-panel::-webkit-scrollbar-thumb, .gjs-styles-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  )
}

// ─── Panel Tab Component ─────────────────────────────────────
function PanelTab({ id, label }: { id: string; label: string }) {
  const [active, setActive] = useState(id === 'blocks' || id === 'styles')

  function toggle() {
    setActive(true)
    // Show/hide panels by toggling CSS
    const panels = document.querySelectorAll(`#${id}-panel`)
    panels.forEach(p => (p as HTMLElement).classList.remove('hidden'))

    // Hide sibling panels
    const siblings = id === 'blocks' ? ['layers'] : id === 'layers' ? ['blocks'] : id === 'styles' ? ['traits'] : ['styles']
    siblings.forEach(s => {
      document.querySelectorAll(`#${s}-panel`).forEach(p => (p as HTMLElement).classList.add('hidden'))
    })
  }

  return (
    <button
      onClick={toggle}
      className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${active ? 'text-cyan-400 border-b border-cyan-400' : 'text-white/30 hover:text-white/50'}`}
    >
      {label}
    </button>
  )
}

// ─── Custom Blocks ───────────────────────────────────────────
function addCustomBlocks(editor: GjsEditor) {
  const bm = editor.BlockManager

  // Hero Section
  bm.add('hero-section', {
    label: 'Hero Section',
    category: 'Sections',
    content: `<section style="min-height:80vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:80px 40px;background:linear-gradient(135deg,#0f172a,#1e293b)">
      <div style="max-width:800px">
        <h1 style="font-size:48px;font-weight:800;color:white;margin-bottom:20px;line-height:1.1">Your Amazing Headline Here</h1>
        <p style="font-size:20px;color:rgba(255,255,255,0.6);margin-bottom:40px;line-height:1.6">Describe your product or service in a compelling way that makes visitors want to learn more.</p>
        <a href="#" style="display:inline-block;padding:16px 32px;background:#06b6d4;color:white;font-weight:600;border-radius:12px;text-decoration:none;font-size:16px">Get Started</a>
      </div>
    </section>`,
  })

  // Features Grid
  bm.add('features-grid', {
    label: 'Features Grid',
    category: 'Sections',
    content: `<section style="padding:80px 40px;background:#ffffff">
      <div style="max-width:1000px;margin:0 auto">
        <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:16px;color:#0f172a">Features</h2>
        <p style="text-align:center;color:#64748b;margin-bottom:48px;font-size:18px">Everything you need to succeed</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
          <div style="padding:32px;border-radius:16px;border:1px solid #e2e8f0">
            <h3 style="font-size:18px;font-weight:600;margin-bottom:8px;color:#0f172a">Feature One</h3>
            <p style="color:#64748b;font-size:14px;line-height:1.6">Description of this amazing feature and why it matters to your users.</p>
          </div>
          <div style="padding:32px;border-radius:16px;border:1px solid #e2e8f0">
            <h3 style="font-size:18px;font-weight:600;margin-bottom:8px;color:#0f172a">Feature Two</h3>
            <p style="color:#64748b;font-size:14px;line-height:1.6">Description of this amazing feature and why it matters to your users.</p>
          </div>
          <div style="padding:32px;border-radius:16px;border:1px solid #e2e8f0">
            <h3 style="font-size:18px;font-weight:600;margin-bottom:8px;color:#0f172a">Feature Three</h3>
            <p style="color:#64748b;font-size:14px;line-height:1.6">Description of this amazing feature and why it matters to your users.</p>
          </div>
        </div>
      </div>
    </section>`,
  })

  // Pricing Table
  bm.add('pricing-section', {
    label: 'Pricing Table',
    category: 'Sections',
    content: `<section style="padding:80px 40px;background:#f8fafc">
      <div style="max-width:1000px;margin:0 auto">
        <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:48px;color:#0f172a">Pricing</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
          <div style="padding:40px;background:white;border-radius:16px;border:1px solid #e2e8f0;text-align:center">
            <h3 style="font-size:20px;font-weight:600;color:#0f172a">Starter</h3>
            <div style="font-size:48px;font-weight:800;margin:16px 0;color:#0f172a">$9<span style="font-size:16px;color:#94a3b8">/mo</span></div>
            <ul style="list-style:none;padding:0;margin:24px 0;text-align:left;color:#64748b;font-size:14px;line-height:2.2">
              <li>5 Projects</li><li>Basic Analytics</li><li>Email Support</li>
            </ul>
            <a href="#" style="display:block;padding:12px;background:#e2e8f0;color:#0f172a;border-radius:10px;text-decoration:none;font-weight:600">Choose Plan</a>
          </div>
          <div style="padding:40px;background:#0f172a;border-radius:16px;text-align:center;color:white;transform:scale(1.05)">
            <h3 style="font-size:20px;font-weight:600">Pro</h3>
            <div style="font-size:48px;font-weight:800;margin:16px 0">$29<span style="font-size:16px;color:rgba(255,255,255,0.5)">/mo</span></div>
            <ul style="list-style:none;padding:0;margin:24px 0;text-align:left;color:rgba(255,255,255,0.7);font-size:14px;line-height:2.2">
              <li>Unlimited Projects</li><li>Advanced Analytics</li><li>Priority Support</li><li>Custom Domain</li>
            </ul>
            <a href="#" style="display:block;padding:12px;background:#06b6d4;color:white;border-radius:10px;text-decoration:none;font-weight:600">Choose Plan</a>
          </div>
          <div style="padding:40px;background:white;border-radius:16px;border:1px solid #e2e8f0;text-align:center">
            <h3 style="font-size:20px;font-weight:600;color:#0f172a">Enterprise</h3>
            <div style="font-size:48px;font-weight:800;margin:16px 0;color:#0f172a">$99<span style="font-size:16px;color:#94a3b8">/mo</span></div>
            <ul style="list-style:none;padding:0;margin:24px 0;text-align:left;color:#64748b;font-size:14px;line-height:2.2">
              <li>Everything in Pro</li><li>White Label</li><li>API Access</li><li>Dedicated Support</li>
            </ul>
            <a href="#" style="display:block;padding:12px;background:#e2e8f0;color:#0f172a;border-radius:10px;text-decoration:none;font-weight:600">Choose Plan</a>
          </div>
        </div>
      </div>
    </section>`,
  })

  // CTA Section
  bm.add('cta-section', {
    label: 'CTA Section',
    category: 'Sections',
    content: `<section style="padding:80px 40px;background:linear-gradient(135deg,#06b6d4,#3b82f6);text-align:center">
      <h2 style="font-size:36px;font-weight:700;color:white;margin-bottom:16px">Ready to get started?</h2>
      <p style="font-size:18px;color:rgba(255,255,255,0.8);margin-bottom:32px">Join thousands of happy customers today.</p>
      <a href="#" style="display:inline-block;padding:16px 40px;background:white;color:#0f172a;font-weight:700;border-radius:12px;text-decoration:none;font-size:16px">Start Free Trial</a>
    </section>`,
  })

  // Testimonials
  bm.add('testimonials', {
    label: 'Testimonials',
    category: 'Sections',
    content: `<section style="padding:80px 40px;background:white">
      <div style="max-width:1000px;margin:0 auto">
        <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:48px;color:#0f172a">What Our Customers Say</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
          <div style="padding:32px;background:#f8fafc;border-radius:16px">
            <p style="color:#475569;font-size:14px;line-height:1.7;margin-bottom:20px">"This product changed the way we work. Highly recommended!"</p>
            <div style="font-weight:600;color:#0f172a;font-size:14px">Sarah Johnson</div>
            <div style="color:#94a3b8;font-size:12px">CEO, TechCorp</div>
          </div>
          <div style="padding:32px;background:#f8fafc;border-radius:16px">
            <p style="color:#475569;font-size:14px;line-height:1.7;margin-bottom:20px">"Amazing quality and incredible support. Five stars!"</p>
            <div style="font-weight:600;color:#0f172a;font-size:14px">Mike Chen</div>
            <div style="color:#94a3b8;font-size:12px">Founder, StartupXYZ</div>
          </div>
          <div style="padding:32px;background:#f8fafc;border-radius:16px">
            <p style="color:#475569;font-size:14px;line-height:1.7;margin-bottom:20px">"Best investment we made this year. ROI was immediate."</p>
            <div style="font-weight:600;color:#0f172a;font-size:14px">Lisa Park</div>
            <div style="color:#94a3b8;font-size:12px">Director, GlobalInc</div>
          </div>
        </div>
      </div>
    </section>`,
  })

  // Footer
  bm.add('footer-section', {
    label: 'Footer',
    category: 'Sections',
    content: `<footer style="padding:60px 40px 30px;background:#0f172a;color:rgba(255,255,255,0.5)">
      <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px">
        <div>
          <div style="font-size:20px;font-weight:700;color:white;margin-bottom:12px">Company</div>
          <p style="font-size:14px;line-height:1.7">Building amazing products for the modern web.</p>
        </div>
        <div>
          <div style="font-weight:600;color:white;margin-bottom:12px;font-size:14px">Product</div>
          <div style="font-size:13px;line-height:2.2"><a href="#" style="color:rgba(255,255,255,0.5);text-decoration:none">Features</a></div>
          <div style="font-size:13px;line-height:2.2"><a href="#" style="color:rgba(255,255,255,0.5);text-decoration:none">Pricing</a></div>
        </div>
        <div>
          <div style="font-weight:600;color:white;margin-bottom:12px;font-size:14px">Company</div>
          <div style="font-size:13px;line-height:2.2"><a href="#" style="color:rgba(255,255,255,0.5);text-decoration:none">About</a></div>
          <div style="font-size:13px;line-height:2.2"><a href="#" style="color:rgba(255,255,255,0.5);text-decoration:none">Blog</a></div>
        </div>
        <div>
          <div style="font-weight:600;color:white;margin-bottom:12px;font-size:14px">Legal</div>
          <div style="font-size:13px;line-height:2.2"><a href="#" style="color:rgba(255,255,255,0.5);text-decoration:none">Privacy</a></div>
          <div style="font-size:13px;line-height:2.2"><a href="#" style="color:rgba(255,255,255,0.5);text-decoration:none">Terms</a></div>
        </div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;text-align:center;font-size:12px">&copy; 2026 Company. All rights reserved.</div>
    </footer>`,
  })

  // Contact Form
  bm.add('contact-form', {
    label: 'Contact Form',
    category: 'Sections',
    content: `<section style="padding:80px 40px;background:#f8fafc">
      <div style="max-width:600px;margin:0 auto">
        <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:8px;color:#0f172a">Contact Us</h2>
        <p style="text-align:center;color:#64748b;margin-bottom:40px">We'd love to hear from you</p>
        <form style="display:flex;flex-direction:column;gap:16px">
          <input type="text" placeholder="Your Name" style="padding:14px 16px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;background:white" />
          <input type="email" placeholder="Email Address" style="padding:14px 16px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;background:white" />
          <textarea placeholder="Your Message" rows="4" style="padding:14px 16px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;background:white;resize:vertical"></textarea>
          <button type="submit" style="padding:14px;background:#0f172a;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Send Message</button>
        </form>
      </div>
    </section>`,
  })

  // Image + Text
  bm.add('image-text', {
    label: 'Image + Text',
    category: 'Sections',
    content: `<section style="padding:80px 40px;background:white">
      <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
        <div style="background:#e2e8f0;border-radius:16px;height:400px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:14px">Image Placeholder</div>
        <div>
          <h2 style="font-size:32px;font-weight:700;color:#0f172a;margin-bottom:16px;line-height:1.2">Tell your story with impact</h2>
          <p style="color:#64748b;font-size:16px;line-height:1.7;margin-bottom:24px">Share what makes your product or service special. Connect with your audience on a personal level.</p>
          <a href="#" style="display:inline-block;padding:12px 24px;background:#0f172a;color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">Learn More</a>
        </div>
      </div>
    </section>`,
  })

  // FAQ
  bm.add('faq-section', {
    label: 'FAQ',
    category: 'Sections',
    content: `<section style="padding:80px 40px;background:white">
      <div style="max-width:700px;margin:0 auto">
        <h2 style="font-size:36px;font-weight:700;text-align:center;margin-bottom:48px;color:#0f172a">FAQ</h2>
        <div style="border-top:1px solid #e2e8f0">
          <div style="padding:24px 0;border-bottom:1px solid #e2e8f0">
            <h3 style="font-size:16px;font-weight:600;color:#0f172a;margin-bottom:8px">How does it work?</h3>
            <p style="color:#64748b;font-size:14px;line-height:1.6">Our platform makes it easy to get started. Simply sign up, choose a template, and customize it to your needs.</p>
          </div>
          <div style="padding:24px 0;border-bottom:1px solid #e2e8f0">
            <h3 style="font-size:16px;font-weight:600;color:#0f172a;margin-bottom:8px">Can I cancel anytime?</h3>
            <p style="color:#64748b;font-size:14px;line-height:1.6">Yes, you can cancel your subscription at any time. No questions asked.</p>
          </div>
          <div style="padding:24px 0;border-bottom:1px solid #e2e8f0">
            <h3 style="font-size:16px;font-weight:600;color:#0f172a;margin-bottom:8px">Do you offer support?</h3>
            <p style="color:#64748b;font-size:14px;line-height:1.6">We offer 24/7 support via email and live chat for all paid plans.</p>
          </div>
        </div>
      </div>
    </section>`,
  })
}

function applyDarkTheme() {
  // Additional runtime dark theme fixes
  const style = document.createElement('style')
  style.textContent = `
    .gjs-editor { background: #0d1117 !important; }
    .gjs-cv-canvas { background: #161b22 !important; }
  `
  document.head.appendChild(style)
}
