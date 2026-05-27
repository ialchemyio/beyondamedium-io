import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy — Beyond A Medium',
  description: 'How Beyond A Medium uses cookies and similar tracking technologies, and how you can control them.',
}

const EFFECTIVE_DATE = 'May 26, 2026'

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-[#06080d] text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-xs text-cyan-400/70 hover:text-cyan-300 font-mono">&larr; back home</Link>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 mb-2">Cookie Policy</h1>
        <p className="text-xs text-white/40 mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="text-sm text-white/70 leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white">What are cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. We also use similar technologies such
              as localStorage. This policy explains how Beyond A Medium uses them and how you can control them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Categories we use</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="font-semibold text-white">Strictly Necessary</h3>
                <p className="mt-1 text-white/60">
                  Required to operate the Service: keeping you signed in (Supabase auth session), maintaining checkout state
                  (Stripe), remembering your cookie preferences, and protecting against fraud and abuse. These cannot be turned
                  off because the Service will not function without them.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="font-semibold text-white">Functional</h3>
                <p className="mt-1 text-white/60">
                  Remember preferences such as your editor layout, theme, and recently opened projects. Off by default until you
                  consent.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="font-semibold text-white">Analytics</h3>
                <p className="mt-1 text-white/60">
                  Help us understand how the Service is used so we can improve it (e.g. page views, feature usage, errors). Off by
                  default until you consent. If we add an analytics provider, we will disclose it here before enabling it.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="font-semibold text-white">Marketing / Advertising</h3>
                <p className="mt-1 text-white/60">
                  We do not currently set marketing or cross-site advertising cookies. If this ever changes, we will update this
                  policy and request your consent before activating them.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Your choices</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the cookie banner shown on your first visit to accept or reject non-essential cookies.</li>
              <li>Change your choice at any time using the &ldquo;Cookie Preferences&rdquo; link in the footer.</li>
              <li>Configure your browser to block or delete cookies (blocking strictly necessary cookies may break the Service).</li>
              <li>We honor the Global Privacy Control (GPC) signal as an opt-out of sale or sharing where applicable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Do Not Sell or Share</h2>
            <p>
              We do not sell your personal information and we do not share it for cross-context behavioral advertising. See our
              <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300"> Privacy Policy</Link> for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p>
              Questions? Email <a className="text-cyan-400 hover:text-cyan-300" href="mailto:privacy@beyondamedium.io">privacy@beyondamedium.io</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
