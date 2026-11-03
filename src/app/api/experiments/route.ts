import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireUser, userOwnsFunnel, userOwnsPage } from '@/lib/api-auth'

// Experiments RLS keeps public SELECT (the assign route serves logged-out
// visitors), so every handler here checks funnel ownership itself.

async function ownedExperiment(supabase: SupabaseClient, experimentId: string, userId: string) {
  const { data } = await supabase.from('experiments').select('id, funnel_id').eq('id', experimentId).maybeSingle()
  if (!data || !(await userOwnsFunnel(supabase, data.funnel_id, userId))) return null
  return data
}

// Every page a variant points at must belong to the user.
async function pagesOwned(supabase: SupabaseClient, pageIds: (string | null | undefined)[], userId: string) {
  for (const id of new Set(pageIds.filter((p): p is string => !!p))) {
    if (!(await userOwnsPage(supabase, id, userId))) return false
  }
  return true
}

// GET — get experiments for a funnel step (owner only)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const funnelId = searchParams.get('funnelId')
  const stepId = searchParams.get('stepId')
  if (!funnelId && !stepId) return NextResponse.json({ error: 'funnelId or stepId required' }, { status: 400 })

  const supabase = await createClient()
  const auth = await requireUser(supabase)
  if ('response' in auth) return auth.response

  const query = supabase.from('experiments').select('*, variants(*)').order('created_at', { ascending: false })
  const { data } = stepId ? await query.eq('step_id', stepId) : await query.eq('funnel_id', funnelId!)

  const owned: Record<string, boolean> = {}
  for (const fid of new Set((data ?? []).map(e => e.funnel_id as string))) {
    owned[fid] = await userOwnsFunnel(supabase, fid, auth.user.id)
  }
  return NextResponse.json({ experiments: (data ?? []).filter(e => owned[e.funnel_id]) })
}

// POST — create experiment with variants
export async function POST(request: Request) {
  try {
    const { funnelId, stepId, name, variants: variantDefs } = await request.json()
    if (!funnelId || !stepId || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabase = await createClient()
    const auth = await requireUser(supabase)
    if ('response' in auth) return auth.response
    if (!(await userOwnsFunnel(supabase, funnelId, auth.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const defs: { name: string; weight: number; page_id?: string }[] =
      variantDefs?.length ? variantDefs : [{ name: 'A', weight: 50 }, { name: 'B', weight: 50 }]
    if (!(await pagesOwned(supabase, defs.map(d => d.page_id), auth.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create experiment
    const { data: experiment, error } = await supabase
      .from('experiments').insert({ funnel_id: funnelId, step_id: stepId, name, status: 'draft' }).select().single()
    if (error) {
      console.error('[experiments] insert failed:', error.message)
      return NextResponse.json({ error: 'Could not create experiment' }, { status: 500 })
    }

    const { data: variants, error: vError } = await supabase
      .from('variants').insert(defs.map(v => ({
        experiment_id: experiment.id, name: v.name, weight: v.weight, page_id: v.page_id ?? null,
      }))).select()
    if (vError) {
      console.error('[experiments] variant insert failed:', vError.message)
      return NextResponse.json({ error: 'Could not create variants' }, { status: 500 })
    }

    return NextResponse.json({ experiment: { ...experiment, variants } })
  } catch (e: unknown) {
    console.error('[experiments] POST failed:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PATCH — update experiment status, auto-winner, weights
export async function PATCH(request: Request) {
  try {
    const { experimentId, status, autoWinnerThreshold, variants: variantUpdates, winnerVariantId } = await request.json()
    if (!experimentId) return NextResponse.json({ error: 'experimentId required' }, { status: 400 })

    const supabase = await createClient()
    const auth = await requireUser(supabase)
    if ('response' in auth) return auth.response
    if (!(await ownedExperiment(supabase, experimentId, auth.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (status) updates.status = status
    if (autoWinnerThreshold !== undefined) updates.auto_winner_threshold = autoWinnerThreshold
    if (winnerVariantId) updates.winner_variant_id = winnerVariantId

    if (Object.keys(updates).length > 0) {
      await supabase.from('experiments').update(updates).eq('id', experimentId)
    }

    // Update variant weights — only variants of this experiment, only owned pages.
    if (variantUpdates) {
      const list = variantUpdates as { id: string; weight: number; page_id?: string | null }[]
      if (!(await pagesOwned(supabase, list.map(v => v.page_id), auth.user.id))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      for (const v of list) {
        await supabase.from('variants').update({ weight: v.weight, page_id: v.page_id })
          .eq('id', v.id).eq('experiment_id', experimentId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('[experiments] PATCH failed:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = await createClient()
  const auth = await requireUser(supabase)
  if ('response' in auth) return auth.response
  if (!(await ownedExperiment(supabase, id, auth.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await supabase.from('experiments').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
