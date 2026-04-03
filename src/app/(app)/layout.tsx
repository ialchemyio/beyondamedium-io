import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <Link href="/dashboard" className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          BAM
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/30">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-xs text-white/40 hover:text-white/60 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
