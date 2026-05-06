import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BAM_LITE } from '@/lib/bam-lite'
import CreditsIndicator from '@/components/CreditsIndicator'
import GlobalUpgradeListener from '@/components/GlobalUpgradeListener'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // BAM Lite mode shows simplified food-only nav
  type NavItem = { href: string; label: string; highlight?: boolean }

  const liteNav: NavItem[] = [
    { href: '/dashboard/restaurants', label: 'Restaurants' },
    { href: '/dashboard/orders', label: 'Orders' },
    { href: '/dashboard/revenue', label: 'Revenue' },
    { href: '/app/directory', label: 'Directory' },
  ]

  const fullNav: NavItem[] = [
    { href: '/dashboard', label: 'Projects' },
    { href: '/dashboard/templates', label: 'Templates' },
    { href: '/dashboard/premium-templates', label: 'Revenue Systems', highlight: true },
    { href: '/dashboard/funnels', label: 'Funnels' },
    { href: '/dashboard/automations', label: 'Automations' },
    { href: '/dashboard/domains', label: 'Domains' },
    { href: '/dashboard/analytics', label: 'Analytics' },
  ]

  const navItems = BAM_LITE ? liteNav : fullNav

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-white/[0.06] bg-[#06080d]/90 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <Link href={BAM_LITE ? '/dashboard/restaurants' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
            </div>
            <span className="text-sm font-semibold text-white/80">BAM OS{BAM_LITE && <span className="text-[9px] text-cyan-400/70 ml-1.5 font-mono">LITE</span>}</span>
          </Link>
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 rounded-lg hover:bg-white/[0.04] transition-colors whitespace-nowrap flex items-center gap-1"
              >
                {item.highlight && <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <CreditsIndicator variant="compact" />
          <div className="w-px h-4 bg-white/[0.06]" />
          <span className="text-[11px] text-white/25 font-mono">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Sign out</button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
      <GlobalUpgradeListener />
    </div>
  )
}
