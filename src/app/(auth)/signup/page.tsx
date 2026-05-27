'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!acceptedTerms) { setError('You must accept the Terms of Service and Privacy Policy to continue'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          accepted_terms_at: new Date().toISOString(),
          accepted_terms_version: 1,
          marketing_opt_in: marketingOptIn,
        },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">BAM</Link>
          <h1 className="text-xl font-semibold mt-4 text-white">Create your account</h1>
          <p className="text-sm text-white/40 mt-1">Start building websites with AI</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-purple-500/40 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-purple-500/40 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:border-purple-500/40 focus:outline-none" />
          </div>
          <label className="flex items-start gap-2.5 text-xs text-white/60 leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 accent-purple-500 shrink-0"
            />
            <span>
              I have read and agree to the{' '}
              <Link href="/terms" target="_blank" className="text-purple-400 hover:text-purple-300 underline">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link>.
              I understand that paid plans are subscriptions that auto-renew until I cancel.
            </span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-white/50 leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-purple-500 shrink-0"
            />
            <span>Optional: email me product updates and tips. You can unsubscribe anytime.</span>
          </label>

          <p className="text-[11px] text-white/35 leading-relaxed">
            By creating an account, you confirm you are at least 14 years old. AI outputs may be inaccurate &mdash; please review
            before publishing.
          </p>

          <button type="submit" disabled={loading || !acceptedTerms} className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <UserPlus className="w-4 h-4" /> {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
