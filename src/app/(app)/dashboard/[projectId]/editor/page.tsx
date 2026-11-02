'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Save, Monitor, Tablet, Smartphone, Code2,
  Eye, Undo2, Redo2, Check, Sparkles, Plus, FileText,
  ChevronDown, Trash2, Send, Bot, Loader2, Wand2,
  X as XIcon, Rocket, Palette, Search, ArrowUp, ArrowDown, ImageIcon, PenLine,
} from 'lucide-react'
import { DEFAULT_THEME, THEME_PRESETS, FONT_OPTIONS, normalizeTheme, themeCss, themeFontUrl, type SiteTheme } from '@/lib/theme'
import { SEO_TITLE_MAX, SEO_DESC_MAX, type SeoMap } from '@/lib/seo'
import { CREDIT_COSTS } from '@/lib/credit-costs'
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
  settings?: Record<string, unknown> | null
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
  // HTML+CSS as last loaded/saved; "unsaved" means the canvas differs from it.
  const savedSnapshotRef = useRef<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showCode, setShowCode] = useState(false)
  const [codeHtml, setCodeHtml] = useState('')
  const [codeCss, setCodeCss] = useState('')
  const [editorReady, setEditorReady] = useState(false)
  const [showPages, setShowPages] = useState(false)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')

  // AI state
  const [showAI, setShowAI] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; type?: string }>>([])
  const [aiMode, setAiMode] = useState<'page' | 'section' | 'edit' | 'copy'>('page')
  const [aiStyle, setAiStyle] = useState('auto')
  const [showStyles, setShowStyles] = useState(false)
  const aiScrollRef = useRef<HTMLDivElement>(null)

  // Theme + blocks + assets
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME)
  const [showTheme, setShowTheme] = useState(false)
  const [showSeo, setShowSeo] = useState(false)
  const [seoDraft, setSeoDraft] = useState<SeoMap>({})
  const [seoBusy, setSeoBusy] = useState<'' | 'generate' | 'save'>('')
  const [seoMsg, setSeoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [blockSearch, setBlockSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // BEYOND DESIGN directions (mirror of src/lib/beyond-design.ts keys)
  const designDirections = [
    { key: 'auto', name: 'Beyond Auto', desc: 'AI picks for your brand' },
    { key: 'editorial', name: 'Editorial', desc: 'Magazine serif elegance' },
    { key: 'luxe-dark', name: 'Luxe Dark', desc: 'Black + gold restraint' },
    { key: 'brutalist', name: 'Brutalist', desc: 'Raw mono confidence' },
    { key: 'soft-organic', name: 'Soft Organic', desc: 'Warm rounded wellness' },
    { key: 'glass-tech', name: 'Glass Tech', desc: 'Modern SaaS glass + glow' },
    { key: 'swiss', name: 'Swiss Grid', desc: 'Precise typographic grid' },
    { key: 'retro-print', name: 'Retro Print', desc: '70s print warmth' },
    { key: 'minimal-mono', name: 'Minimal Mono', desc: 'Quiet portfolio calm' },
  ]

  // Load project + pages
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: proj } = await supabase
        .from('projects').select('id, name, slug, settings').eq('id', projectId).single()
      if (proj) {
        setProject(proj)
        setTheme(normalizeTheme((proj.settings as Record<string, unknown> | null)?.theme))
        const savedSeo = (proj.settings as Record<string, unknown> | null)?.seo
        if (savedSeo && typeof savedSeo === 'object') setSeoDraft(savedSeo as SeoMap)
      }

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
    // The init is async: if this effect is torn down first (StrictMode, fast
    // page switch) the cleanup below finds no editor, so bail out here instead
    // of mounting a second GrapesJS into the same panels.
    let cancelled = false

    async function initEditor() {
      const grapesjs = (await import('grapesjs')).default
      const blocksBasic = (await import('grapesjs-blocks-basic')).default
      const presetWebpage = (await import('grapesjs-preset-webpage')).default
      const pluginForms = (await import('grapesjs-plugin-forms')).default
      const customCode = (await import('grapesjs-custom-code')).default
      const tabs = (await import('grapesjs-tabs')).default
      const navbar = (await import('grapesjs-navbar')).default
      if (cancelled || !containerRef.current) return

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
        assetManager: {
          // Uploads go to Supabase storage under {userId}/{projectId}/.
          assets: [],
          upload: false,
          autoAdd: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          uploadFile: async (ev: any) => {
            const files: FileList = ev.dataTransfer ? ev.dataTransfer.files : ev.target.files
            const urls = await uploadAssets(Array.from(files), projectId)
            urls.forEach(u => editorRef.current?.AssetManager.add(u))
          },
        },
      })

      // Add custom blocks
      addCustomBlocks(editor)

      // Load previously uploaded assets into the asset manager
      try {
        const sb = createClient()
        const { data: assets } = await sb
          .from('assets').select('url').eq('project_id', projectId)
          .eq('type', 'image').order('created_at', { ascending: false })
        assets?.forEach((a: { url: string }) => editor.AssetManager.add(a.url))
      } catch { /* non-fatal */ }

      // Load saved content
      if (page!.gjs_data && Object.keys(page!.gjs_data).length > 0) {
        editor.loadProjectData(page!.gjs_data as Record<string, unknown>)
      } else if (page!.html) {
        editor.setComponents(page!.html)
        if (page!.css) editor.setStyle(page!.css)
      }

      // Track changes against a snapshot. GrapesJS's own dirty count can't be
      // used: it bumps while booting and resets itself after every change.
      const snapshot = () => `${editor.getHtml()}\u0000${editor.getCss()}`
      savedSnapshotRef.current = null
      editor.onReady(() => { savedSnapshotRef.current = snapshot() })
      editor.on('change:changesCount', () => {
        if (savedSnapshotRef.current !== null) setHasChanges(snapshot() !== savedSnapshotRef.current)
      })

      // Dark theme overrides
      applyDarkTheme()

      editorRef.current = editor
      setEditorReady(true)
    }

    initEditor()

    return () => {
      cancelled = true
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

  // Autosave — every 30s while there are unsaved changes.
  useEffect(() => {
    if (!hasChanges) return
    const t = setTimeout(() => { handleSaveRef.current?.() }, 30_000)
    return () => clearTimeout(t)
  }, [hasChanges])

  // Cmd/Ctrl+S saves instead of triggering the browser dialog.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSaveRef.current?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Save
  const handleSave = useCallback(async () => {
    if (!editorRef.current || !activePage) return
    setSaving(true)

    const editor = editorRef.current
    const html = editor.getHtml()
    const css = editor.getCss()
    const gjsData = editor.getProjectData()

    const supabase = createClient()
    const { error } = await supabase.from('pages').update({
      html, css, gjs_data: gjsData, updated_at: new Date().toISOString(),
    }).eq('id', activePage)
    if (error) {
      setSaving(false)
      alert(`Save failed: ${error.message}. Your changes are still in the editor — try again.`)
      return
    }

    savedSnapshotRef.current = `${html}\u0000${css}`
    setSaving(false)
    setSaved(true)
    setHasChanges(false)
    setTimeout(() => setSaved(false), 2000)
  }, [activePage])

  // Stable ref so autosave/shortcut effects don't re-register per keystroke.
  const handleSaveRef = useRef(handleSave)
  useEffect(() => { handleSaveRef.current = handleSave }, [handleSave])

  // ─── Theme ────────────────────────────────────────────────
  // Live-inject the theme into the canvas so changes preview instantly.
  useEffect(() => {
    if (!editorReady || !editorRef.current) return
    try {
      const doc: Document = editorRef.current.Canvas.getDocument()
      if (!doc) return
      let link = doc.getElementById('bam-theme-fonts') as HTMLLinkElement | null
      if (!link) {
        link = doc.createElement('link')
        link.id = 'bam-theme-fonts'
        link.rel = 'stylesheet'
        doc.head.appendChild(link)
      }
      link.href = themeFontUrl(theme)

      let style = doc.getElementById('bam-theme') as HTMLStyleElement | null
      if (!style) {
        style = doc.createElement('style')
        style.id = 'bam-theme'
        doc.head.appendChild(style)
      }
      style.textContent = themeCss(theme)
    } catch { /* canvas not ready */ }
  }, [theme, editorReady])

  // ─── One-click AI SEO ─────────────────────────────────────
  async function generateSeo() {
    if (seoBusy) return
    if (hasChanges) await handleSaveRef.current?.()
    setSeoBusy('generate'); setSeoMsg(null)
    try {
      const res = await fetch('/api/ai/seo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 402 || data.upgrade) {
        window.dispatchEvent(new CustomEvent('bam:show-upgrade', { detail: { reason: 'credits', needed: data.needed } }))
        throw new Error(`AI SEO needs ${CREDIT_COSTS.seo_all_pages} credits.`)
      }
      if (!res.ok || data.error) throw new Error(data.error || `SEO failed (${res.status})`)
      if (data.credits) window.dispatchEvent(new CustomEvent('bam:credits-updated', { detail: data.credits }))
      setSeoDraft(data.seo)
      setProject(p => p ? { ...p, settings: { ...(p.settings ?? {}), seo: data.seo } } : p)
      setSeoMsg({ type: 'ok', text: `Wrote SEO for ${data.generated} page${data.generated === 1 ? '' : 's'}. Review and edit below.` })
    } catch (e) {
      setSeoMsg({ type: 'err', text: e instanceof Error ? e.message : 'SEO failed' })
    } finally {
      setSeoBusy('')
    }
  }

  async function saveSeo() {
    setSeoBusy('save'); setSeoMsg(null)
    const supabase = createClient()
    // Re-read settings so we never clobber a theme saved in another tab.
    const { data: fresh } = await supabase.from('projects').select('settings').eq('id', projectId).single()
    const settings = { ...((fresh?.settings as Record<string, unknown>) ?? project?.settings ?? {}), seo: seoDraft }
    const { error } = await supabase.from('projects').update({ settings, updated_at: new Date().toISOString() }).eq('id', projectId)
    setSeoBusy('')
    if (error) { setSeoMsg({ type: 'err', text: error.message }); return }
    setProject(p => p ? { ...p, settings } : p)
    setSeoMsg({ type: 'ok', text: 'SEO saved. It goes live the next time visitors load your published site.' })
  }

  function editSeo(slug: string, field: 'title' | 'description', value: string) {
    setSeoDraft(d => ({ ...d, [slug]: { title: d[slug]?.title ?? '', description: d[slug]?.description ?? '', [field]: value } }))
  }

  async function saveTheme(next: SiteTheme) {
    setTheme(next)
    const supabase = createClient()
    const settings = { ...(project?.settings ?? {}), theme: next }
    await supabase.from('projects').update({ settings, updated_at: new Date().toISOString() }).eq('id', projectId)
    setProject(p => p ? { ...p, settings } : p)
  }

  // ─── Assets ───────────────────────────────────────────────
  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const urls = await uploadAssets(files, projectId)
      urls.forEach(u => editorRef.current?.AssetManager.add(u))
      if (urls.length) editorRef.current?.runCommand('open-assets')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ─── Polish this page ─────────────────────────────────────
  async function handlePolish() {
    if (!editorRef.current || aiLoading) return
    const currentHtml = editorRef.current.getHtml()
    if (!currentHtml || currentHtml.length < 40) {
      alert('Add some content to the page first.')
      return
    }
    setShowAI(true)
    setAiLoading(true)
    setAiMessages(prev => [...prev, { role: 'user', text: '✨ Polish this page' }])
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim(), mode: 'polish', selectedHtml: currentHtml, style: aiStyle }),
      })
      const data = await res.json()
      if (res.status === 402 || data.upgrade) {
        setAiMessages(prev => [...prev, { role: 'ai', text: "🔒 You're out of credits. Upgrade to keep building — your work is saved.", type: 'error' }])
        window.dispatchEvent(new CustomEvent('bam:show-upgrade', { detail: { reason: 'credits', needed: data.needed } }))
        return
      }
      if (data.error) throw new Error(data.error)
      if (data.credits) window.dispatchEvent(new CustomEvent('bam:credits-updated', { detail: data.credits }))
      editorRef.current.setComponents(data.html)
      setAiMessages(prev => [...prev, { role: 'ai', text: 'Page polished — content kept, design elevated.', type: 'success' }])
      setAiPrompt('')
      setHasChanges(true)
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'ai', text: err instanceof Error ? err.message : 'Polish failed', type: 'error' }])
    } finally {
      setAiLoading(false)
    }
  }

  // ─── Block search ─────────────────────────────────────────
  // GrapesJS renders blocks into #blocks-panel; filter the rendered nodes by label.
  useEffect(() => {
    if (!editorReady) return
    const panel = document.getElementById('blocks-panel')
    if (!panel) return
    const q = blockSearch.trim().toLowerCase()
    panel.querySelectorAll<HTMLElement>('.gjs-block').forEach(el => {
      const label = (el.textContent ?? '').toLowerCase()
      el.style.display = !q || label.includes(q) ? '' : 'none'
    })
    // Hide category headers that have no visible blocks left.
    panel.querySelectorAll<HTMLElement>('.gjs-block-category').forEach(cat => {
      const anyVisible = Array.from(cat.querySelectorAll<HTMLElement>('.gjs-block'))
        .some(b => b.style.display !== 'none')
      cat.style.display = anyVisible ? '' : 'none'
    })
  }, [blockSearch, editorReady])

  // ─── Page reorder ─────────────────────────────────────────
  async function movePage(pageId: string, dir: -1 | 1) {
    const idx = pages.findIndex(p => p.id === pageId)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= pages.length) return
    const reordered = [...pages]
    const [moved] = reordered.splice(idx, 1)
    reordered.splice(target, 0, moved)
    setPages(reordered)
    const supabase = createClient()
    await Promise.all(reordered.map((p, i) =>
      supabase.from('pages').update({ sort_order: i }).eq('id', p.id),
    ))
  }

  // Publish
  async function handlePublish() {
    // Save first
    await handleSave()
    setPublishing(true)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPublishedUrl(data.url)
      setTimeout(() => setPublishedUrl(null), 8000)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

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

  // AI generation
  // Copywriting rewrite: keep markup identical, change only the words, add no facts.
  function copyPrompt(instruction: string): string {
    return `Rewrite only the visible text of this element: ${instruction}.
Keep every tag, class, attribute, link, and the HTML structure exactly the same. Do not change styles.
Do not add facts, prices, names, numbers, or claims that are not already in the text.`
  }

  async function handleAiGenerate(override?: { instruction: string; label: string }) {
    const isCopy = aiMode === 'copy' || !!override
    const raw = override ? override.instruction : aiPrompt.trim()
    if (!raw || aiLoading || !editorRef.current) return

    // Edit and Copy work on the selected element. Check before spending credits.
    const needsSelection = aiMode === 'edit' || isCopy
    const selected = needsSelection ? editorRef.current.getSelected() : null
    if (needsSelection && !selected) {
      setAiMessages(prev => [...prev, { role: 'ai', text: 'Select an element on the canvas first. Nothing was charged.', type: 'error' }])
      return
    }

    setAiLoading(true)
    const userMsg = override ? override.label : raw
    setAiMessages(prev => [...prev, { role: 'user', text: isCopy ? `✍️ ${userMsg}` : userMsg }])
    if (!override) setAiPrompt('')

    const selectedHtml = selected ? selected.toHTML() : ''
    const apiMode = isCopy ? 'edit' : aiMode
    const prompt = isCopy ? copyPrompt(raw) : raw

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode: apiMode, selectedHtml, style: aiStyle }),
      })

      const data = await res.json()

      // Handle 402 (insufficient credits) — show upgrade flow
      if (res.status === 402 || data.upgrade) {
        setAiMessages(prev => [...prev, {
          role: 'ai',
          text: `🔒 You're out of credits. Upgrade to keep building — your work is saved.`,
          type: 'error',
        }])
        // Trigger global upgrade event (caught by UpgradeModal listeners)
        window.dispatchEvent(new CustomEvent('bam:show-upgrade', { detail: { reason: 'credits', needed: data.needed } }))
        return
      }

      if (data.error) throw new Error(data.error)

      // Update credits indicator in header
      if (data.credits) {
        window.dispatchEvent(new CustomEvent('bam:credits-updated', { detail: data.credits }))
      }

      if (selected) {
        // Edit / Copy: replace the element that was selected when the request started.
        // Checked first so an element-level result can never overwrite the whole page.
        selected.replaceWith(data.html)
        setAiMessages(prev => [...prev, { role: 'ai', text: isCopy ? 'Copy rewritten. Cmd+Z to undo.' : 'Element updated.', type: 'success' }])
      } else if (aiMode === 'page') {
        // Replace entire canvas
        editorRef.current.setComponents(data.html)
        setAiMessages(prev => [...prev, { role: 'ai', text: 'Page generated and loaded into the canvas.', type: 'success' }])
      } else if (aiMode === 'section') {
        // Append section to canvas
        editorRef.current.addComponents(data.html)
        setAiMessages(prev => [...prev, { role: 'ai', text: 'Section added to your page.', type: 'success' }])
      }

      setHasChanges(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setAiMessages(prev => [...prev, { role: 'ai', text: msg, type: 'error' }])
    } finally {
      setAiLoading(false)
      setTimeout(() => aiScrollRef.current?.scrollTo({ top: aiScrollRef.current.scrollHeight, behavior: 'smooth' }), 100)
    }
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

  async function switchPage(pageId: string) {
    if (editorRef.current) {
      // Save current page state first
      const editor = editorRef.current
      const currentPage = pages.find(p => p.id === activePage)
      if (currentPage) {
        const gjsData = editor.getProjectData()
        const html = editor.getHtml()
        const css = editor.getCss()
        setPages(prev => prev.map(p => p.id === activePage ? { ...p, html: html ?? '', css: css ?? '', gjs_data: gjsData } : p))
        // Save only writes the active page, so persist edits before leaving it.
        if (hasChanges) {
          const { error } = await createClient().from('pages').update({
            html, css, gjs_data: gjsData, updated_at: new Date().toISOString(),
          }).eq('id', currentPage.id)
          if (error) {
            alert(`Couldn't save "${currentPage.title}": ${error.message}. Staying on this page — try Save again.`)
            return
          }
          setHasChanges(false)
        }
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

  const [leftTab, setLeftTab] = useState<'blocks' | 'layers'>('blocks')
  const [rightTab, setRightTab] = useState<'styles' | 'traits'>('styles')

  if (!project) {
    return (
      <div className="fixed inset-0 bg-[#0b0d14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1f8fff]/25 border-t-[#4aa8ff] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0b0d14] flex flex-col" style={{ zIndex: 9999 }}>
      {/* ─── Top Bar ──────────────────── */}
      <div className="h-[52px] border-b border-white/[0.07] flex items-center justify-between px-3 shrink-0 bg-[#0b0d14]/95 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button onClick={handleExit} aria-label="Back to dashboard" title="Back to dashboard" className={toolBtn(false)}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/[0.08]" />
          <div className="flex items-center gap-2 pl-1">
            <span className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-[#4aa8ff] via-[#1f8fff] to-[#7c5cff] flex items-center justify-center shrink-0">
              <span className="font-display text-[12px] font-extrabold text-white">B</span>
            </span>
            <span className="font-display text-[14px] font-semibold text-white truncate max-w-[180px]">{project.name}</span>
          </div>

          {/* Page switcher */}
          <div className="relative ml-1">
            <button onClick={() => setShowPages(!showPages)} aria-expanded={showPages} title={pages.find(p => p.id === activePage)?.title} className="flex items-center gap-1.5 h-8 max-w-[220px] pl-2.5 pr-2 bg-white/[0.04] border border-white/[0.08] rounded-full text-[12px] text-white/80 hover:text-white hover:border-white/[0.16] transition-colors">
              <FileText className="w-3.5 h-3.5 shrink-0 text-[#8ec5ff]" />
              <span className="truncate">{pages.find(p => p.id === activePage)?.title ?? 'Page'}</span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-white/50 transition-transform ${showPages ? 'rotate-180' : ''}`} />
            </button>
            {showPages && (
              <div className="absolute top-full left-0 mt-2 w-60 bam-glass bg-[#0b0d14]/95 border border-white/[0.1] rounded-2xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] p-1.5 z-50">
                {pages.map((p, pi) => (
                  <div key={p.id} className="flex items-center group">
                    <button
                      onClick={() => { switchPage(p.id); setShowPages(false) }}
                      className={`flex-1 min-w-0 truncate text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${p.id === activePage ? 'text-white bg-[#1f8fff]/15' : 'text-white/70 hover:text-white hover:bg-white/[0.05]'}`}
                    >
                      {p.title} {p.is_home && <span className="text-[11px] text-white/45 ml-1">(home)</span>}
                    </button>
                    <button
                      onClick={() => movePage(p.id, -1)} disabled={pi === 0} title="Move up"
                      className="p-1 opacity-0 group-hover:opacity-100 text-white/45 hover:text-[#8ec5ff] transition-all disabled:opacity-0"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => movePage(p.id, 1)} disabled={pi === pages.length - 1} title="Move down"
                      className="p-1 opacity-0 group-hover:opacity-100 text-white/45 hover:text-[#8ec5ff] transition-all disabled:opacity-0"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    {!p.is_home && (
                      <button onClick={() => deletePage(p.id)} title="Delete page" className="p-1 mr-1 opacity-0 group-hover:opacity-100 text-white/45 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="border-t border-white/[0.06] mt-1 pt-1">
                  {showNewPage ? (
                    <div className="px-2 py-1 flex gap-1">
                      <input value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)} placeholder="Page name" className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none" autoFocus onKeyDown={e => e.key === 'Enter' && createPage()} />
                      <button onClick={createPage} className="bam-pill px-3 py-1 text-[12px]">Add</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowNewPage(true)} className="w-full text-left px-3 py-1.5 text-xs text-white/55 hover:text-white/50 flex items-center gap-1.5">
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
          <button onClick={() => editorRef.current?.UndoManager.undo()} aria-label="Undo" title="Undo" className={toolBtn(false)}>
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={() => editorRef.current?.UndoManager.redo()} aria-label="Redo" title="Redo" className={toolBtn(false)}>
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/[0.08] mx-1.5" />

          {/* Devices */}
          <div className="flex items-center p-0.5 rounded-[10px] bg-white/[0.04] border border-white/[0.07]">
            {([
              { mode: 'desktop' as const, icon: Monitor },
              { mode: 'tablet' as const, icon: Tablet },
              { mode: 'mobile' as const, icon: Smartphone },
            ]).map(({ mode, icon: Icon }) => (
              <button
                key={mode} onClick={() => setDevice(mode)} aria-label={`${mode} view`} aria-pressed={device === mode} title={`${mode[0].toUpperCase()}${mode.slice(1)} view`}
                className={`w-8 h-7 flex items-center justify-center rounded-lg transition-colors ${device === mode ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-white/55 hover:text-white'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-white/[0.08] mx-1.5" />

          {/* SEO */}
          <button onClick={() => { setShowSeo(!showSeo); setShowTheme(false) }} title="SEO for every page" aria-label="SEO" aria-pressed={showSeo} className={toolBtn(showSeo)}>
            <Search className="w-4 h-4" />
          </button>

          {/* Theme */}
          <button onClick={() => { setShowTheme(!showTheme); setShowSeo(false) }} title="Site theme" aria-label="Site theme" aria-pressed={showTheme} className={toolBtn(showTheme)}>
            <Palette className="w-4 h-4" />
          </button>

          {/* Upload image */}
          <button onClick={() => fileInputRef.current?.click()} title="Upload images" aria-label="Upload images" disabled={uploading} className={`${toolBtn(false)} disabled:opacity-50`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilePick} className="hidden" />

          {/* Polish */}
          <button onClick={handlePolish} title="Polish this page with BEYOND DESIGN" aria-label="Polish page" disabled={aiLoading} className={`${toolBtn(false)} disabled:opacity-50`}>
            <Wand2 className="w-4 h-4" />
          </button>

          {/* Code view */}
          <button onClick={toggleCodeView} title="Edit code" aria-label="Edit code" aria-pressed={showCode} className={toolBtn(showCode)}>
            <Code2 className="w-4 h-4" />
          </button>

          {/* AI */}
          <button onClick={() => setShowAI(!showAI)} title="AI assistant" aria-pressed={showAI} className={`h-8 px-2.5 rounded-lg transition-colors flex items-center gap-1.5 ${showAI ? 'bg-gradient-to-r from-[#1f8fff]/25 to-[#8b5cf6]/25 text-white ring-1 ring-inset ring-[#4aa8ff]/40' : 'text-white/70 hover:text-white hover:bg-white/[0.06]'}`}>
            <Sparkles className="w-4 h-4" />
            <span className="text-[12px] font-semibold">AI</span>
          </button>

          {/* Preview */}
          <button onClick={() => editorRef.current?.runCommand('preview')} title="Preview" aria-label="Preview" className={toolBtn(false)}>
            <Eye className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-white/[0.08] mx-1.5" />

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`bam-pill-ghost h-8 px-3.5 text-[12px] disabled:opacity-60 ${saved ? '!text-emerald-300 !border-emerald-400/30' : hasChanges ? '' : 'text-white/70'}`}
          >
            {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> :
             saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> :
             <><Save className="w-3.5 h-3.5" /> Save</>}
            {hasChanges && !saving && !saved && <span aria-label="Unsaved changes" className="w-1.5 h-1.5 bg-amber-300 rounded-full" />}
          </button>

          {/* Publish */}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="bam-pill h-8 px-4 ml-1 text-[12px] disabled:opacity-60"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Published URL toast */}
      {publishedUrl && (
        <div role="status" className="absolute top-[64px] left-1/2 -translate-x-1/2 z-50 bg-[#0b0d14]/95 border border-emerald-400/25 rounded-2xl px-6 py-4 flex flex-col items-center gap-2 backdrop-blur-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300 font-medium">Site published!</span>
          </div>
          <p className="text-[11px] text-white/60">Your site is live at:</p>
          <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8ec5ff] hover:text-[#8ec5ff] font-mono bg-[#05060a] px-3 py-1.5 rounded-lg border border-white/[0.07]">
            beyondamedium.io{publishedUrl}
          </a>
        </div>
      )}

      {/* ─── Main Area ────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor Overlay */}
        {showCode && (
          <div className="absolute inset-0 z-50 bg-[#0b0d14]/95 backdrop-blur-sm flex flex-col" style={{ top: '52px' }}>
            <div className="flex-1 flex gap-0">
              <div className="flex-1 flex flex-col border-r border-white/[0.07]">
                <div className="px-4 py-2 border-b border-white/[0.07] text-[11px] text-white/60 font-mono">HTML</div>
                <textarea
                  value={codeHtml}
                  onChange={e => setCodeHtml(e.target.value)}
                  className="flex-1 p-4 bg-transparent text-white/80 font-mono text-xs resize-none focus:outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 border-b border-white/[0.07] text-[11px] text-white/60 font-mono">CSS</div>
                <textarea
                  value={codeCss}
                  onChange={e => setCodeCss(e.target.value)}
                  className="flex-1 p-4 bg-transparent text-white/80 font-mono text-xs resize-none focus:outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/[0.07]">
              <button onClick={() => setShowCode(false)} className="px-4 py-2 text-xs text-white/60 hover:text-white/60 transition-colors">Cancel</button>
              <button onClick={applyCodeChanges} className="bam-pill px-5 py-2 text-[12px]">
                Apply Changes
              </button>
            </div>
          </div>
        )}

        {/* Left Panel — Blocks */}
        <div className="w-[240px] border-r border-white/[0.07] bg-[#0b0d14] flex flex-col overflow-hidden shrink-0">
          <div className="p-2 border-b border-white/[0.07]">
            <div className="flex p-0.5 rounded-[10px] bg-white/[0.04] border border-white/[0.07]">
              <PanelTab label="Blocks" active={leftTab === 'blocks'} onClick={() => setLeftTab('blocks')} />
              <PanelTab label="Layers" active={leftTab === 'layers'} onClick={() => setLeftTab('layers')} />
            </div>
          </div>
          {/* Block search */}
          <div className={`px-2 py-2 border-b border-white/[0.07] ${leftTab === 'blocks' ? '' : 'hidden'}`}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/45 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={blockSearch}
                onChange={e => setBlockSearch(e.target.value)}
                placeholder="Search blocks"
                className="w-full pl-8 pr-7 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[12px] text-white/85 placeholder:text-white/45 focus:outline-none focus:border-[#4aa8ff]/50"
              />
              {blockSearch && (
                <button onClick={() => setBlockSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-white/50 hover:text-white/60">
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div id="blocks-panel" className={`flex-1 overflow-y-auto gjs-blocks-panel ${leftTab === 'blocks' ? '' : 'hidden'}`} />
          <div id="layers-panel" className={`flex-1 overflow-y-auto gjs-styles-panel ${leftTab === 'layers' ? '' : 'hidden'}`} />
        </div>

        {/* Center — Canvas */}
        <div className="flex-1 overflow-hidden bg-[#05060a] relative">
          {!editorReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-[#1f8fff]/25 border-t-[#4aa8ff] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[13px] text-white/60">Loading editor…</p>
              </div>
            </div>
          )}
          <div ref={containerRef} className="h-full" />
        </div>

        {/* SEO Panel */}
        {showSeo && (
          <div className="w-[320px] border-l border-white/[0.07] bg-[#0b0d14] flex flex-col overflow-y-auto shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] sticky top-0 bg-[#0b0d14] z-10">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#6db8ff]" />
                <span className="text-xs font-semibold text-white/80">SEO</span>
              </div>
              <button onClick={() => setShowSeo(false)} aria-label="Close SEO panel" className="p-1 text-white/60 hover:text-white/70 rounded">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3 border-b border-white/[0.07]">
              <p className="text-[12px] text-white/60 leading-relaxed">
                Search titles and descriptions for every page. Generate them with AI, then edit anything before saving.
              </p>
              <button
                onClick={generateSeo}
                disabled={!!seoBusy}
                className="bam-pill w-full py-2 text-[12px] disabled:opacity-50"
              >
                {seoBusy === 'generate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {seoBusy === 'generate' ? 'Writing SEO…' : `Generate for all pages · ${CREDIT_COSTS.seo_all_pages} credits`}
              </button>
              {seoMsg && (
                <p role="status" className={`text-[12px] leading-relaxed ${seoMsg.type === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}>{seoMsg.text}</p>
              )}
            </div>

            <div className="p-4 space-y-5 flex-1">
              {pages.map(p => {
                const entry = seoDraft[p.slug] ?? { title: '', description: '' }
                return (
                  <div key={p.id} className="space-y-2">
                    <p className="text-[12px] font-semibold text-white/80">{p.title}{p.is_home && <span className="text-white/45 font-normal"> · home</span>}</p>
                    <label className="block">
                      <span className="flex justify-between text-[11px] text-white/50"><span>Title</span><span className={entry.title.length > SEO_TITLE_MAX ? 'text-amber-300' : ''}>{entry.title.length}/{SEO_TITLE_MAX}</span></span>
                      <input
                        value={entry.title}
                        onChange={e => editSeo(p.slug, 'title', e.target.value)}
                        placeholder={p.title}
                        className="w-full mt-1 px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[12px] text-white/85 placeholder:text-white/55 focus:outline-none focus:border-[#4aa8ff]/50"
                      />
                    </label>
                    <label className="block">
                      <span className="flex justify-between text-[11px] text-white/50"><span>Description</span><span className={entry.description.length > SEO_DESC_MAX ? 'text-amber-300' : ''}>{entry.description.length}/{SEO_DESC_MAX}</span></span>
                      <textarea
                        value={entry.description}
                        onChange={e => editSeo(p.slug, 'description', e.target.value)}
                        rows={3}
                        className="w-full mt-1 px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[12px] text-white/85 resize-y focus:outline-none focus:border-[#4aa8ff]/50"
                      />
                    </label>
                    {entry.title && (
                      <div className="rounded-lg bg-white px-2.5 py-2">
                        <p className="text-[11px] text-[#1a0dab] leading-tight truncate">{entry.title}</p>
                        <p className="text-[11px] text-[#4d5156] leading-snug line-clamp-2">{entry.description}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-4 border-t border-white/[0.07] sticky bottom-0 bg-[#0b0d14]">
              <button onClick={saveSeo} disabled={!!seoBusy} className="bam-pill-ghost w-full py-2 text-[12px] disabled:opacity-50">
                {seoBusy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save SEO
              </button>
            </div>
          </div>
        )}

        {/* Theme Panel */}
        {showTheme && (
          <div className="w-[280px] border-l border-white/[0.07] bg-[#0b0d14] flex flex-col overflow-y-auto shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] sticky top-0 bg-[#0b0d14] z-10">
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-[#8ec5ff]" />
                <span className="text-xs font-semibold text-white/70">Site Theme</span>
              </div>
              <button onClick={() => setShowTheme(false)} className="p-1 text-white/55 hover:text-white/60 rounded">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="px-4 pt-3 text-[11px] text-white/55 leading-relaxed">
              Applies to every page of this site — in the editor and when published.
            </p>

            {/* Presets */}
            <div className="p-3">
              <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-2">Presets</p>
              <div className="grid grid-cols-2 gap-1.5">
                {THEME_PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => saveTheme(p.theme)}
                    className="p-2 rounded-lg border border-white/[0.07] hover:border-white/[0.14] transition-colors text-left"
                  >
                    <div className="flex gap-1 mb-1.5">
                      {[p.theme.colorBg, p.theme.colorPrimary, p.theme.colorText].map((c, i) => (
                        <span key={i} className="w-3 h-3 rounded-full border border-white/10" style={{ background: c }} />
                      ))}
                    </div>
                    <span className="text-[11px] text-white/50">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div className="px-3 pb-3 space-y-2">
              <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Typography</p>
              {([['fontHeading', 'Headings'], ['fontBody', 'Body']] as const).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-[11px] text-white/55">{label}</span>
                  <select
                    value={theme[key]}
                    onChange={e => saveTheme({ ...theme, [key]: e.target.value })}
                    className="w-full mt-1 px-2 py-1.5 bg-white/[0.03] border border-white/[0.07] rounded-lg text-[11px] text-white/70 focus:outline-none focus:border-[#4aa8ff]/30"
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f} className="bg-[#12151f]">{f}</option>)}
                  </select>
                </label>
              ))}
            </div>

            {/* Colors */}
            <div className="px-3 pb-3 space-y-2">
              <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Colors</p>
              {([
                ['colorPrimary', 'Primary'], ['colorBg', 'Background'], ['colorSurface', 'Surface'],
                ['colorText', 'Text'], ['colorMuted', 'Muted'],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-white/55">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={e => setTheme({ ...theme, [key]: e.target.value })}
                      onBlur={e => saveTheme({ ...theme, [key]: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/10"
                    />
                    <span className="text-[11px] font-mono text-white/55 w-14">{theme[key]}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Shape */}
            <div className="px-3 pb-6 space-y-3">
              <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Shape</p>
              <label className="block">
                <span className="text-[11px] text-white/55">Corner radius — {theme.radius}px</span>
                <input
                  type="range" min={0} max={40} value={theme.radius}
                  onChange={e => setTheme({ ...theme, radius: Number(e.target.value) })}
                  onMouseUp={e => saveTheme({ ...theme, radius: Number((e.target as HTMLInputElement).value) })}
                  className="w-full mt-1 accent-[#1f8fff]"
                />
              </label>
              <label className="block">
                <span className="text-[11px] text-white/55">Content width — {theme.maxWidth}px</span>
                <input
                  type="range" min={800} max={1440} step={20} value={theme.maxWidth}
                  onChange={e => setTheme({ ...theme, maxWidth: Number(e.target.value) })}
                  onMouseUp={e => saveTheme({ ...theme, maxWidth: Number((e.target as HTMLInputElement).value) })}
                  className="w-full mt-1 accent-[#1f8fff]"
                />
              </label>
              <p className="text-[11px] text-white/50 leading-relaxed pt-1">
                Use <code className="text-[#8ec5ff]/60">var(--bam-primary)</code>, <code className="text-[#8ec5ff]/60">.bam-btn</code>,
                {' '}<code className="text-[#8ec5ff]/60">.bam-card</code> in your HTML to follow the theme automatically.
              </p>
            </div>
          </div>
        )}

        {/* Right Panel — Styles + Traits. Steps aside for the AI/SEO/Theme panel
            below 2xl so the canvas isn't squeezed on laptop screens. */}
        <div className={`w-[260px] border-l border-white/[0.07] bg-[#0b0d14] flex-col overflow-hidden shrink-0 ${showAI || showSeo || showTheme ? 'hidden 2xl:flex' : 'flex'}`}>
          <div className="p-2 border-b border-white/[0.07]">
            <div className="flex p-0.5 rounded-[10px] bg-white/[0.04] border border-white/[0.07]">
              <PanelTab label="Style" active={rightTab === 'styles'} onClick={() => setRightTab('styles')} />
              <PanelTab label="Settings" active={rightTab === 'traits'} onClick={() => setRightTab('traits')} />
            </div>
          </div>
          <div id="selectors-panel" className={`border-b border-white/[0.07] ${rightTab === 'styles' ? '' : 'hidden'}`} />
          <div id="styles-panel" className={`flex-1 overflow-y-auto gjs-styles-panel ${rightTab === 'styles' ? '' : 'hidden'}`} />
          <div id="traits-panel" className={`flex-1 overflow-y-auto gjs-styles-panel ${rightTab === 'traits' ? '' : 'hidden'}`} />
        </div>

        {/* AI Sidebar */}
        {showAI && (
          <div className="w-[320px] border-l border-white/[0.07] bg-[#0b0d14] flex flex-col overflow-hidden shrink-0">
            {/* AI Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-[#4aa8ff] via-[#1f8fff] to-[#7c5cff] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="font-display text-[14px] font-semibold text-white">AI Assistant</span>
              </div>
              <button onClick={() => setShowAI(false)} className="p-1 text-white/55 hover:text-white/60 rounded transition-colors">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-1 p-2 border-b border-white/[0.06]">
              {([
                { mode: 'page' as const, label: 'Full Page', icon: FileText },
                { mode: 'section' as const, label: 'Section', icon: Plus },
                { mode: 'edit' as const, label: 'Edit', icon: Wand2 },
                { mode: 'copy' as const, label: 'Copy', icon: PenLine },
              ]).map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setAiMode(mode)}
                  aria-pressed={aiMode === mode}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    aiMode === mode ? 'bg-[#1f8fff]/15 text-[#8ec5ff]' : 'text-white/55 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* BEYOND DESIGN — style direction picker */}
            <div className="border-b border-white/[0.06]">
              <button
                onClick={() => setShowStyles(!showStyles)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold tracking-[0.14em] bam-grad-text">BEYOND DESIGN</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] text-white/50">{designDirections.find(d => d.key === aiStyle)?.name}</span>
                  <ChevronDown className={`w-3 h-3 text-white/55 transition-transform ${showStyles ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {showStyles && (
                <div className="grid grid-cols-3 gap-1.5 px-2 pb-2">
                  {designDirections.map(d => (
                    <button
                      key={d.key}
                      onClick={() => { setAiStyle(d.key); setShowStyles(false) }}
                      title={d.desc}
                      className={`px-1.5 py-2 rounded-lg border text-center transition-all ${
                        aiStyle === d.key
                          ? 'border-[#4aa8ff]/60 bg-[#1f8fff]/[0.12] text-white'
                          : 'border-white/[0.08] text-white/70 hover:text-white hover:border-white/[0.18]'
                      }`}
                    >
                      <span className="block text-[11px] font-semibold leading-tight">{d.name}</span>
                      <span className="block text-[10px] text-white/50 leading-tight mt-0.5">{d.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Messages */}
            <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiMessages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-[#4aa8ff]/60 mx-auto mb-3" />
                  <p className="font-display text-[15px] font-semibold text-white/85 mb-4">Tell me what to build</p>
                  <div className="space-y-2">
                    {[
                      'Create a landing page for a coffee shop',
                      'Add a pricing section with 3 tiers',
                      'Make the header background darker',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => { setAiPrompt(suggestion); setAiMode(suggestion.startsWith('Add') ? 'section' : suggestion.startsWith('Make') ? 'edit' : 'page') }}
                        className="w-full text-left px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[12px] text-white/70 hover:text-white hover:border-[#4aa8ff]/40 hover:bg-[#1f8fff]/[0.06] transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1f8fff]/15 text-[#e3f0ff]'
                      : msg.type === 'error'
                      ? 'bg-red-500/10 text-red-300'
                      : 'bg-white/[0.05] text-white/80'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] px-3 py-2 rounded-xl flex items-center gap-2">
                    <Loader2 className="w-3 h-3 text-[#8ec5ff] animate-spin" />
                    <span className="text-xs text-white/60">
                      {aiMode === 'page' ? 'Generating page...' : aiMode === 'section' ? 'Creating section...' : aiMode === 'copy' ? 'Rewriting copy...' : 'Editing element...'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* AI copywriting quick actions */}
            {aiMode === 'copy' && (
              <div className="px-3 pt-3 border-t border-white/[0.07]">
                <p className="text-[11px] text-white/55 mb-2">Select text on the canvas, then pick a rewrite · {CREDIT_COSTS.edit_element} credits</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ['Shorter', 'make it shorter and tighter, keeping the meaning'],
                    ['Longer', 'expand it with more helpful detail, without inventing facts'],
                    ['Persuasive', 'make it more persuasive and benefit-led'],
                    ['Professional', 'make the tone more professional and polished'],
                    ['Friendlier', 'make the tone warmer and friendlier'],
                    ['Fix grammar', 'fix spelling, grammar, and punctuation only'],
                  ] as const).map(([label, instruction]) => (
                    <button
                      key={label}
                      onClick={() => handleAiGenerate({ instruction, label })}
                      disabled={aiLoading}
                      className="px-2.5 py-1.5 rounded-full border border-white/[0.1] text-[11px] text-white/75 hover:border-[#4aa8ff]/60 hover:text-white hover:bg-[#1f8fff]/10 transition-colors disabled:opacity-40"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/[0.07]">
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden focus-within:border-[#4aa8ff]/30 transition-colors">
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiGenerate() } }}
                    placeholder={
                      aiMode === 'page' ? 'Describe the full page you want...' :
                      aiMode === 'section' ? 'Describe a section to add...' :
                      aiMode === 'copy' ? 'Or describe how to rewrite it...' :
                      'Describe the change to make...'
                    }
                    rows={2}
                    className="w-full px-3 py-2.5 bg-transparent text-[13px] text-white/90 placeholder:text-white/45 focus:outline-none resize-none"
                  />
                </div>
                <button
                  onClick={() => handleAiGenerate()}
                  disabled={aiLoading || !aiPrompt.trim()}
                  aria-label="Send"
                  className="bam-pill w-10 h-10 shrink-0 disabled:opacity-40"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-white/45 mt-1.5 text-center">
                {aiMode === 'page' ? 'Replaces this page' : aiMode === 'section' ? 'Adds to this page' : aiMode === 'copy' ? 'Rewrites the selected text' : 'Edits the selected element'} &middot; Enter to send
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dark theme styles */}
      <style jsx global>{`
        /* GrapesJS → BAM theme */
        .gjs-one-bg { background-color: #0b0d14 !important; }
        .gjs-two-color { color: rgba(255,255,255,0.72) !important; }
        .gjs-three-bg { background-color: #12151f !important; }
        .gjs-four-color, .gjs-four-color-h:hover { color: #8ec5ff !important; }
        .gjs-editor, .gjs-cv-canvas { font-family: var(--font-geist-sans), system-ui, sans-serif; }

        .gjs-block {
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 12px !important;
          color: rgba(255,255,255,0.72) !important;
          padding: 10px 6px !important;
          margin: 4px !important;
          min-height: auto !important;
          box-shadow: none !important;
          transition: border-color 0.15s, background 0.15s, transform 0.15s !important;
        }
        .gjs-block:hover {
          border-color: rgba(74,168,255,0.5) !important;
          background: rgba(31,143,255,0.08) !important;
          color: #fff !important;
          transform: translateY(-1px);
        }
        .gjs-block svg { fill: rgba(255,255,255,0.6) !important; }
        .gjs-block:hover svg { fill: #8ec5ff !important; }
        .gjs-block__media { margin-bottom: 6px !important; }
        .gjs-block-label { font-size: 11px !important; font-weight: 500 !important; }

        .gjs-category-title, .gjs-layer-title, .gjs-sm-sector-title {
          background: transparent !important;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          color: rgba(255,255,255,0.62) !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
          padding: 11px 12px !important;
        }
        .gjs-category-title:hover, .gjs-sm-sector-title:hover { color: #fff !important; }
        .gjs-sm-sector.gjs-sm-open > .gjs-sm-sector-title, .gjs-block-category.gjs-open > .gjs-category-title { color: #8ec5ff !important; }

        .gjs-field {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.09) !important;
          border-radius: 8px !important;
          color: rgba(255,255,255,0.85) !important;
        }
        .gjs-field:focus-within { border-color: rgba(74,168,255,0.6) !important; box-shadow: 0 0 0 3px rgba(31,143,255,0.15); }
        .gjs-field input, .gjs-field select, .gjs-field textarea { color: rgba(255,255,255,0.88) !important; }
        .gjs-field select option { background: #12151f; }
        .gjs-input-unit, .gjs-field-units select { color: rgba(255,255,255,0.6) !important; }

        .gjs-sm-property { padding: 5px 10px !important; }
        .gjs-sm-label, .gjs-trt-trait .gjs-label { color: rgba(255,255,255,0.68) !important; font-size: 11px !important; }
        .gjs-sm-clear { color: #8ec5ff !important; }
        .gjs-radio-item input:checked + .gjs-radio-item-label { background: rgba(31,143,255,0.2) !important; color: #fff !important; }

        .gjs-layer { background: transparent !important; color: rgba(255,255,255,0.72) !important; }
        .gjs-layer:hover { background: rgba(255,255,255,0.04) !important; }
        .gjs-layer.gjs-selected { background: rgba(31,143,255,0.14) !important; color: #fff !important; }

        .gjs-pn-panel { background: #0b0d14 !important; }
        .gjs-pn-btn { color: rgba(255,255,255,0.6) !important; }
        .gjs-pn-btn:hover { color: #fff !important; }
        .gjs-pn-btn.gjs-pn-active { color: #8ec5ff !important; }

        /* Stage: dotted ground, the page floats as a card */
        .gjs-cv-canvas {
          background-color: #05060a !important;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px) !important;
          background-size: 22px 22px !important;
        }
        .gjs-frame-wrapper {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.07), 0 40px 90px -30px rgba(0,0,0,0.9), 0 0 120px -40px rgba(31,143,255,0.25);
        }

        .gjs-toolbar { background: #1268da !important; border: 0 !important; border-radius: 8px !important; box-shadow: 0 8px 24px -8px rgba(31,143,255,0.6) !important; }
        .gjs-toolbar-item { color: #fff !important; }
        .gjs-badge { background: #1268da !important; border-radius: 6px !important; font-family: var(--font-geist-sans), system-ui, sans-serif !important; font-size: 11px !important; padding: 2px 7px !important; }
        .gjs-highlighter, .gjs-hovered { outline: 1px solid #4aa8ff !important; outline-offset: -1px !important; }
        .gjs-placeholder { border-color: #1f8fff !important; }
        .gjs-placeholder-int { background-color: #1f8fff !important; }
        .gjs-resizer-h { border-color: #1f8fff !important; background: #fff !important; }

        .gjs-clm-tags { padding: 8px 10px !important; }
        /* GrapesJS renders the selector manager into #selectors-panel twice; show one */
        #selectors-panel > .gjs-clm-tags ~ .gjs-clm-tags { display: none !important; }
        .gjs-clm-tag { background: rgba(31,143,255,0.16) !important; color: #cfe6ff !important; border-radius: 999px !important; padding: 3px 9px !important; }
        .gjs-clm-label, .gjs-clm-sels-info { color: rgba(255,255,255,0.6) !important; font-size: 11px !important; }

        .gjs-mdl-container { background: rgba(5,6,10,0.7) !important; backdrop-filter: blur(6px); }
        .gjs-mdl-dialog { background: #0b0d14 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 16px !important; box-shadow: 0 40px 100px -30px rgba(0,0,0,0.9) !important; }
        .gjs-mdl-header { border-bottom: 1px solid rgba(255,255,255,0.07) !important; }
        .gjs-mdl-title { color: #fff !important; font-family: var(--font-display) !important; font-weight: 600 !important; }
        .gjs-am-assets-cont, .gjs-am-file-uploader > form { background: #12151f !important; border-radius: 12px !important; }

        .gjs-blocks-panel .gjs-blocks-cs { padding: 8px !important; }

        /* Hide default panels */
        .gjs-pn-panels { display: none !important; }

        /* Scrollbar */
        .gjs-blocks-panel::-webkit-scrollbar, .gjs-styles-panel::-webkit-scrollbar { width: 6px; }
        .gjs-blocks-panel::-webkit-scrollbar-thumb, .gjs-styles-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .gjs-blocks-panel::-webkit-scrollbar-thumb:hover, .gjs-styles-panel::-webkit-scrollbar-thumb:hover { background: rgba(74,168,255,0.4); }
      `}</style>
    </div>
  )
}

// ─── Panel Tab Component ─────────────────────────────────────
function PanelTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 h-7 rounded-lg text-[12px] font-medium transition-colors ${active ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-white/55 hover:text-white/85'}`}
    >
      {label}
    </button>
  )
}

/** Top-bar icon button: 32px target, readable at rest, BAM blue when on. */
function toolBtn(active: boolean) {
  return `w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${active ? 'bg-[#1f8fff]/15 text-[#8ec5ff]' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'}`
}

// ─── Custom Blocks ───────────────────────────────────────────
/**
 * Upload images to Supabase storage (bucket `project-assets`, foldered by user)
 * and record them in the `assets` table. Returns the public URLs.
 */
async function uploadAssets(files: File[], projectId: string): Promise<string[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to upload')

  const urls: string[] = []
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    if (file.size > 10 * 1024 * 1024) throw new Error(`"${file.name}" is larger than 10 MB`)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${user.id}/${projectId}/${Date.now()}-${safeName}`

    const { error: upErr } = await supabase.storage
      .from('project-assets')
      .upload(path, file, { cacheControl: '31536000', upsert: false })
    if (upErr) throw new Error(upErr.message)

    const { data: pub } = supabase.storage.from('project-assets').getPublicUrl(path)
    const url = pub.publicUrl
    urls.push(url)

    await supabase.from('assets').insert({
      project_id: projectId, name: file.name, url, type: 'image', size: file.size,
    })
  }
  return urls
}

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
    .gjs-editor { background: #0b0d14 !important; }
    .gjs-cv-canvas { background-color: #05060a !important; }
  `
  document.head.appendChild(style)
}
