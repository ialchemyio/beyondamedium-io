import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

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

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet" />
        {page.css && <style dangerouslySetInnerHTML={{ __html: page.css }} />}
        <style dangerouslySetInnerHTML={{ __html: `
          body { margin: 0; font-family: 'Inter', sans-serif; }
          * { box-sizing: border-box; }
        `}} />
      </head>
      <body>
        {/* Navigation for multi-page sites */}
        {navPages.length > 1 && (
          <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '0 24px', height: '56px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <a href={`/p/${slug}`} style={{ color: 'white', fontWeight: 700, fontSize: '16px', textDecoration: 'none' }}>
              {project.name}
            </a>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              {navPages.map((p: { title: string; slug: string; is_home: boolean }) => (
                <a
                  key={p.slug}
                  href={p.is_home ? `/p/${slug}` : `/p/${slug}?page=${p.slug}`}
                  style={{
                    color: p.slug === (pageSlug ?? (page.is_home ? page.slug : '')) ? 'white' : 'rgba(255,255,255,0.5)',
                    fontSize: '13px', textDecoration: 'none', fontWeight: 500,
                  }}
                >
                  {p.title}
                </a>
              ))}
            </div>
          </nav>
        )}

        {/* Page content */}
        <div
          style={navPages.length > 1 ? { paddingTop: '56px' } : undefined}
          dangerouslySetInnerHTML={{ __html: page.html || '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;color:#94a3b8;font-size:18px">This page is empty. Open the editor to add content.</div>' }}
        />

        {/* Powered by badge */}
        <div style={{
          position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          padding: '6px 12px', borderRadius: '8px',
          fontSize: '10px', color: 'rgba(255,255,255,0.5)',
          fontFamily: 'Inter, sans-serif',
        }}>
          Built with <a href="https://beyondamedium.io" style={{ color: '#22d3ee', textDecoration: 'none', fontWeight: 600 }}>BAM</a>
        </div>

        {page.js && <script dangerouslySetInnerHTML={{ __html: page.js }} />}
      </body>
    </html>
  )
}
