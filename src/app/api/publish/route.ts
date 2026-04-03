import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json()
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Get all pages
    const { data: pages } = await supabase
      .from('pages')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order')

    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No pages to publish' }, { status: 400 })
    }

    // Mark project as published
    await supabase
      .from('projects')
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq('id', projectId)

    const siteUrl = `/p/${project.slug}`

    return NextResponse.json({
      success: true,
      url: siteUrl,
      pages: pages.length,
      slug: project.slug,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Publish failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
