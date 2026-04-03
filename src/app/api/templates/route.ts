import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list all public templates
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_public', true)
    .order('uses', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

// POST — save a page as a template
export async function POST(request: Request) {
  try {
    const { pageId, name, description, category, isPublic } = await request.json()
    if (!pageId || !name) return NextResponse.json({ error: 'pageId and name required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get the page content
    const { data: page } = await supabase.from('pages').select('html, css, js, gjs_data').eq('id', pageId).single()
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

    // Save as template
    const { data: template, error } = await supabase.from('templates').insert({
      user_id: user.id,
      name,
      description: description || '',
      category: category || 'general',
      html: page.html,
      css: page.css,
      js: page.js,
      gjs_data: page.gjs_data,
      is_public: isPublic ?? false,
      uses: 0,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ template })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save template'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
