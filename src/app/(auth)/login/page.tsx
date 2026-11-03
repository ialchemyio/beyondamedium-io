'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogIn } from 'lucide-react'
import Link from 'next/link'
import { safeNextPath } from '@/lib/safe-redirect'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [note, setNote] = useState('')

  // Read on the client so the page stays static (useSearchParams needs a Suspense boundary).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'auth') {
      setError('That sign-in link has expired or was opened in a different browser. Sign in below, or sign up again to get a new link.')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const notConfirmed = error.code === 'email_not_confirmed'
      setUnconfirmed(notConfirmed)
      setError(notConfirmed ? 'Confirm your email first: open the link we sent when you signed up.' : error.message)
      setLoading(false)
    } else {
      router.push(safeNextPath(new URLSearchParams(window.location.search).get('redirect')))
      router.refresh()
    }
  }

  async function resend() {
    const { error } = await createClient().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setNote(error ? error.message : 'Sent. Check your inbox and spam folder.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block" aria-label="Beyond A Medium home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/bam-logo.png" alt="BAM | Beyond A Medium" width={1092} height={460} className="h-20 w-auto mx-auto" />
          </Link>
          <h1 className="text-xl font-semibold mt-4 text-white">Sign in to your account</h1>
          <p className="text-sm text-white/40 mt-1">Build websites with AI</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-sm">
              {error}
              {unconfirmed && <button type="button" onClick={resend} className="block mt-1 text-[#8ec5ff] hover:text-[#b9dcff]">Resend confirmation email</button>}
            </div>
          )}
          {note && <div className="text-xs text-white/50">{note}</div>}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-white/60 mb-1.5">Email</label>
            <input id="email" name="email" autoComplete="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:border-[#4aa8ff]/60 focus:ring-1 focus:ring-[#4aa8ff]/40 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
            <input id="password" name="password" autoComplete="current-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:border-[#4aa8ff]/60 focus:ring-1 focus:ring-[#4aa8ff]/40 focus:outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#1570e0] to-[#0a5bd8] hover:brightness-110 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
            <LogIn className="w-4 h-4" /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#8ec5ff] hover:text-[#b9dcff]">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
