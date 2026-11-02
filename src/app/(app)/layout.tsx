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
    { href: '/dashboard/billing', label: 'Billing' },
  ]

  liteNav.push({ href: '/dashboard/billing', label: 'Billing' })

  const navItems = BAM_LITE ? liteNav : fullNav

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-white/[0.06] bg-[#05060a]/85 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shrink-0 gap-4">
        <div className="flex items-center gap-6">
          <Link href={BAM_LITE ? '/dashboard/restaurants' : '/dashboard'} className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-[#4aa8ff] via-[#1f8fff] to-[#7c5cff] flex items-center justify-center">
              <span className="font-display text-[12px] font-extrabold text-white">B</span>
            </span>
            <span className="font-display text-[15px] font-bold text-white">bam<span className="text-[#4aa8ff]">.</span>{BAM_LITE && <span className="text-[11px] text-[#8ec5ff] ml-1.5 font-mono">LITE</span>}</span>
          </Link>
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="px-2.5 py-1.5 text-[13px] text-white/60 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors whitespace-nowrap flex items-center gap-1"
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
          {!BAM_LITE && (
            <Link href="/dashboard/new" className="bam-pill hidden md:inline-flex px-3.5 py-1.5 text-[12px]">Build with AI</Link>
          )}
          <span className="hidden lg:inline text-[12px] text-white/50 font-mono">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-[12px] text-white/55 hover:text-white transition-colors">Sign out</button>
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
