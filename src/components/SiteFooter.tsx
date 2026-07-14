'use client'

import { Cpu } from 'lucide-react'
import Link from 'next/link'

export default function SiteFooter() {
  function openCookiePrefs() {
    window.dispatchEvent(new CustomEvent('bam:open-cookie-prefs'))
  }

  return (
    <footer className="border-t border-white/[0.04] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Cpu className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] text-white/45 font-mono">&copy; 2026 Beyond A Medium</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-white/45 font-mono">
            <a href="#features" className="hover:text-white/40 transition-colors">features</a>
            <a href="#pricing" className="hover:text-white/40 transition-colors">pricing</a>
            <Link href="/privacy" className="hover:text-white/40 transition-colors">privacy</Link>
            <Link href="/terms" className="hover:text-white/40 transition-colors">terms</Link>
            <Link href="/refund" className="hover:text-white/40 transition-colors">refunds</Link>
            <Link href="/cookies" className="hover:text-white/40 transition-colors">cookies</Link>
            <button
              type="button"
              onClick={openCookiePrefs}
              className="hover:text-white/40 transition-colors"
            >
              cookie preferences
            </button>
          </div>
        </div>
        <p className="text-[10px] text-white/35 font-mono text-center sm:text-left">
          Beyond A Medium does not sell or share your personal information for cross-context behavioral advertising.
          AI features may produce inaccurate output &mdash; review before publishing. Subscriptions auto-renew until canceled;
          manage billing from your dashboard.
        </p>
      </div>
    </footer>
  )
}
