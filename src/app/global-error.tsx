'use client'

import { useEffect } from 'react'

// global-error replaces the root layout, so it must render its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', background: '#06080d', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px' }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 28px' }}>
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ padding: '10px 24px', borderRadius: 12, border: 0, cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600, background: 'linear-gradient(90deg,#06b6d4,#3b82f6)' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
