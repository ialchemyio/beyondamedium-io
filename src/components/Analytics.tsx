'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Privacy-first analytics. Only fires when BOTH are true:
 *   1. NEXT_PUBLIC_POSTHOG_KEY is configured, and
 *   2. the visitor granted the "analytics" cookie category.
 * No SDK/dependency — posts directly to PostHog's capture endpoint.
 * Honest no-op otherwise. This is what makes the cookie banner meaningful.
 */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const CONSENT_KEY = 'bam_cookie_consent_v1'
const DID_KEY = 'bam_did'

function analyticsAllowed(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return false
    return JSON.parse(raw)?.analytics === true
  } catch {
    return false
  }
}

function distinctId(): string {
  let id = localStorage.getItem(DID_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() ?? `anon-${Date.now()}-${Math.round(performance.now())}`)
    localStorage.setItem(DID_KEY, id)
  }
  return id
}

function capture(event: string, properties: Record<string, unknown>) {
  if (!KEY || !analyticsAllowed()) return
  try {
    fetch(`${HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        api_key: KEY,
        event,
        distinct_id: distinctId(),
        properties: { ...properties, $current_url: location.href, $host: location.host, $pathname: location.pathname },
      }),
    }).catch(() => {})
  } catch { /* ignore */ }
}

export default function Analytics() {
  const pathname = usePathname()
  const ready = useRef(false)

  // Re-evaluate when consent changes (banner dispatches bam:consent).
  useEffect(() => {
    function onConsent() { if (analyticsAllowed()) capture('$pageview', {}) }
    window.addEventListener('bam:consent', onConsent)
    return () => window.removeEventListener('bam:consent', onConsent)
  }, [])

  // Pageview on load + client navigation.
  useEffect(() => {
    if (!KEY) return
    // Skip the very first duplicate if consent isn't set yet; onConsent handles grant.
    if (!ready.current) { ready.current = true }
    capture('$pageview', {})
  }, [pathname])

  return null
}
