/**
 * Transactional email via Resend's REST API (no SDK dependency).
 * Honest degradation: if RESEND_API_KEY is unset, sends are logged and skipped
 * — never faked. Every send is best-effort and must not break the caller
 * (billing/webhook flows continue even if email fails).
 */

const FROM = process.env.EMAIL_FROM || 'Beyond A Medium <hello@beyondamedium.io>'
const SITE = 'https://beyondamedium.io'

interface SendArgs {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendArgs): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`)
    return { ok: false, skipped: true }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`[email] Resend ${res.status}: ${body}`)
      return { ok: false, error: `resend_${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    console.error('[email] send failed:', e instanceof Error ? e.message : e)
    return { ok: false, error: 'send_failed' }
  }
}

// ── Shared shell ────────────────────────────────────────────────
function wrap(title: string, body: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;margin-bottom:24px">Beyond A Medium</div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px">
      <h1 style="font-size:18px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <p style="font-size:11px;color:#94a3b8;margin-top:20px;line-height:1.6">
      Beyond A Medium · <a href="${SITE}" style="color:#0891b2">beyondamedium.io</a><br/>
      You received this because you have an account with us. Manage billing in your
      <a href="${SITE}/dashboard/billing" style="color:#0891b2">dashboard</a>.
    </p>
  </div></body></html>`
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

// ── Templates ───────────────────────────────────────────────────
export function welcomeEmail(): { subject: string; html: string } {
  return {
    subject: 'Welcome to Beyond A Medium',
    html: wrap('Welcome aboard 👋', `
      <p style="font-size:14px;line-height:1.6;color:#334155">
        Your account is ready. Describe what you want to build, and the AI will generate it — then
        design it on the canvas and ship it in one click.
      </p>
      <a href="${SITE}/dashboard" style="display:inline-block;margin-top:16px;background:linear-gradient(90deg,#06b6d4,#3b82f6);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 20px;border-radius:10px">Start building</a>`),
  }
}

export function subscriptionReceiptEmail(plan: string, amountCents: number): { subject: string; html: string } {
  const nice = plan.charAt(0).toUpperCase() + plan.slice(1)
  return {
    subject: `Your ${nice} subscription is active`,
    html: wrap(`You're on ${nice} 🎉`, `
      <p style="font-size:14px;line-height:1.6;color:#334155">
        Thanks for subscribing. Your plan is active and your monthly AI credits have been added.
      </p>
      <table style="width:100%;font-size:13px;color:#334155;margin-top:12px;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#64748b">Plan</td><td style="text-align:right;font-weight:600">${nice}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Billed</td><td style="text-align:right;font-weight:600">${money(amountCents)}/mo</td></tr>
      </table>
      <p style="font-size:12px;color:#94a3b8;margin-top:16px">Auto-renews monthly until cancelled. Cancel anytime from your billing dashboard. See our <a href="${SITE}/refund" style="color:#0891b2">refund policy</a>.</p>`),
  }
}

export function creditPackReceiptEmail(credits: number, amountCents: number): { subject: string; html: string } {
  return {
    subject: `${credits.toLocaleString()} credits added`,
    html: wrap('Credits added ⚡', `
      <p style="font-size:14px;line-height:1.6;color:#334155">
        Your one-time purchase is complete — <strong>${credits.toLocaleString()} credits</strong> are now in your account.
      </p>
      <table style="width:100%;font-size:13px;color:#334155;margin-top:12px">
        <tr><td style="padding:6px 0;color:#64748b">Credits</td><td style="text-align:right;font-weight:600">${credits.toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Charged</td><td style="text-align:right;font-weight:600">${money(amountCents)}</td></tr>
      </table>`),
  }
}

export function paymentFailedEmail(): { subject: string; html: string } {
  return {
    subject: 'Payment failed — action needed',
    html: wrap('We couldn’t process your payment', `
      <p style="font-size:14px;line-height:1.6;color:#334155">
        Your latest subscription payment didn’t go through. To keep your plan active, please update your
        payment method.
      </p>
      <a href="${SITE}/dashboard/billing" style="display:inline-block;margin-top:16px;background:#0f172a;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 20px;border-radius:10px">Update payment method</a>`),
  }
}
