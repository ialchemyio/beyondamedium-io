import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publicOrigin } from '@/lib/safe-redirect'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const origin = publicOrigin(request)
  return NextResponse.redirect(`${origin}/login`, { status: 302 })
}
