import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — record a funnel event
export async function POST(request: Request) {
  try {
    const { projectId, funnelId, stepId, eventType, value, sessionId, metadata } = await request.json()

    if (!funnelId || !stepId || !eventType || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields: funnelId, stepId, eventType, sessionId' }, { status: 400 })
    }

    if (!['view', 'click', 'conversion', 'payment'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('funnel_events').insert({
      project_id: projectId || null,
      funnel_id: funnelId,
      step_id: stepId,
      event_type: eventType,
      value: value ?? 0,
      session_id: sessionId,
      metadata: metadata ?? {},
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

// GET — retrieve analytics for a funnel
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const funnelId = searchParams.get('funnelId')
  const period = searchParams.get('period') ?? '7d'

  if (!funnelId) return NextResponse.json({ error: 'funnelId required' }, { status: 400 })

  const supabase = await createClient()

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
