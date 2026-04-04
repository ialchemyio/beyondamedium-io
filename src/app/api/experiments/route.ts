import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — get experiments for a funnel step
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const funnelId = searchParams.get('funnelId')
  const stepId = searchParams.get('stepId')

  const supabase = await createClient()

  if (stepId) {
    const { data } = await supabase
      .from('experiments').select('*, variants(*)').eq('step_id', stepId).order('created_at', { ascending: false })
    return NextResponse.json({ experiments: data ?? [] })
  }

  if (funnelId) {
    const { data } = await supabase
      .from('experiments').select('*, variants(*)').eq('funnel_id', funnelId).order('created_at', { ascending: false })
    return NextResponse.json({ experiments: data ?? [] })
  }

  return NextResponse.json({ error: 'funnelId or stepId required' }, { status: 400 })
}

// POST — create experiment with variants
export async function POST(request: Request) {
  try {
    const { funnelId, stepId, name, variants: variantDefs } = await request.json()
    if (!funnelId || !stepId || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabase = await createClient()

    // Create experiment
    const { data: experiment, error } = await supabase
      .from('experiments').insert({ funnel_id: funnelId, step_id: stepId, name, status: 'draft' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Create variants (default A/B if none provided)
    const defs = variantDefs?.length ? variantDefs : [{ name: 'A', weight: 50 }, { name: 'B', weight: 50 }]
    const { data: variants, error: vError } = await supabase
      .from('variants').insert(defs.map((v: { name: string; weight: number; page_id?: string }) => ({
        experiment_id: experiment.id, name: v.name, weight: v.weight, page_id: v.page_id ?? null,
      }))).select()
    if (vError) return NextResponse.json({ error: vError.message }, { status: 500 })

    return NextResponse.json({ experiment: { ...experiment, variants } })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

// PATCH — update experiment status, auto-winner, weights
export async function PATCH(request: Request) {
  try {
    const { experimentId, status, autoWinnerThreshold, variants: variantUpdates, winnerVariantId } = await request.json()
    if (!experimentId) return NextResponse.json({ error: 'experimentId required' }, { status: 400 })

    const supabase = await createClient()

    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (autoWinnerThreshold !== undefined) updates.auto_winner_threshold = autoWinnerThreshold
    if (winnerVariantId) updates.winner_variant_id = winnerVariantId

    if (Object.keys(updates).length > 0) {
      await supabase.from('experiments').update(updates).eq('id', experimentId)
    }

    // Update variant weights
    if (variantUpdates) {
      for (const v of variantUpdates) {
        await supabase.from('variants').update({ weight: v.weight, page_id: v.page_id }).eq('id', v.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = await createClient()
  await supabase.from('experiments').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
