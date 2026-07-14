/**
 * Shared auth/ownership helpers for API routes. These are defense-in-depth on
 * top of Supabase RLS — they return clean 401/403 JSON instead of silent
 * empty results, and guard the tables whose RLS is intentionally permissive.
 */

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthedUser {
  id: string
  email: string | null
}

/**
 * Require an authenticated user. Returns the user, or a NextResponse to return.
 * Usage: const auth = await requireUser(supabase); if ('response' in auth) return auth.response
 */
export async function requireUser(
  supabase: SupabaseClient,
): Promise<{ user: AuthedUser } | { response: NextResponse }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { user: { id: user.id, email: user.email ?? null } }
}

/**
 * True if the user owns the given project.
 */
export async function userOwnsProject(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<boolean> {
  if (!projectId) return false
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

/**
 * True if the user owns the funnel referenced by a text funnel_id.
 * Experiments store funnel_id as text; only treat it as owned when it maps to a
 * funnels row belonging to the user. Non-UUID / template funnels return false.
 */
export async function userOwnsFunnel(
  supabase: SupabaseClient,
  funnelId: string,
  userId: string,
): Promise<boolean> {
  if (!funnelId || !/^[0-9a-f-]{36}$/i.test(funnelId)) return false
  const { data } = await supabase
    .from('funnels')
    .select('id')
    .eq('id', funnelId)
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}
