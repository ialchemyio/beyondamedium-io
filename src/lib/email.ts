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
// Table layout + inline styles only: Gmail, Outlook and Apple Mail all render it.
// Keep in sync with supabase/email-templates/confirm-signup.html.
const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`
const LOGO = `${SITE}/brand/bam-lockup.png`

function wrap(title: string, body: string, preheader = ''): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:${FONT};color:#0b1220">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td bgcolor="#05070c" style="background:#05070c;border-radius:16px 16px 0 0;padding:26px 32px">
          <a href="${SITE}" style="text-decoration:none"><img src="${LOGO}" width="168" height="38" alt="BAM | Beyond A Medium" style="display:block;border:0;color:#ffffff;font-size:16px;font-weight:700"></a>
        </td></tr>
        <tr><td bgcolor="#1f8fff" style="height:3px;line-height:3px;font-size:0;background:#1f8fff;background-image:linear-gradient(90deg,#0a5bd8,#1f8fff,#8ec5ff)">&nbsp;</td></tr>
        <tr><td bgcolor="#ffffff" style="background:#ffffff;border:1px solid #e3e8ef;border-top:0;border-radius:0 0 16px 16px;padding:36px 32px">
          <h1 style="font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;margin:0 0 14px;color:#0b1220">${title}</h1>
          ${body}
        </td></tr>
        <tr><td align="center" style="padding:24px 16px 0;font-size:12px;line-height:1.7;color:#8a94a6">
          Beyond A Medium · <a href="${SITE}" style="color:#1268da;text-decoration:none">beyondamedium.io</a><br>
          You're receiving this because you have an account with us.
          Manage billing in your <a href="${SITE}/dashboard/billing" style="color:#1268da;text-decoration:none">dashboard</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

const P = 'font-size:15px;line-height:1.65;color:#334155;margin:0'

function button(href: string, label: string, color = '#1570e0'): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px"><tr>
    <td bgcolor="${color}" style="border-radius:10px;background:${color}">
      <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">${label}</a>
    </td></tr></table>`
}

function rows(items: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-top:1px solid #e3e8ef;font-size:14px;color:#334155">
    ${items.map(([k, v]) => `<tr><td style="padding:12px 0;border-bottom:1px solid #e3e8ef;color:#64748b">${k}</td><td align="right" style="padding:12px 0;border-bottom:1px solid #e3e8ef;font-weight:600;color:#0b1220">${v}</td></tr>`).join('')}
  </table>`
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

// ── Templates ───────────────────────────────────────────────────
export function welcomeEmail(): { subject: string; html: string } {
  return {
    subject: 'Welcome to Beyond A Medium',
    html: wrap('Welcome to BAM', `
      <p style="${P}">
        Your account is ready. Describe the site you want and the AI builds it. Then you refine it
        on the canvas and publish in one click.
      </p>
      ${button(`${SITE}/dashboard`, 'Start building')}`,
      'Your account is ready. Describe a site and the AI builds it.'),
  }
}

export function subscriptionReceiptEmail(plan: string, amountCents: number): { subject: string; html: string } {
  const nice = plan.charAt(0).toUpperCase() + plan.slice(1)
  return {
    subject: `Your ${nice} subscription is active`,
    html: wrap(`You're on ${nice}`, `
      <p style="${P}">
        Thanks for subscribing. Your plan is active and your monthly AI credits have been added.
      </p>
      ${rows([['Plan', nice], ['Billed', `${money(amountCents)}/mo`]])}
      ${button(`${SITE}/dashboard`, 'Go to your dashboard')}
      <p style="font-size:12px;line-height:1.6;color:#8a94a6;margin:22px 0 0">Auto-renews monthly until cancelled. Cancel anytime from your billing dashboard. See our <a href="${SITE}/refund" style="color:#1268da">refund policy</a>.</p>`,
      `Your ${nice} plan is active.`),
  }
}

export function creditPackReceiptEmail(credits: number, amountCents: number): { subject: string; html: string } {
  return {
    subject: `${credits.toLocaleString()} credits added`,
    html: wrap('Credits added', `
      <p style="${P}">
        Your one-time purchase is complete. <strong>${credits.toLocaleString()} credits</strong> are now in your account.
      </p>
      ${rows([['Credits', credits.toLocaleString()], ['Charged', money(amountCents)]])}
      ${button(`${SITE}/dashboard`, 'Keep building')}`,
      `${credits.toLocaleString()} credits are in your account.`),
  }
}

export function paymentFailedEmail(): { subject: string; html: string } {
  return {
    subject: 'Payment failed — action needed',
    html: wrap('We couldn’t process your payment', `
      <p style="${P}">
        Your latest subscription payment didn’t go through. To keep your plan active, please update your
        payment method.
      </p>
      ${button(`${SITE}/dashboard/billing`, 'Update payment method', '#0b1220')}`,
      'Update your payment method to keep your plan active.'),
  }
}
