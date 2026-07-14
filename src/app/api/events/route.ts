import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { requireUser, userOwnsFunnel } from '@/lib/api-auth'

// POST — record a funnel event. Public by design (fires from published sites for
// anonymous visitors) but rate-limited per IP and strictly validated.
export async function POST(request: Request) {
  try {
    // 120 events/min/IP — generous for real traffic, caps insertion abuse.
    const rl = rateLimit(`events:${clientIp(request)}`, 120, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const { projectId, funnelId, stepId, eventType, value, sessionId, metadata } = await request.json()

    if (!funnelId || !stepId || !eventType || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields: funnelId, stepId, eventType, sessionId' }, { status: 400 })
    }

    if (!['view', 'click', 'conversion', 'payment'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
    }

    // Bound the free-form fields so a caller can't stuff huge payloads.
    const numValue = Number(value)
    const safeValue = Number.isFinite(numValue) && numValue >= 0 ? numValue : 0
    const safeMeta = metadata && typeof metadata === 'object' && JSON.stringify(metadata).length < 4000 ? metadata : {}
    if (String(funnelId).length > 200 || String(stepId).length > 200 || String(sessionId).length > 200) {
      return NextResponse.json({ error: 'Field too long' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('funnel_events').insert({
      project_id: projectId || null,
      funnel_id: funnelId,
      step_id: stepId,
      event_type: eventType,
      value: safeValue,
      session_id: sessionId,
      metadata: safeMeta,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

// GET — retrieve analytics for a funnel. Requires auth + funnel ownership so a
// caller can't read another account's conversion/revenue data by guessing IDs.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const funnelId = searchParams.get('funnelId')
  const period = searchParams.get('period') ?? '7d'

  if (!funnelId) return NextResponse.json({ error: 'funnelId required' }, { status: 400 })

  const supabase = await createClient()
  const auth = await requireUser(supabase)
  if ('response' in auth) return auth.response
  if (!(await userOwnsFunnel(supabase, funnelId, auth.user.id))) {
    return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
  }

  // Calculate date range
  const now = new Date()
  const periodMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30 }
  const days = periodMap[period] ?? 7
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: events, error } = await supabase
    .from('funnel_events')
    .select('step_id, event_type, value')
    .eq('funnel_id', funnelId)
    .gte('created_at', since)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate per step
  const steps: Record<string, { views: number; clicks: number; conversions: number; payments: number; revenue: number }> = {}

  for (const event of events ?? []) {
    if (!steps[event.step_id]) {
      steps[event.step_id] = { views: 0, clicks: 0, conversions: 0, payments: 0, revenue: 0 }
    }
    const s = steps[event.step_id]
    if (event.event_type === 'view') s.views++
    if (event.event_type === 'click') s.clicks++
    if (event.event_type === 'conversion') s.conversions++
    if (event.event_type === 'payment') { s.payments++; s.revenue += Number(event.value) || 0 }
  }

  // Calculate totals
  const stepIds = Object.keys(steps)
  const totalViews = stepIds.reduce((sum, id) => sum + steps[id].views, 0)
  const totalConversions = stepIds.reduce((sum, id) => sum + steps[id].conversions, 0)
  const totalRevenue = stepIds.reduce((sum, id) => sum + steps[id].revenue, 0)
  const overallRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : '0'

  // Find highest drop-off
  let highestDropoff = { stepId: '', dropoff: 0, rate: 0 }
  const sortedSteps = stepIds.sort((a, b) => steps[b].views - steps[a].views)
  for (let i = 1; i < sortedSteps.length; i++) {
    const prev = steps[sortedSteps[i - 1]].views
    const curr = steps[sortedSteps[i]].views
    const drop = prev - curr
    const rate = prev > 0 ? (drop / prev) * 100 : 0
    if (rate > highestDropoff.rate) {
      highestDropoff = { stepId: sortedSteps[i], dropoff: drop, rate }
    }
  }

  return NextResponse.json({
    steps,
    summary: {
      totalViews,
      totalConversions,
      totalRevenue,
      overallConversionRate: overallRate,
      highestDropoff,
      period,
    },
  })
}
