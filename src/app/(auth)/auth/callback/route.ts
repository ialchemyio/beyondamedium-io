import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, welcomeEmail } from '@/lib/email'
import { safeNextPath, publicOrigin } from '@/lib/safe-redirect'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = publicOrigin(request)
  const code = searchParams.get('code')
  // Joined to origin below, so it must be a same-site path (`@evil.com` would leave the site).
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Send a welcome email exactly once (flagged in user metadata).
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email && !user.user_metadata?.welcomed_at) {
          const t = welcomeEmail()
          await sendEmail({ to: user.email, ...t })
          await supabase.auth.updateUser({ data: { welcomed_at: new Date().toISOString() } })
        }
      } catch { /* best-effort — never block sign-in */ }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
