import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-white/[0.06] bg-[#06080d]/90 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
            </div>
            <span className="text-sm font-semibold text-white/80">BAM OS</span>
          </Link>
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            <Link href="/dashboard" className="px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-colors whitespace-nowrap">Projects</Link>
            <Link href="/dashboard/templates" className="px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-colors whitespace-nowrap">Templates</Link>
            <Link href="/dashboard/funnels" className="px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-colors whitespace-nowrap">Funnels</Link>
            <Link href="/dashboard/automations" className="px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-colors whitespace-nowrap">Automations</Link>
            <Link href="/dashboard/domains" className="px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-colors whitespace-nowrap">Domains</Link>
            <Link href="/dashboard/analytics" className="px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-colors whitespace-nowrap">Analytics</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-white/25 font-mono">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Sign out</button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
