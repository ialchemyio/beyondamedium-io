import {
  Sparkles, Layout, Code2, Terminal, Globe, Users,
  ArrowRight, Check, Zap, MousePointerClick, Rocket,
  Bot, Cpu, Layers, Wand2, Database, Shield,
} from 'lucide-react'
import Link from 'next/link'

const features = [
  { icon: Wand2, title: 'AI Generation', desc: 'Prompt-to-website in seconds. Describe any page and watch AI build it live with production-ready code.' },
  { icon: MousePointerClick, title: 'Visual Canvas', desc: 'Drag-and-drop editor with 50+ components. Move, resize, style — pixel-perfect control.' },
  { icon: Terminal, title: 'Code Editor', desc: 'Full HTML/CSS/JS access. Import existing code, paste SQL schemas, switch between visual and code.' },
  { icon: Bot, title: 'AI Agents', desc: 'Builder, Designer, SEO, and Copy agents work together to optimize every aspect of your site.' },
  { icon: Database, title: 'Backend Built-In', desc: 'Auth, database, storage, and APIs auto-configured. No separate backend needed.' },
  { icon: Globe, title: 'Instant Deploy', desc: 'One click to production. Custom domains, SSL, global edge network. Zero config.' },
]

const steps = [
  { num: '01', icon: Terminal, title: 'Prompt', desc: 'Tell the AI what you need. A landing page, a full app, an e-commerce store — anything.', color: 'from-cyan-400 to-blue-500' },
  { num: '02', icon: Layers, title: 'Build', desc: 'AI generates the structure. You refine with drag-and-drop or edit the code directly.', color: 'from-blue-500 to-violet-500' },
  { num: '03', icon: Rocket, title: 'Ship', desc: 'Deploy to your domain with one click. SSL, CDN, and monitoring included.', color: 'from-violet-500 to-pink-500' },
]

const plans = [
  {
    name: 'Starter', price: 0, desc: 'Try the magic, free', highlighted: false, cta: 'Start Building Free', badge: null, color: 'border-white/[0.05]',
    features: ['1 project', '50 AI credits / month', '1 free AI Agent build', 'Core components', 'Hosted BAM site (beyondamedium.io/sites/you)', 'Watermark on published sites', 'Community support'],
  },
  {
    name: 'Builder', price: 19, desc: 'For creators getting started', highlighted: false, cta: 'Upgrade to Builder', badge: null, color: 'border-blue-500/20',
    features: ['5 projects', '300 AI credits / month', '8+ AI Agent builds', 'All components', 'Templates marketplace', 'Code export', 'Basic analytics'],
  },
  {
    name: 'Pro', price: 49, desc: 'For builders who ship', highlighted: true, cta: 'Go Pro', badge: 'Most Popular', color: 'border-cyan-500/30',
    features: ['Unlimited projects', '1,500 AI credits / month', '40+ AI Agent builds', 'AI agents (full power)', 'Save & reuse templates', 'Advanced analytics', 'Priority AI processing'],
  },
  {
    name: 'BAM', price: 99, desc: 'We build it for you', highlighted: false, cta: 'Let\u2019s Build Together', badge: 'Done-for-you', color: 'border-amber-500/30', startingAt: true,
    href: 'https://beyondamedium.com/contact',
    features: ['Done-for-you site by BAM team', 'Custom domain + hosting', 'Website launch & maintenance', 'Paid ads management', 'AI marketing & content', 'SEO & website ranking', 'Dedicated account manager', 'Priority support'],
  },
]

const creditPacks = [
  { credits: 100, price: '$10' },
  { credits: 350, price: '$25' },
  { credits: '1,000', price: '$60' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06080d] text-white selection:bg-cyan-500/20">
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#06080d]/80 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Beyond A Medium</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-xs text-white/40 hover:text-white/70 hidden md:inline transition-colors">Features</a>
            <a href="#pricing" className="text-xs text-white/40 hover:text-white/70 hidden md:inline transition-colors">Pricing</a>
            <Link href="/login" className="text-xs text-white/50 hover:text-white transition-colors">Log in</Link>
            <Link href="/signup" className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium rounded-lg hover:brightness-110 transition-all">
              Start Building
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-24 px-6 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/[0.07] via-blue-500/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-cyan-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 right-1/4 w-[200px] h-[200px] bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-300 text-[11px] font-medium mb-8 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI-POWERED WEB BUILDER
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
            <span className="text-white/90">Describe it.</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">Build it. Ship it.</span>
          </h1>

          <p className="text-base sm:text-lg text-white/35 max-w-xl mx-auto mb-10 leading-relaxed font-light">
            The AI operating system for building websites. Prompt to generate. Canvas to design. One click to deploy.
          </p>

          {/* Terminal-style prompt */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-[#0c1018] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <span className="text-[10px] text-white/20 ml-2 font-mono">bam generate</span>
              </div>
              <div className="flex items-stretch sm:items-center flex-col sm:flex-row p-3 gap-2 sm:gap-3">
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-cyan-400/60 text-sm font-mono mr-2 shrink-0">$</span>
                  <input
                    type="text"
                    placeholder="Create a landing page for a SaaS product..."
                    className="w-full min-w-0 bg-transparent text-sm text-white/70 placeholder:text-white/20 focus:outline-none font-mono truncate"
                    readOnly
                  />
                </div>
                <Link href="/signup" className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" /> Run
                </Link>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-white/20 font-mono">free to start &middot; no credit card</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] text-cyan-400/60 font-mono tracking-widest uppercase mb-3 block">Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything. One platform.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {features.map((f) => (
              <div key={f.title} className="bg-[#06080d] p-6 hover:bg-[#0a0e16] transition-colors group">
                <f.icon className="w-5 h-5 text-cyan-400/70 mb-4 group-hover:text-cyan-300 transition-colors" />
                <h3 className="font-semibold text-white/90 text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-white/30 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] text-cyan-400/60 font-mono tracking-widest uppercase mb-3 block">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Idea to production in minutes</h2>
          </div>

          <div className="space-y-6">
            {steps.map((s) => (
              <div key={s.num} className="flex items-start gap-6 bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6 hover:border-white/[0.08] transition-colors">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0 opacity-80`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-mono text-white/20">{s.num}</span>
                    <h3 className="text-lg font-semibold text-white/90">{s.title}</h3>
                  </div>
                  <p className="text-sm text-white/30 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] text-cyan-400/60 font-mono tracking-widest uppercase mb-3 block">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Build. Launch. Get Paid.</h2>
            <p className="text-white/30 mt-3 max-w-lg mx-auto text-sm">Everything you need to turn ideas into live, revenue-generating websites.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 flex flex-col relative ${
                  plan.name === 'BAM'
                    ? 'bg-gradient-to-b from-amber-500/[0.08] to-orange-500/[0.03] border ' + plan.color
                    : plan.highlighted
                    ? 'bg-gradient-to-b from-cyan-500/[0.08] to-blue-500/[0.03] border ' + plan.color
                    : 'bg-white/[0.02] border ' + plan.color
                }`}
              >
                {plan.badge && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 text-white text-[9px] font-bold rounded-full tracking-wide whitespace-nowrap ${
                    plan.name === 'BAM' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}>
                    {plan.badge}
                  </span>
                )}
                <h3 className={`text-sm font-semibold ${plan.name === 'BAM' ? 'text-amber-300/80' : 'text-white/70'}`}>{plan.name}</h3>
                <div className="mt-2 mb-1">
                  {'startingAt' in plan && plan.startingAt && <span className="text-[10px] text-amber-400/60 font-medium block mb-0.5">Starting at</span>}
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-white/25 text-xs">/mo</span>
                </div>
                <p className="text-[11px] text-white/25 mb-5">{plan.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[11px]">
                      <Check className={`w-3 h-3 mt-0.5 shrink-0 ${plan.name === 'BAM' ? 'text-amber-400/70' : 'text-cyan-400/70'}`} />
                      <span className="text-white/40">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={'href' in plan && plan.href ? plan.href as string : '/signup'}
                  target={'href' in plan && plan.href ? '_blank' : undefined}
                  rel={'href' in plan && plan.href ? 'noopener noreferrer' : undefined}
                  className={`w-full text-center py-2.5 rounded-xl text-xs font-semibold transition-all block ${
                    plan.name === 'BAM'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110'
                      : plan.highlighted
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:brightness-110'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Credit Packs */}
          <div className="mt-10 text-center">
            <p className="text-xs text-white/30 mb-4">Need more AI? Buy credits anytime.</p>
            <div className="flex items-center justify-center gap-3">
              {creditPacks.map((pack) => (
                <div key={pack.credits} className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-3 text-center hover:border-white/[0.1] transition-colors">
                  <p className="text-sm font-bold text-white">{pack.credits} credits</p>
                  <p className="text-[11px] text-cyan-400 font-mono">{pack.price}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-white/15 mt-4 font-mono">AI credits power generation, editing, and automation. No hidden limits.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.05] via-blue-500/[0.05] to-violet-500/[0.05] rounded-3xl blur-2xl pointer-events-none" />
          <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-12">
            <Shield className="w-8 h-8 text-cyan-400/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Start building now</h2>
            <p className="text-sm text-white/30 mb-8">Free forever. No credit card. Deploy in minutes.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:brightness-110 transition-all">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Cpu className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] text-white/20 font-mono">&copy; 2026 Beyond A Medium</span>
          </div>
          <div className="flex items-center gap-5 text-[11px] text-white/20 font-mono">
            <a href="#features" className="hover:text-white/40 transition-colors">features</a>
            <a href="#pricing" className="hover:text-white/40 transition-colors">pricing</a>
            <a href="#" className="hover:text-white/40 transition-colors">docs</a>
            <a href="#" className="hover:text-white/40 transition-colors">privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
