import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — get current credits
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Auto-create if doesn't exist
  if (!credits) {
    const { data: newCredits } = await supabase
      .from('user_credits')
      .insert({ user_id: user.id, plan: 'starter', credits_remaining: 5, credits_monthly: 5 })
      .select()
      .single()
    credits = newCredits
  }

  return NextResponse.json({ credits })
}

// POST — deduct credits
export async function POST(request: Request) {
  const { action, amount } = await request.json()
  if (!action || !amount) return NextResponse.json({ error: 'action and amount required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get current credits
  const { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!credits) return NextResponse.json({ error: 'No credit record found' }, { status: 404 })

  const totalAvailable = credits.credits_remaining + credits.credits_purchased
  if (totalAvailable < amount) {
    return NextResponse.json({
      error: 'Insufficient credits',
      remaining: credits.credits_remaining,
      purchased: credits.credits_purchased,
      needed: amount,
      upgrade: true,
    }, { status: 402 })
  }

  // Deduct from purchased first, then monthly
  let deductPurchased = 0
  let deductMonthly = 0
  if (credits.credits_purchased >= amount) {
    deductPurchased = amount
  } else {
    deductPurchased = credits.credits_purchased
    deductMonthly = amount - deductPurchased
  }

  await supabase.from('user_credits').update({
    credits_remaining: credits.credits_remaining - deductMonthly,
    credits_purchased: credits.credits_purchased - deductPurchased,
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: user.id,
    amount: -amount,
    action,
    description: `Used ${amount} credits for ${action}`,
  })

  return NextResponse.json({
    success: true,
    creditsUsed: amount,
    remaining: credits.credits_remaining - deductMonthly,
    purchased: credits.credits_purchased - deductPurchased,
  })
}
