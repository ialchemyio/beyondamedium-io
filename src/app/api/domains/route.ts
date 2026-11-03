import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser, userOwnsProject } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'
import { normalizeDomain } from '@/lib/custom-domains'
import { sendEmail, domainRequestedEmail, domainRemovedEmail } from '@/lib/email'

// POST { projectId, domain } — request a custom domain for a project you own.
// Saved as 'requested'; the BAM team activates it (RLS forbids users doing so).
export async function POST(request: Request) {
  const { projectId, domain: raw } = await request.json().catch(() => ({}))
  if (!projectId || typeof projectId !== 'string' || typeof raw !== 'string') {
    return NextResponse.json({ error: 'projectId and domain are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const auth = await requireUser(supabase)
  if ('response' in auth) return auth.response
  const { user } = auth

  const rl = rateLimit(`domains:${user.id}`, 10, 60_000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })

  const parsed = normalizeDomain(raw)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const domain = parsed.domain

  if (!(await userOwnsProject(supabase, projectId, user.id))) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: row, error } = await supabase
    .from('custom_domains')
    .insert({ domain, project_id: projectId, user_id: user.id, status: 'requested' })
    .select('domain, project_id, status, note, created_at, activated_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      const msg = /project/i.test(error.message)
        ? 'This project already has a domain. Remove it first to request a different one.'
        : 'That domain has already been requested for another site. If it is yours, contact the BAM team.'
      return NextResponse.json({ error: msg }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Tell the team there is setup work. Honest no-op if email isn't configured.
  const team = process.env.BAM_TEAM_EMAIL
  if (team) {
    const { data: project } = await supabase.from('projects').select('name, slug').eq('id', projectId).single()
    await sendEmail({
      to: team,
      ...domainRequestedEmail({ domain, projectName: project?.name ?? projectId, slug: project?.slug ?? '', requester: user.email ?? user.id }),
    })
  }

  return NextResponse.json({ domain: row })
}

// DELETE { projectId } — remove the project's domain (any status).
export async function DELETE(request: Request) {
  const { projectId } = await request.json().catch(() => ({}))
  if (!projectId || typeof projectId !== 'string') {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const auth = await requireUser(supabase)
  if ('response' in auth) return auth.response

  // RLS limits the delete to the caller's own rows.
  const { data, error } = await supabase
    .from('custom_domains').delete().eq('project_id', projectId).select('domain, status')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'No domain found for this project' }, { status: 404 })

  const removed = data[0]
  if (removed.status === 'active' && process.env.BAM_TEAM_EMAIL) {
    await sendEmail({ to: process.env.BAM_TEAM_EMAIL, ...domainRemovedEmail(removed.domain) })
  }
  return NextResponse.json({ removed: removed.domain })
}
