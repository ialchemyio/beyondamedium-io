import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — assign a session to a variant (weighted random)
export async function POST(request: Request) {
  try {
    const { experimentId, sessionId } = await request.json()
    if (!experimentId || !sessionId) return NextResponse.json({ error: 'experimentId and sessionId required' }, { status: 400 })

    const supabase = await createClient()

    // Check existing assignment
    const { data: existing } = await supabase
      .from('variant_assignments')
      .select('variant_id, variants(id, name, page_id)')
      .eq('experiment_id', experimentId)
      .eq('session_id', sessionId)
      .single()

    if (existing) {
      return NextResponse.json({ variantId: existing.variant_id, variant: existing.variants })
    }

    // Check if experiment has a winner
    const { data: experiment } = await supabase
      .from('experiments').select('winner_variant_id, status').eq('id', experimentId).single()

    if (experiment?.winner_variant_id) {
      const { data: winner } = await supabase.from('variants').select('*').eq('id', experiment.winner_variant_id).single()
      // Assign to winner
      await supabase.from('variant_assignments').insert({ experiment_id: experimentId, session_id: sessionId, variant_id: experiment.winner_variant_id })
      return NextResponse.json({ variantId: experiment.winner_variant_id, variant: winner, isWinner: true })
    }

    // Get variants with weights
    const { data: variants } = await supabase
      .from('variants').select('*').eq('experiment_id', experimentId).order('created_at')

    if (!variants || variants.length === 0) return NextResponse.json({ error: 'No variants' }, { status: 404 })

    // Weighted random selection
    const totalWeight = variants.reduce((s, v) => s + v.weight, 0)
    let rand = Math.random() * totalWeight
    let selected = variants[0]
    for (const v of variants) {
      rand -= v.weight
      if (rand <= 0) { selected = v; break }
    }

    // Persist assignment
    await supabase.from('variant_assignments').insert({
      experiment_id: experimentId, session_id: sessionId, variant_id: selected.id,
    })

    return NextResponse.json({ variantId: selected.id, variant: selected })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
