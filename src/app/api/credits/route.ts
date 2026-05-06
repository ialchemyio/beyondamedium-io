import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrInitCredits } from '@/lib/credits'

// GET — get current credits with usage info for UI
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const credits = await getOrInitCredits(user.id)
  if (!credits) return NextResponse.json({ error: 'No credit record' }, { status: 404 })

  const used = credits.credits_monthly - credits.credits_remaining
  const usagePercent = credits.credits_monthly > 0 ? Math.min(100, Math.round((used / credits.credits_monthly) * 100)) : 100

  let warningLevel: 'none' | 'warn' | 'urgent' | 'critical' = 'none'
  if (usagePercent >= 99) warningLevel = 'critical'
  else if (usagePercent >= 95) warningLevel = 'urgent'
  else if (usagePercent >= 90) warningLevel = 'warn'

  return NextResponse.json({
    plan: credits.plan,
    monthly: credits.credits_monthly,
    remaining: credits.credits_remaining,
    purchased: credits.credits_purchased,
    total: credits.credits_remaining + credits.credits_purchased,
    used,
    usagePercent,
    warningLevel,
    periodEnd: credits.current_period_end,
  })
}
