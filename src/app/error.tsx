'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface to the server console / any future error tracker.
    console.error('App error:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-[#06080d] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-[11px] font-mono tracking-widest text-red-400/60 uppercase mb-4">Something went wrong</p>
        <h1 className="text-3xl font-bold mb-3">Unexpected error</h1>
        <p className="text-sm text-white/40 mb-8">
          We hit a snag rendering this page. You can try again, or head back home.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all">
            Try again
          </button>
          <Link href="/" className="px-6 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-sm font-medium rounded-xl transition-colors">
            Back home
          </Link>
        </div>
        {error.digest && <p className="text-[10px] text-white/20 font-mono mt-6">ref: {error.digest}</p>}
      </div>
    </main>
  )
}
