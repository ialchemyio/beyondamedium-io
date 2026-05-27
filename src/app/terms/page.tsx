import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Beyond A Medium',
  description: 'The terms and conditions that govern your use of Beyond A Medium.',
}

const EFFECTIVE_DATE = 'May 26, 2026'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#06080d] text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-xs text-cyan-400/70 hover:text-cyan-300 font-mono">&larr; back home</Link>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 mb-2">Terms of Service</h1>
        <p className="text-xs text-white/40 mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="text-sm text-white/70 leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Agreement</h2>
            <p>
              These Terms of Service (&ldquo;<strong>Terms</strong>&rdquo;) are a binding agreement between you and Beyond A Medium
              (&ldquo;BAM,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;) governing your use of the Beyond A Medium platform, websites, and services
              (the &ldquo;Service&rdquo;). By creating an account or using the Service you agree to these Terms and to our
              <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300"> Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Eligibility</h2>
            <p>
              You must be at least 14 years old to use the Service, and at least 18 (or the age of majority in your jurisdiction)
              to enter into a paid subscription. The Service is not directed to children under 14.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Accounts</h2>
            <p>
              You are responsible for safeguarding your credentials and for all activity under your account. Notify us promptly
              of any unauthorized access. We may suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Subscriptions, Credits &amp; Billing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Plans.</strong> Paid plans (Builder, Pro, BAM) renew automatically each month at the then-current price until canceled.</li>
              <li><strong>Auto-renewal.</strong> By subscribing, you authorize us, through Stripe, to charge your payment method on each renewal date until you cancel.</li>
              <li><strong>Cancellation.</strong> You may cancel at any time from your dashboard. Cancellation takes effect at the end of the current billing period; you retain access until then.</li>
              <li><strong>Refunds.</strong> Subscription fees are non-refundable except where required by law. AI credit purchases are non-refundable once credits are issued.</li>
              <li><strong>AI credits.</strong> Credits are a license to use AI features; they have no cash value, are non-transferable, and expire if your subscription ends or if not used within 12 months.</li>
              <li><strong>Price changes.</strong> We may change prices with at least 30 days&rsquo; notice for the next renewal.</li>
              <li><strong>Taxes.</strong> Prices exclude applicable taxes, which we may collect where required.</li>
              <li><strong>Free tier.</strong> The free tier has no credit card requirement; usage limits and watermarking apply.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Violate any law or third-party right (including IP, privacy, and publicity rights).</li>
              <li>Generate or distribute content that is illegal, deceptive, defamatory, harassing, sexually exploitative, or harmful to minors.</li>
              <li>Attempt to reverse engineer, scrape, or interfere with the Service or bypass usage limits.</li>
              <li>Train competing AI models on outputs of the Service.</li>
              <li>Send spam or impersonate any person or entity.</li>
            </ul>
            <p>We may remove content or suspend accounts that violate this section.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Your Content</h2>
            <p>
              You retain ownership of content you upload or create on the Service (&ldquo;Your Content&rdquo;). You grant us a worldwide,
              non-exclusive, royalty-free license to host, process, transmit, and display Your Content solely to operate and
              improve the Service for you. You represent that you have all rights necessary to grant this license.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. AI Features &amp; Disclaimers</h2>
            <p>
              AI-generated outputs (&ldquo;Outputs&rdquo;) are produced by machine-learning models and may be inaccurate, incomplete, biased,
              or offensive. You are solely responsible for reviewing Outputs before relying on, publishing, or distributing them.
              We do not warrant that Outputs are original, non-infringing, or fit for any particular purpose. Do not submit
              prompts containing personal data of others without authorization.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Published Sites</h2>
            <p>
              You are responsible for content you publish through the Service, for complying with applicable laws (including
              consumer-protection, FTC endorsement, advertising, and privacy laws), and for any obligations to your end users
              (including providing your own privacy policy and terms where required).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. Intellectual Property</h2>
            <p>
              The Service, including its software, design, and templates, is owned by BAM and protected by intellectual property
              laws. Except for the limited rights expressly granted to you, all rights are reserved.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Disclaimers</h2>
            <p className="uppercase tracking-wide text-xs text-white/60">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, express or implied,
              including merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee uninterrupted,
              error-free, or secure operation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, BAM will not be liable for any indirect, incidental, special, consequential,
              or punitive damages, or any loss of profits, revenue, data, or goodwill. Our total liability for any claim arising
              out of or related to the Service is limited to the greater of $100 or the amount you paid us in the 12 months before
              the event giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless BAM from claims arising out of Your Content, your use of the
              Service, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Termination</h2>
            <p>
              You may stop using the Service at any time. We may suspend or terminate your access for any violation of these
              Terms or to comply with law. Sections that by their nature should survive termination (ownership, disclaimers,
              limitations of liability, indemnification, dispute resolution) will survive.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">14. Governing Law &amp; Disputes</h2>
            <p>
              These Terms are governed by the laws of the State of California, without regard to conflict-of-law rules. Disputes
              will be resolved exclusively in the state or federal courts located in California, except where prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">15. Changes</h2>
            <p>
              We may update these Terms from time to time. Material changes will be announced by email or in-product notice at
              least 14 days before they take effect. Continued use after the effective date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">16. Contact</h2>
            <p>
              Beyond A Medium &mdash; <a className="text-cyan-400 hover:text-cyan-300" href="mailto:legal@beyondamedium.io">legal@beyondamedium.io</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
