import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Beyond A Medium',
  description:
    'How Beyond A Medium collects, uses, shares, and protects your personal information, and your privacy rights under California and U.S. law.',
}

const EFFECTIVE_DATE = 'May 26, 2026'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#06080d] text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-xs text-cyan-400/70 hover:text-cyan-300 font-mono">&larr; back home</Link>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-6 mb-2">Privacy Policy</h1>
        <p className="text-xs text-white/40 mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-invert max-w-none text-sm text-white/70 leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Overview</h2>
            <p>
              Beyond A Medium (&ldquo;<strong>BAM</strong>,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) provides an AI-powered website
              builder available at beyondamedium.io and related domains (the &ldquo;Service&rdquo;). This Privacy Policy explains
              what information we collect, how we use and share it, and the rights you have. By using the Service, you agree
              to the practices described here. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account information.</strong> Email address, password (hashed), and any profile details you provide.</li>
              <li><strong>Content you create.</strong> Prompts, projects, templates, pages, code, uploaded media, and configuration.</li>
              <li><strong>Billing information.</strong> Plan, subscription status, and limited transaction metadata. Card details are handled by our processor (Stripe) and not stored by us.</li>
              <li><strong>Usage data.</strong> Pages visited, features used, AI credit consumption, errors, device, browser, IP address, and approximate location derived from IP.</li>
              <li><strong>Cookies and similar technologies.</strong> See our <Link href="/cookies" className="text-cyan-400 hover:text-cyan-300">Cookie Policy</Link>.</li>
              <li><strong>Communications.</strong> Messages you send to support and your responses to surveys or emails.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, operate, secure, and improve the Service.</li>
              <li>Process payments, manage subscriptions, and prevent fraud.</li>
              <li>Generate AI outputs you request (prompts are sent to AI providers solely to fulfill your request).</li>
              <li>Communicate service, security, and billing notices (these are not marketing and cannot be opted out of while you have an account).</li>
              <li>Send marketing communications only where you have opted in. You can unsubscribe at any time.</li>
              <li>Comply with legal obligations and enforce our <Link href="/terms" className="text-cyan-400 hover:text-cyan-300">Terms</Link>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Service Providers We Share Data With</h2>
            <p>We share information with vendors that help us operate the Service, under contracts that require confidentiality and limit use to providing services to us:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> &mdash; database, authentication, and storage.</li>
              <li><strong>Stripe</strong> &mdash; payment processing and subscription billing.</li>
              <li><strong>Anthropic</strong> &mdash; AI model inference for generation and agent features.</li>
              <li><strong>Vercel</strong> &mdash; hosting and content delivery.</li>
            </ul>
            <p>We do not sell your personal information. We do not share personal information for cross-context behavioral advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. AI and Your Content</h2>
            <p>
              When you use AI features, prompts and necessary context are sent to our AI provider(s) to generate a response. We
              do not use your private project content to train third-party foundation models. AI outputs may be inaccurate; you
              are responsible for reviewing and validating outputs before relying on them. See our
              <Link href="/terms" className="text-cyan-400 hover:text-cyan-300"> Terms of Service</Link> for the full AI disclaimer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Data Retention</h2>
            <p>
              We keep account and content data while your account is active and for a reasonable period afterward to comply with
              legal obligations, resolve disputes, and enforce agreements. You can request deletion at any time (see Section 8).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Security</h2>
            <p>
              We use encryption in transit (TLS), access controls, and row-level database security to protect your data. No system
              is perfectly secure. Use a strong, unique password and notify us if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Your Privacy Rights</h2>
            <p>Depending on where you live, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal information we hold about you.</li>
              <li>Correct inaccurate information.</li>
              <li>Delete your account and personal information.</li>
              <li>Receive a portable copy of your data.</li>
              <li>Opt out of marketing communications.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p>To exercise any of these rights, email <a className="text-cyan-400 hover:text-cyan-300" href="mailto:privacy@beyondamedium.io">privacy@beyondamedium.io</a> from the address associated with your account. We will respond within 45 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">9. California Residents (CCPA / CPRA)</h2>
            <p>
              If you are a California resident, you have additional rights under the California Consumer Privacy Act, as amended:
              the right to know what personal information we collect, to delete it, to correct it, to limit the use of sensitive
              personal information, and to opt out of sale or sharing.
            </p>
            <p>
              <strong>We do not sell your personal information and we do not share it for cross-context behavioral advertising.</strong>
              If this ever changes, we will provide a clear &ldquo;Do Not Sell or Share My Personal Information&rdquo; link and honor
              opt-out preference signals (such as Global Privacy Control).
            </p>
            <p>You may also designate an authorized agent to make a request on your behalf. We will not discriminate against you for exercising any privacy right.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">10. Children</h2>
            <p>
              The Service is not directed to and is not intended for children under 14. We do not knowingly collect personal
              information from anyone under 14. If you believe a child has provided us information, contact
              <a className="text-cyan-400 hover:text-cyan-300" href="mailto:privacy@beyondamedium.io"> privacy@beyondamedium.io</a> and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">11. International Users</h2>
            <p>
              The Service is operated from the United States. By using it, you consent to the transfer of your information to the
              United States, which may have different data-protection laws than your country.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">12. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or
              in-product notice before they take effect. Continued use after the effective date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">13. Contact</h2>
            <p>
              Beyond A Medium &mdash; <a className="text-cyan-400 hover:text-cyan-300" href="mailto:privacy@beyondamedium.io">privacy@beyondamedium.io</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
