/**
 * Server-side credit enforcement.
 * Direct DB calls (not via fetch) so it works inside other API routes.
 */

import { createClient } from '@supabase/supabase-js'
import { PLANS, type PlanKey, CREDIT_COSTS } from './stripe'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface CreditCheckResult {
  ok: boolean
  remaining: number
  monthly: number
  purchased: number
  total: number
  usagePercent: number
  warningLevel: 'none' | 'warn' | 'urgent' | 'critical'
  upgrade?: boolean
  reason?: string
}

interface DeductResult extends CreditCheckResult {
  deducted: number
}

/**
 * Get current credits for a user. Auto-creates a starter record if missing.
 * Also handles monthly reset if current_period_end has passed.
 */
export async function getOrInitCredits(userId: string) {
  const supabase = getServiceClient()

  let { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!credits) {
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const plan = PLANS.starter
    const { data: newCredits } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        plan: 'starter',
        credits_remaining: plan.monthlyCredits,
        credits_monthly: plan.monthlyCredits,
        credits_purchased: 0,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select()
      .single()

    credits = newCredits
  }

  // Handle monthly reset
  if (credits && credits.current_period_end && new Date(credits.current_period_end) < new Date()) {
    const planKey = (credits.plan as PlanKey) ?? 'starter'
    const plan = PLANS[planKey]
    const now = new Date()
    const newPeriodEnd = new Date(now)
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

    const { data: refreshed } = await supabase
      .from('user_credits')
      .update({
        credits_remaining: plan.monthlyCredits,
        credits_monthly: plan.monthlyCredits,
        current_period_start: now.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()
    credits = refreshed ?? credits
  }

  return credits
}

/**
 * Check if a user has enough credits for an action without deducting.
 */
export async function checkCredits(userId: string, amount: number): Promise<CreditCheckResult> {
  const credits = await getOrInitCredits(userId)
  if (!credits) {
    return { ok: false, remaining: 0, monthly: 0, purchased: 0, total: 0, usagePercent: 100, warningLevel: 'critical', upgrade: true, reason: 'no_credits_record' }
  }

  const remaining = credits.credits_remaining
  const purchased = credits.credits_purchased
  const monthly = credits.credits_monthly
  const total = remaining + purchased
  const used = monthly - remaining
  const usagePercent = monthly > 0 ? Math.min(100, Math.round((used / monthly) * 100)) : 100

  let warningLevel: CreditCheckResult['warningLevel'] = 'none'
  if (usagePercent >= 99) warningLevel = 'critical'
  else if (usagePercent >= 95) warningLevel = 'urgent'
  else if (usagePercent >= 90) warningLevel = 'warn'

  if (total < amount) {
    return { ok: false, remaining, monthly, purchased, total, usagePercent: 100, warningLevel: 'critical', upgrade: true, reason: 'insufficient_credits' }
  }

  return { ok: true, remaining, monthly, purchased, total, usagePercent, warningLevel }
}

function warningFor(usagePercent: number): CreditCheckResult['warningLevel'] {
  if (usagePercent >= 99) return 'critical'
  if (usagePercent >= 95) return 'urgent'
  if (usagePercent >= 90) return 'warn'
  return 'none'
}

/**
 * Atomically deduct credits via the `deduct_credits` Postgres function (row-locked).
 * Deducts from the purchased pool first, then monthly. Concurrency-safe — parallel
 * requests can no longer each read the same balance and over-spend.
 */
export async function deductCredits(userId: string, amount: number, action: string): Promise<DeductResult> {
  const supabase = getServiceClient()

  // Ensure a credits row + monthly reset before the atomic deduct.
  await getOrInitCredits(userId)

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_action: action,
  })

  if (error) {
    const reason = /insufficient_credits/.test(error.message) ? 'insufficient_credits'
      : /no_credits_record/.test(error.message) ? 'no_credits_record'
      : error.message
    // Best-effort read so the UI can still show the current balance.
    const current = await getOrInitCredits(userId)
    return {
      ok: false, deducted: 0,
      remaining: current?.credits_remaining ?? 0,
      monthly: current?.credits_monthly ?? 0,
      purchased: current?.credits_purchased ?? 0,
      total: (current?.credits_remaining ?? 0) + (current?.credits_purchased ?? 0),
      usagePercent: 100,
      warningLevel: 'critical',
      upgrade: reason === 'insufficient_credits',
      reason,
    }
  }

  const rec = Array.isArray(data) ? data[0] : data
  const used = rec.credits_monthly - rec.credits_remaining
  const usagePercent = rec.credits_monthly > 0 ? Math.min(100, Math.round((used / rec.credits_monthly) * 100)) : 100

  return {
    ok: true,
    deducted: amount,
    remaining: rec.credits_remaining,
    monthly: rec.credits_monthly,
    purchased: rec.credits_purchased,
    total: rec.credits_remaining + rec.credits_purchased,
    usagePercent,
    warningLevel: warningFor(usagePercent),
  }
}

/**
 * Refund credits previously deducted (e.g. when the downstream AI call fails).
 * Returns them to the monthly pool.
 */
export async function refundCredits(userId: string, amount: number, action: string): Promise<void> {
  if (amount <= 0) return
  const supabase = getServiceClient()
  const credits = await getOrInitCredits(userId)
  if (!credits) return
  await supabase.from('user_credits').update({
    credits_remaining: credits.credits_remaining + amount,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)
  await supabase.from('credit_transactions').insert({
    user_id: userId, amount, action: `refund_${action}`, description: `Refunded ${amount} credits (${action} failed)`,
  })
}

/**
 * Grant one-time purchased credits (credit pack). Atomic via `add_purchased_credits`.
 */
export async function addPurchasedCredits(userId: string, amount: number, action = 'credit_pack'): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase.rpc('add_purchased_credits', {
    p_user_id: userId, p_amount: amount, p_action: action,
  })
  if (error) throw new Error(`add_purchased_credits failed: ${error.message}`)
}

/**
 * Provision / refresh a subscription plan. Atomic upsert via `provision_plan`.
 */
export async function provisionPlan(params: {
  userId: string
  plan: string
  monthlyCredits: number
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  periodStart?: string | null
  periodEnd?: string | null
}): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase.rpc('provision_plan', {
    p_user_id: params.userId,
    p_plan: params.plan,
    p_monthly: params.monthlyCredits,
    p_customer: params.stripeCustomerId ?? null,
    p_subscription: params.stripeSubscriptionId ?? null,
    p_period_start: params.periodStart ?? new Date().toISOString(),
    p_period_end: params.periodEnd ?? new Date(Date.now() + 30 * 864e5).toISOString(),
  })
  if (error) throw new Error(`provision_plan failed: ${error.message}`)
}

/**
 * Get cost for an AI action by mode/type.
 */
export function getCostForMode(mode: string): number {
  if (mode === 'edit') return CREDIT_COSTS.edit_element
  if (mode === 'section') return CREDIT_COSTS.generate_section
  if (mode === 'agent_build') return CREDIT_COSTS.agent_build
  return CREDIT_COSTS.generate_page
}
