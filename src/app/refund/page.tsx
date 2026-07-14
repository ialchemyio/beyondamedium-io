import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'How subscriptions, cancellations, and refunds work at Beyond A Medium.',
}

const EFFECTIVE_DATE = 'May 27, 2026'

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#06080d] text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-xs text-cyan-400/70 hover:text-cyan-300 font-mono">&larr; back home</Link>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-xs text-white/40 mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="text-sm text-white/70 leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white">Subscriptions &amp; auto-renewal</h2>
            <p>
              Paid plans (Builder, Pro, BAM) are monthly subscriptions that renew automatically on your billing date until
              you cancel. By subscribing you authorize us, through Stripe, to charge your payment method each period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Cancelling</h2>
            <p>
              You can cancel any time from <Link href="/dashboard/billing" className="text-cyan-400 hover:text-cyan-300">Dashboard → Billing → Manage subscription</Link>,
              which opens the Stripe customer portal. Cancellation takes effect at the end of your current billing period —
              you keep access and your remaining monthly credits until then. We do not prorate partial months.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Refunds</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Subscription fees</strong> are non-refundable once a billing period has started, except where required by law.</li>
              <li><strong>AI credit packs</strong> are non-refundable once the credits have been added to your account, because they are consumable digital goods.</li>
              <li>If you were charged in error or experienced a billing problem, contact us within 30 days and we will investigate and correct genuine errors.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Failed AI generations</h2>
            <p>
              If an AI generation fails on our side, the credits for that action are automatically returned to your balance —
              you are not charged credits for failed generations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Chargebacks</h2>
            <p>
              Please contact us before initiating a chargeback — we can usually resolve billing issues faster directly.
              Accounts with unresolved chargebacks may be suspended.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p>
              Billing questions: <a className="text-cyan-400 hover:text-cyan-300" href="mailto:billing@beyondamedium.io">billing@beyondamedium.io</a>.
              See also our <Link href="/terms" className="text-cyan-400 hover:text-cyan-300">Terms of Service</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
