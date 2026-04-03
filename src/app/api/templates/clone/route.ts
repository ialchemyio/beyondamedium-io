import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — clone a template into a project page
export async function POST(request: Request) {
  try {
    const { templateId, projectId, pageTitle } = await request.json()
    if (!templateId || !projectId) return NextResponse.json({ error: 'templateId and projectId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get template
    const { data: template } = await supabase.from('templates').select('*').eq('id', templateId).single()
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    // Create page from template
    const title = pageTitle || template.name
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')

    const { data: page, error } = await supabase.from('pages').insert({
      project_id: projectId,
      title,
      slug,
      html: template.html,
      css: template.css,
      js: template.js,
      gjs_data: template.gjs_data,
      sort_order: 99,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Increment template uses
    await supabase.from('templates').update({ uses: (template.uses || 0) + 1 }).eq('id', templateId)

    return NextResponse.json({ page })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Clone failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
