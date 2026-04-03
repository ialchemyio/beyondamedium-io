import {
  Sparkles, Layout, Code2, Palette, Globe, Users,
  ArrowRight, Check, Zap, MousePointerClick, Rocket,
} from 'lucide-react'
import Link from 'next/link'

const features = [
  { icon: Sparkles, title: 'AI Page Generation', desc: 'Describe what you want — AI builds complete pages with real content, layouts, and styling instantly.' },
  { icon: MousePointerClick, title: 'Visual Drag & Drop', desc: 'Full canvas editor with 50+ elements. Drag, resize, style — no code required.' },
  { icon: Code2, title: 'Code View', desc: 'Switch to HTML/CSS/JS anytime. Import code, paste SQL schemas, full developer control.' },
  { icon: Palette, title: 'Smart Templates', desc: 'Industry-specific starting points for restaurants, fitness, beauty, e-commerce, portfolios, and more.' },
  { icon: Globe, title: 'One-Click Publish', desc: 'Custom domains, SSL certificates, global CDN. Your site is live in seconds.' },
  { icon: Users, title: 'Real-Time Collaboration', desc: 'Work together with your team. Share preview links. Manage client feedback.' },
]

const steps = [
  { num: '01', icon: Sparkles, title: 'Describe', desc: 'Tell AI what you need or pick a template. Describe your business, style, and goals.' },
  { num: '02', icon: Layout, title: 'Design', desc: 'Drag, drop, and customize every element. Edit visually or switch to code view.' },
  { num: '03', icon: Rocket, title: 'Deploy', desc: 'One click to publish. Custom domain, SSL, and global CDN included.' },
]

const plans = [
  {
    name: 'Free', price: 0, desc: 'Get started building', highlighted: false, cta: 'Start Free',
    features: ['1 project', 'AI generation (10/month)', 'Basic elements', 'BAM subdomain', 'Community support'],
  },
  {
    name: 'Pro', price: 29, desc: 'For serious builders', highlighted: true, cta: 'Get Pro',
    features: ['Unlimited projects', 'Unlimited AI generation', 'All 50+ elements', 'Custom domain', 'Priority support', 'Code export', 'SEO tools'],
  },
  {
    name: 'Agency', price: 79, desc: 'For teams and agencies', highlighted: false, cta: 'Go Agency',
    features: ['Everything in Pro', 'White-label branding', '5 team seats', 'Client billing', 'API access', 'Custom integrations', 'Dedicated support'],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">BAM</span>
            <span className="text-xs text-white/40 hidden sm:inline">Beyond A Medium</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-white/50 hover:text-white/80 hidden md:inline transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-white/50 hover:text-white/80 hidden md:inline transition-colors">Pricing</a>
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-xs font-medium mb-8">
            <Zap className="w-3 h-3" /> Powered by AI
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Build Websites{' '}
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">with AI</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
            Describe your vision. Watch it come to life. Edit with drag-and-drop. Publish in one click.
          </p>
          <div className="max-w-xl mx-auto relative mb-6">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-purple-500/40 transition-colors">
              <input type="text" placeholder="Describe the website you want to build..." className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-white/30 focus:outline-none text-sm" readOnly />
              <Link href="/signup" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0">
                <Sparkles className="w-4 h-4" /> Generate
              </Link>
            </div>
          </div>
          <p className="text-xs text-white/30">No credit card required. Free to start.</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to build</h2>
            <p className="text-white/40 max-w-lg mx-auto">From AI generation to code export — a complete platform for creating professional websites.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <f.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Three steps to launch</h2>
            <p className="text-white/40">From idea to live website in minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/10 flex items-center justify-center mx-auto mb-5">
                  <s.icon className="w-7 h-7 text-purple-400" />
                </div>
                <span className="text-xs font-bold text-purple-400/60 tracking-widest">{s.num}</span>
                <h3 className="text-xl font-semibold mt-1 mb-3">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-white/40">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 flex flex-col ${plan.highlighted ? 'bg-gradient-to-b from-purple-500/10 to-transparent border-2 border-purple-500/30 relative' : 'bg-white/[0.02] border border-white/5'}`}>
                {plan.highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">Most Popular</span>}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-3 mb-1"><span className="text-4xl font-bold">${plan.price}</span><span className="text-white/40 text-sm">/mo</span></div>
                <p className="text-sm text-white/40 mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" /><span className="text-white/60">{f}</span></li>
                  ))}
                </ul>
                <Link href="/signup" className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors block ${plan.highlighted ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'}`}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to build something amazing?</h2>
          <p className="text-white/40 mb-8">Join thousands of creators building with AI. No credit card required.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-lg transition-colors">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">BAM</span>
            <span className="text-xs text-white/30">&copy; 2026 Beyond A Medium. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a>
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
