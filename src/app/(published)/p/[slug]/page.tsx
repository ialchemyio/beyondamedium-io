import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

// Paid plans get the watermark removed. Read the owner's plan with the service
// role (RLS blocks anonymous visitors from reading another user's credits).
async function ownerHasPaidPlan(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false
  try {
    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data } = await svc.from('user_credits').select('plan').eq('user_id', userId).maybeSingle()
    return !!data && ['builder', 'pro', 'bam'].includes(data.plan)
  } catch {
    return false
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('name, description')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!project) return { title: 'Not Found' }

  return {
    title: project.name,
    description: project.description || `${project.name} — Built with Beyond A Medium`,
  }
}

export default async function PublishedSitePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageSlug } = await searchParams

  const supabase = await createClient()

  // Get published project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!project) notFound()

  // Get the requested page or home page
  let page
  if (pageSlug) {
    const { data } = await supabase
      .from('pages')
      .select('*')
      .eq('project_id', project.id)
      .eq('slug', pageSlug)
      .single()
    page = data
  } else {
    // Get home page or first page
    const { data } = await supabase
      .from('pages')
      .select('*')
      .eq('project_id', project.id)
      .eq('is_home', true)
      .single()
    page = data

    if (!page) {
      const { data: firstPage } = await supabase
        .from('pages')
        .select('*')
        .eq('project_id', project.id)
        .order('sort_order')
        .limit(1)
        .single()
      page = firstPage
    }
  }

  if (!page) notFound()

  // Get all pages for navigation
  const { data: allPages } = await supabase
    .from('pages')
    .select('title, slug, is_home')
    .eq('project_id', project.id)
    .order('sort_order')

  const navPages = allPages ?? []

  // Build the visitor-facing document as an isolated string. It is rendered inside a
  // sandboxed, null-origin iframe (srcdoc, no allow-same-origin) so any user/AI-authored
  // HTML/CSS/JS cannot read beyondamedium.io cookies/localStorage or call our APIs with
  // the visitor's session — closing the same-origin stored-XSS hole.
  const currentSlug = pageSlug ?? (page.is_home ? page.slug : '')
  const navHtml = navPages.length > 1 ? `
    <nav style="position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(15,23,42,0.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.1);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between">
      <a href="/p/${escapeAttr(slug)}" target="_top" style="color:white;font-weight:700;font-size:16px;text-decoration:none">${escapeHtml(project.name)}</a>
      <div style="display:flex;gap:24px;align-items:center">
        ${navPages.map((p: { title: string; slug: string; is_home: boolean }) =>
          `<a href="${p.is_home ? `/p/${escapeAttr(slug)}` : `/p/${escapeAttr(slug)}?page=${escapeAttr(p.slug)}`}" target="_top" style="color:${p.slug === currentSlug ? 'white' : 'rgba(255,255,255,0.5)'};font-size:13px;text-decoration:none;font-weight:500">${escapeHtml(p.title)}</a>`,
        ).join('')}
      </div>
    </nav>` : ''

  const bodyContent = page.html || '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;color:#94a3b8;font-size:18px">This page is empty. Open the editor to add content.</div>'
  const contentPad = navPages.length > 1 ? 'padding-top:56px' : ''

  // Free tier keeps the watermark; paid plans remove it.
  const showWatermark = !(await ownerHasPaidPlan(project.user_id))
  const watermarkHtml = showWatermark
    ? `<div style="position:fixed;bottom:16px;right:16px;z-index:9999;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);padding:6px 12px;border-radius:8px;font-size:10px;color:rgba(255,255,255,0.5);font-family:'Inter',sans-serif">Built with <a href="https://beyondamedium.io" target="_top" style="color:#22d3ee;text-decoration:none;font-weight:600">BAM</a></div>`
    : ''

  const srcDoc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet" />
<style>body{margin:0;font-family:'Inter',sans-serif}*{box-sizing:border-box}</style>
${page.css ? `<style>${page.css}</style>` : ''}
</head>
<body>
${navHtml}
<div style="${contentPad}">${bodyContent}</div>
${watermarkHtml}
${page.js ? `<script>${page.js}</script>` : ''}
</body>
</html>`

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: 'html,body{margin:0;height:100%;background:#fff}iframe{border:0;width:100%;height:100vh;display:block}' }} />
      </head>
      <body>
        <iframe
          title={project.name}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals"
        />
      </body>
    </html>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
function escapeAttr(s: string): string {
  return escapeHtml(s)
}
