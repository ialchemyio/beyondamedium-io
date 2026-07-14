import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } }

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#06080d] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-[11px] font-mono tracking-widest text-cyan-400/60 uppercase mb-4">Error 404</p>
        <h1 className="text-3xl font-bold mb-3">This page doesn&rsquo;t exist</h1>
        <p className="text-sm text-white/40 mb-8">The page you&rsquo;re looking for may have moved or never existed.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all">
          Back home
        </Link>
      </div>
    </main>
  )
}
