import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list automations for a project
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ automations: data })
}

// POST — create an automation
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, name, trigger, action, config } = body

    if (!projectId || !name || !trigger || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase.from('automations').insert({
      project_id: projectId,
      user_id: user.id,
      name,
      trigger_type: trigger,
      action_type: action,
      config: config || {},
      is_active: true,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ automation: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
