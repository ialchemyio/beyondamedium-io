'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Consent = {
  necessary: true
  functional: boolean
  analytics: boolean
  marketing: boolean
  version: number
  timestamp: string
}

const STORAGE_KEY = 'bam_cookie_consent_v1'
const POLICY_VERSION = 1

function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Consent
    if (parsed.version !== POLICY_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function writeConsent(c: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    window.dispatchEvent(new CustomEvent('bam:consent', { detail: c }))
  } catch {
    /* localStorage unavailable */
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [functional, setFunctional] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    if (!existing) {
      setVisible(true)
    } else {
      setFunctional(existing.functional)
      setAnalytics(existing.analytics)
      setMarketing(existing.marketing)
    }
    const openHandler = () => {
      const e = readConsent()
      if (e) {
        setFunctional(e.functional)
        setAnalytics(e.analytics)
        setMarketing(e.marketing)
      }
      setShowPrefs(true)
      setVisible(true)
    }
    window.addEventListener('bam:open-cookie-prefs', openHandler)
    return () => window.removeEventListener('bam:open-cookie-prefs', openHandler)
  }, [])

  function save(c: Omit<Consent, 'necessary' | 'version' | 'timestamp'>) {
    const consent: Consent = {
      necessary: true,
      functional: c.functional,
      analytics: c.analytics,
      marketing: c.marketing,
      version: POLICY_VERSION,
      timestamp: new Date().toISOString(),
    }
    writeConsent(consent)
    setVisible(false)
    setShowPrefs(false)
  }

  function acceptAll() {
    save({ functional: true, analytics: true, marketing: true })
  }
  function rejectAll() {
    save({ functional: false, analytics: false, marketing: false })
  }
  function savePrefs() {
    save({ functional, analytics, marketing })
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0c1018]/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6">
        {!showPrefs ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-sm text-white/70 leading-relaxed">
              <p className="font-semibold text-white mb-1">We use cookies</p>
              <p className="text-xs text-white/55">
                We use strictly necessary cookies to run Beyond A Medium and, with your consent, optional cookies to improve the
                product. We do not sell your personal information. See our{' '}
                <Link href="/cookies" className="text-cyan-400 hover:text-cyan-300 underline">Cookie Policy</Link> and{' '}
                <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</Link>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap shrink-0">
              <button
                type="button"
                onClick={() => setShowPrefs(true)}
                className="px-3 py-2 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-white/10 hover:border-white/20"
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="px-3 py-2 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-white/10 hover:border-white/20"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-white">Cookie preferences</p>
              <p className="text-xs text-white/55 mt-1">
                Choose which categories of cookies you allow. Strictly necessary cookies are always on. Read more in our{' '}
                <Link href="/cookies" className="text-cyan-400 hover:text-cyan-300 underline">Cookie Policy</Link>.
              </p>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start justify-between gap-4 rounded-lg border border-white/10 p-3">
                <div>
                  <p className="font-medium text-white">Strictly necessary</p>
                  <p className="text-white/50">Required for sign-in, checkout, security. Always active.</p>
                </div>
                <span className="text-cyan-400 font-mono text-[10px] mt-1">ALWAYS ON</span>
              </li>
              <li className="flex items-start justify-between gap-4 rounded-lg border border-white/10 p-3">
                <div>
                  <p className="font-medium text-white">Functional</p>
                  <p className="text-white/50">Remember editor and UI preferences.</p>
                </div>
                <input
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  aria-label="Functional cookies"
                  className="mt-1 h-4 w-4 accent-cyan-500"
                />
              </li>
              <li className="flex items-start justify-between gap-4 rounded-lg border border-white/10 p-3">
                <div>
                  <p className="font-medium text-white">Analytics</p>
                  <p className="text-white/50">Help us understand usage and improve the product.</p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  aria-label="Analytics cookies"
                  className="mt-1 h-4 w-4 accent-cyan-500"
                />
              </li>
              <li className="flex items-start justify-between gap-4 rounded-lg border border-white/10 p-3">
                <div>
                  <p className="font-medium text-white">Marketing</p>
                  <p className="text-white/50">Not currently used. Will request consent before activation.</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  aria-label="Marketing cookies"
                  className="mt-1 h-4 w-4 accent-cyan-500"
                />
              </li>
            </ul>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={rejectAll}
                className="px-3 py-2 text-xs font-medium text-white/70 hover:text-white rounded-lg border border-white/10 hover:border-white/20"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={savePrefs}
                className="px-3 py-2 text-xs font-medium text-white/80 rounded-lg border border-white/20 hover:border-white/30"
              >
                Save preferences
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110"
              >
                Accept all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
