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

/**
 * Atomically deduct credits. Deducts from purchased pool first, then monthly.
 */
export async function deductCredits(userId: string, amount: number, action: string): Promise<DeductResult> {
  const supabase = getServiceClient()
  const credits = await getOrInitCredits(userId)

  if (!credits) {
    return { ok: false, deducted: 0, remaining: 0, monthly: 0, purchased: 0, total: 0, usagePercent: 100, warningLevel: 'critical', upgrade: true, reason: 'no_credits_record' }
  }

  const total = credits.credits_remaining + credits.credits_purchased
  if (total < amount) {
    return {
      ok: false, deducted: 0,
      remaining: credits.credits_remaining,
      monthly: credits.credits_monthly,
      purchased: credits.credits_purchased,
      total,
      usagePercent: 100,
      warningLevel: 'critical',
      upgrade: true,
      reason: 'insufficient_credits',
    }
  }

  // Deduct from purchased first, then monthly
  let fromPurchased = 0
  let fromMonthly = 0
  if (credits.credits_purchased >= amount) {
    fromPurchased = amount
  } else {
    fromPurchased = credits.credits_purchased
    fromMonthly = amount - fromPurchased
  }

  const newRemaining = credits.credits_remaining - fromMonthly
  const newPurchased = credits.credits_purchased - fromPurchased

  await supabase.from('user_credits').update({
    credits_remaining: newRemaining,
    credits_purchased: newPurchased,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    action,
    description: `Used ${amount} credits for ${action}`,
  })

  const used = credits.credits_monthly - newRemaining
  const usagePercent = credits.credits_monthly > 0 ? Math.min(100, Math.round((used / credits.credits_monthly) * 100)) : 100

  let warningLevel: CreditCheckResult['warningLevel'] = 'none'
  if (usagePercent >= 99) warningLevel = 'critical'
  else if (usagePercent >= 95) warningLevel = 'urgent'
  else if (usagePercent >= 90) warningLevel = 'warn'

  return {
    ok: true,
    deducted: amount,
    remaining: newRemaining,
    monthly: credits.credits_monthly,
    purchased: newPurchased,
    total: newRemaining + newPurchased,
    usagePercent,
    warningLevel,
  }
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
