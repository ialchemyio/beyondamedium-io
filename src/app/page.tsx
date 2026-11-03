import {
  Sparkles, Wand2, MousePointerClick, PenLine, Search, Palette, ArrowRight, Check,
  Code2, ImageIcon, Monitor, Tablet, Smartphone, Layers, Rocket, Type, Square,
  LayoutGrid, FormInput, ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'
import { DESIGN_DIRECTIONS } from '@/lib/beyond-design'
import { CREDIT_COSTS } from '@/lib/credit-costs'
import DirectionPreview from '@/components/DirectionPreview'

const plans = [
  {
    name: 'Starter', price: 0, desc: 'Try it free', highlighted: false, cta: 'Start free',
    features: ['1 project', '50 AI credits / month', '1 full AI site build', 'Every builder feature, including AI SEO', 'Publish to beyondamedium.io/p/your-site', 'BAM badge on published sites'],
  },
  {
    name: 'Builder', price: 19, desc: 'For creators getting started', highlighted: false, cta: 'Choose Builder',
    features: ['5 projects', '300 AI credits / month', '8 full AI site builds', 'BAM badge removed', 'Credit packs for extra AI'],
  },
  {
    name: 'Pro', price: 49, desc: 'For builders who ship', highlighted: true, badge: 'Most popular', cta: 'Go Pro',
    features: ['Unlimited projects', '1,500 AI credits / month', '42 full AI site builds', 'BAM badge removed', 'Credit packs for extra AI'],
  },
  {
    name: 'BAM', price: 99, desc: 'We build it for you', highlighted: false, badge: 'Done for you', cta: 'Talk to the team', startingAt: true,
    href: 'https://beyondamedium.com/contact',
    features: ['Site designed by the BAM team', 'Launch + ongoing maintenance', 'Custom domain setup', 'SEO and content support', 'A person to call'],
  },
]

const creditPacks = [
  { credits: '100', price: '$10' },
  { credits: '350', price: '$25' },
  { credits: '1,000', price: '$60' },
]

const faqs = [
  {
    q: 'What does a credit buy?',
    a: `Credits pay for AI work. Editing a selected element costs ${CREDIT_COSTS.edit_element}, a new section ${CREDIT_COSTS.generate_section}, a full page ${CREDIT_COSTS.generate_page}, and a complete multi-page site from the wizard ${CREDIT_COSTS.agent_build}. If a generation fails, the credits go back to your balance.`,
  },
  {
    q: 'Will the AI make up reviews, prices, or stats about my business?',
    a: 'No. BEYOND DESIGN is told to use only the facts you give it. Where a testimonial, price, or award belongs and you have not supplied one, it leaves a clearly marked placeholder for you to fill in.',
  },
  {
    q: 'Can I edit the code?',
    a: 'Yes. Switch the editor to code view to edit the HTML and CSS directly, then switch back to the visual canvas.',
  },
  {
    q: 'Where does my site live?',
    a: 'Publishing puts your site at beyondamedium.io/p/your-site instantly. If you want it on your own domain, the BAM team sets that up for you.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Plans renew monthly until you cancel, and you can cancel or change plans yourself from Billing in your dashboard.',
  },
  {
    q: 'Who owns what I build?',
    a: 'You do. Your content and your sites are yours, as set out in our Terms of Service.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://beyondamedium.io/#org',
      name: 'Beyond A Medium',
      url: 'https://beyondamedium.io',
      description: 'AI website builder: answer a few questions, get a studio-grade multi-page site, edit visually, publish.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://beyondamedium.io/#website',
      url: 'https://beyondamedium.io',
      name: 'Beyond A Medium',
      publisher: { '@id': 'https://beyondamedium.io/#org' },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Beyond A Medium',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      offers: [
        { '@type': 'Offer', name: 'Starter', price: '0', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Builder', price: '19', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Pro', price: '49', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'BAM', price: '99', priceCurrency: 'USD' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Beyond A Medium home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/bam-lockup.png" alt="BAM | Beyond A Medium" width={564} height={129} className="hidden lg:block h-9 w-auto" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/bam-mark.png" alt="BAM" width={397} height={168} className="lg:hidden h-8 w-auto" />
    </Link>
  )
}

/** Decorative 3D editor mockup for the hero. Pure HTML/CSS, hidden from assistive tech. */
function EditorMockup() {
  const blocks = [
    { icon: Type, label: 'Text' }, { icon: ImageIcon, label: 'Image' }, { icon: Square, label: 'Button' },
    { icon: Layers, label: 'Section' }, { icon: LayoutGrid, label: 'Grid' }, { icon: FormInput, label: 'Form' },
  ]
  return (
    <div aria-hidden="true" className="relative w-full max-w-[760px] mx-auto lg:mx-0">
      <div className="absolute -inset-10 bg-[radial-gradient(closest-side,rgba(31,143,255,0.35),transparent)] blur-2xl" />
      <div className="bam-tilt relative rounded-2xl border border-white/10 bg-[#0b0e16] shadow-[0_40px_120px_-30px_rgba(31,143,255,0.55)] overflow-hidden">
        {/* toolbar */}
        <div className="flex items-center justify-between px-4 h-11 border-b border-white/[0.07] bg-[#0e121b]">
          <div className="flex items-center gap-3">
            <span className="flex gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-white/15" /><i className="w-2.5 h-2.5 rounded-full bg-white/15" /><i className="w-2.5 h-2.5 rounded-full bg-white/15" /></span>
            <span className="text-[11px] text-white/60 font-medium">Home</span>
          </div>
          <div className="flex items-center gap-1 text-white/50">
            <Monitor className="w-3.5 h-3.5 text-[#4aa8ff]" /><Tablet className="w-3.5 h-3.5" /><Smartphone className="w-3.5 h-3.5" />
          </div>
          <span className="bam-pill text-[11px] px-3 py-1">Publish</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_130px] min-h-[300px] sm:min-h-[340px]">
          {/* blocks */}
          <div className="hidden sm:block border-r border-white/[0.07] p-2.5 space-y-2">
            <div className="h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center px-2 text-[10px] text-white/60">Search blocks</div>
            <div className="grid grid-cols-2 gap-1.5">
              {blocks.map(b => (
                <div key={b.label} className="rounded-md border border-white/[0.07] bg-white/[0.03] py-2 flex flex-col items-center gap-1">
                  <b.icon className="w-3.5 h-3.5 text-white/55" />
                  <span className="text-[9px] text-white/50">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* canvas */}
          <div className="p-4 bg-[#f6f2ec]">
            <div className="rounded-lg bg-[#faf7f2] h-full p-4 border border-[#e7dfd3]">
              <div className="flex items-center justify-between mb-5">
                <span className="font-serif text-[12px] text-[#1a1815] font-semibold">Harbor &amp; Vine</span>
                <span className="flex gap-2 text-[8px] text-[#7a736a]"><span>Menu</span><span>Visit</span><span>Book</span></span>
              </div>
              <p className="text-[8px] tracking-[0.18em] uppercase text-[#a8431f] mb-2">Seasonal kitchen</p>
              <p className="font-serif text-[22px] leading-[1.05] text-[#1a1815] mb-3">
                Dinners that follow <span className="bam-selected px-0.5">the harvest</span>.
              </p>
              <div className="space-y-1.5 mb-4">
                <div className="h-1.5 w-[85%] rounded bg-[#1a1815]/15" />
                <div className="h-1.5 w-[70%] rounded bg-[#1a1815]/15" />
              </div>
              <span className="inline-block text-[8px] text-white bg-[#c2532f] rounded px-2.5 py-1.5">Reserve a table</span>
              <div className="grid grid-cols-3 gap-2 mt-5">
                {[0, 1, 2].map(i => <div key={i} className="aspect-[4/3] rounded bg-gradient-to-br from-[#e9dfd0] to-[#d9cbb6]" />)}
              </div>
            </div>
          </div>
          {/* styles */}
          <div className="hidden sm:block border-l border-white/[0.07] p-2.5 space-y-3">
            <p className="text-[9px] uppercase tracking-wider text-white/45">Typography</p>
            <div className="h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center px-2 text-[10px] text-white/60">Playfair Display</div>
            <p className="text-[9px] uppercase tracking-wider text-white/45">Colors</p>
            <div className="flex gap-1.5">
              {['#faf7f2', '#c2532f', '#1a1815', '#5b5b3f'].map(c => <i key={c} className="w-4 h-4 rounded-full border border-white/15" style={{ background: c }} />)}
            </div>
            <p className="text-[9px] uppercase tracking-wider text-white/45">Radius</p>
            <div className="h-1 rounded bg-white/10"><div className="h-1 w-1/4 rounded bg-[#4aa8ff]" /></div>
          </div>
        </div>
      </div>
      {/* floating AI chip */}
      <div className="bam-float absolute -bottom-4 left-4 sm:left-10 bam-glass rounded-full pl-2 pr-4 py-2 flex items-center gap-2 shadow-xl">
        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4aa8ff] to-[#8b5cf6] flex items-center justify-center"><Sparkles className="w-3 h-3 text-white" /></span>
        <span className="text-[11px] text-white/80">BEYOND DESIGN is writing your About page</span>
      </div>
    </div>
  )
}

/** Small UI vignettes that sit at the top of each feature card. Decorative. */
function FeatureArt({ kind }: { kind: string }) {
  if (kind === 'wizard') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map(n => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= 3 ? 'bg-[#4aa8ff]' : 'bg-white/10'}`} />)}
        </div>
        <p className="text-[12px] text-white/80">What kind of business is it?</p>
        <div className="flex flex-wrap gap-1.5">
          {['Restaurant', 'Salon', 'Studio', 'Contractor'].map((t, i) => (
            <span key={t} className={`text-[11px] px-2.5 py-1 rounded-full border ${i === 0 ? 'border-[#4aa8ff] bg-[#1f8fff]/15 text-white' : 'border-white/10 text-white/55'}`}>{t}</span>
          ))}
        </div>
      </div>
    )
  }
  if (kind === 'canvas') {
    return (
      <div className="relative h-[88px]">
        <div className="absolute left-2 top-2 w-24 h-16 rounded-lg border border-white/10 bg-white/[0.04] flex flex-col items-center justify-center gap-1">
          <Type className="w-5 h-5 text-white/70" /><span className="text-[11px] text-white/60">Text</span>
        </div>
        <div className="absolute right-4 bottom-1 w-36 h-14 rounded-lg border-2 border-dashed border-[#4aa8ff]/70 bg-[#1f8fff]/10" />
        <MousePointerClick className="absolute left-[118px] top-[44px] w-5 h-5 text-[#4aa8ff] drop-shadow" />
      </div>
    )
  }
  if (kind === 'copy') {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white/75 leading-snug">
          We make really good bread every single day for everyone.
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Shorter', 'Persuasive', 'Friendlier'].map((t, i) => (
            <span key={t} className={`text-[11px] px-2.5 py-1 rounded-full ${i === 1 ? 'bam-pill' : 'border border-white/10 text-white/55'}`}>{t}</span>
          ))}
        </div>
      </div>
    )
  }
  if (kind === 'seo') {
    return (
      <div className="rounded-lg bg-white px-3 py-2.5 shadow-lg">
        <p className="text-[12px] text-[#4d5156]">beyondamedium.io › p › harbor-vine</p>
        <p className="text-[14px] text-[#1a0dab] leading-tight">Harbor &amp; Vine | Seasonal Dinners in Ventura</p>
        <p className="text-[12px] text-[#4d5156] leading-snug mt-0.5">A seasonal kitchen serving dinners built around what the harvest brings in…</p>
      </div>
    )
  }
  if (kind === 'directions') {
    return (
      <div className="relative h-[88px]">
        {[
          { bg: '#FAF7F2', fg: '#1A1815', f: 'Georgia, serif', rot: '-8deg', x: '0px' },
          { bg: '#0A0A0B', fg: '#C9A96A', f: 'system-ui', rot: '0deg', x: '70px' },
          { bg: '#F2F2F2', fg: '#000', f: 'ui-monospace, monospace', rot: '8deg', x: '140px' },
        ].map((c, i) => (
          <div key={i} className="absolute top-2 w-24 h-[72px] rounded-lg border border-white/10 shadow-xl flex items-center justify-center" style={{ background: c.bg, transform: `rotate(${c.rot})`, left: c.x }}>
            <span style={{ color: c.fg, fontFamily: c.f }} className="text-[20px] font-bold">Aa</span>
          </div>
        ))}
      </div>
    )
  }
  // theme
  return (
    <div className="flex items-center gap-4">
      <span className="font-display text-[44px] leading-none font-bold text-white">Aa</span>
      <div className="space-y-2">
        <div className="flex gap-1.5">{['#1f8fff', '#8b5cf6', '#f5f5f4', '#0b0d14'].map(c => <i key={c} className="w-5 h-5 rounded-full border border-white/15" style={{ background: c }} />)}</div>
        <div className="h-1.5 w-28 rounded bg-white/10"><div className="h-1.5 w-2/3 rounded bg-[#4aa8ff]" /></div>
      </div>
    </div>
  )
}

const features = [
  { kind: 'wizard', icon: Wand2, title: 'AI site wizard', desc: 'Answer a few questions about your business. BEYOND DESIGN plans and writes every page from your real details.' },
  { kind: 'canvas', icon: MousePointerClick, title: 'Drag & drop canvas', desc: 'Move, resize, and restyle anything on a visual canvas, with desktop, tablet, and mobile previews.' },
  { kind: 'copy', icon: PenLine, title: 'AI copywriting', desc: 'Select any text and make it shorter, more persuasive, or friendlier in one click.' },
  { kind: 'seo', icon: Search, title: 'One-click AI SEO', desc: 'Write titles and meta descriptions for every page at once. Edit any of them before you publish.' },
  { kind: 'directions', icon: Sparkles, title: 'BEYOND DESIGN directions', desc: 'Eight distinct design directions, from magazine editorial to luxe dark. Pick one, or let the AI choose.' },
  { kind: 'theme', icon: Palette, title: 'Site-wide themes', desc: 'Change fonts, colors, and corner radius once, and every page of your site follows.' },
]

const extras = [
  { icon: ImageIcon, label: 'Image uploads & asset library' },
  { icon: Code2, label: 'HTML & CSS code view' },
  { icon: Wand2, label: 'Polish any page with AI' },
  { icon: Layers, label: 'Multi-page manager' },
  { icon: Rocket, label: 'Instant publishing' },
  { icon: Check, label: 'Autosave' },
]

const steps = [
  { n: '1', title: 'Tell us about the business', desc: 'Name, what you offer, who it is for, and the pages you need. Real details in, so no made-up facts come out.' },
  { n: '2', title: 'Pick a design direction', desc: 'Choose one of eight BEYOND DESIGN directions, or let the AI pick the one that fits.' },
  { n: '3', title: 'BEYOND DESIGN builds the site', desc: 'Every page is designed, written, and laid out in about a minute, with the same look across all of them.' },
  { n: '4', title: 'Refine and publish', desc: 'Edit on the canvas, rewrite copy with AI, generate SEO for every page, and publish.' },
]

const replaces = [
  { role: 'Designer', does: 'Eight studio-grade design directions and a site-wide theme editor' },
  { role: 'Developer', does: 'Responsive pages, hosting, and instant publishing, with code access when you want it' },
  { role: 'Copywriter', does: 'Page copy written from your details, plus one-click rewrites' },
  { role: 'SEO tool', does: 'Titles and meta descriptions generated for every page at once' },
]

export default function LandingPage() {
  const directions = DESIGN_DIRECTIONS.filter(d => d.key !== 'auto')

  return (
    <div className="min-h-screen bg-[#05060a] text-white selection:bg-[#1f8fff]/30 overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#05060a]/75 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-7 text-[14px] text-white/65">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#directions" className="hover:text-white transition-colors">Designs</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link href="/login" className="text-[14px] text-white/70 hover:text-white transition-colors">Log in</Link>
            <Link href="/signup" className="bam-pill text-[14px] px-4 sm:px-5 py-2">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 pb-24 sm:pb-32 px-5 sm:px-8">
        <div className="absolute inset-0 bam-grid-bg [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)] pointer-events-none" />
        <div className="absolute -top-40 right-[-10%] w-[900px] h-[700px] bg-[radial-gradient(closest-side,rgba(31,143,255,0.22),transparent)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-16 lg:gap-10 items-center">
          <div>
            <p className="text-[15px] text-white/65 mb-5">Describe it. Design it. Ship it.</p>
            <h1 className="font-display text-[44px] sm:text-[60px] lg:text-[68px] leading-[1.04] font-bold">
              Websites that look like a{' '}
              <span className="bam-selected bam-grad-text px-1">studio</span>{' '}
              built them.
            </h1>
            <p className="mt-6 text-[17px] sm:text-[19px] leading-relaxed text-white/70 max-w-xl">
              Answer a few questions about your business. BEYOND DESIGN writes and designs every page,
              then you refine it on a drag-and-drop canvas and publish.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="bam-pill text-[15px] px-7 py-3.5">
                Build my site free <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how" className="bam-pill-ghost text-[15px] px-6 py-3.5">See how it works</a>
            </div>
            <p className="mt-5 text-[13px] text-white/60">Free plan · No credit card · Publish in minutes</p>
          </div>
          <EditorMockup />
        </div>
      </section>

      {/* Pillar strip */}
      <div className="relative border-y border-white/[0.06] bg-[#080a10]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 font-display text-[13px] sm:text-[14px] font-semibold tracking-[0.12em] uppercase text-white/75">
          {['Drag & Drop', 'No-Code', 'AI-Designed', 'Hosted'].map((p, i) => (
            <span key={p} className="flex items-center gap-6">
              {i > 0 && <Sparkles className="w-3.5 h-3.5 text-[#4aa8ff]" aria-hidden="true" />}
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 sm:py-32 px-5 sm:px-8 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-14">
            <h2 className="font-display text-[34px] sm:text-[48px] leading-[1.08] font-bold">
              <span className="bam-grad-text">One builder.</span> Designer, writer, and SEO included.
            </h2>
            <p className="mt-5 text-[17px] text-white/65 leading-relaxed">
              Everything you need to go from an idea to a live, good-looking site, without hiring four people to do it.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => (
              <article key={f.title} className="bam-glow-card p-6 sm:p-7 flex flex-col">
                <div className="min-h-[104px] mb-6"><FeatureArt kind={f.kind} /></div>
                <div className="mt-auto">
                  <h3 className="font-display text-[20px] font-semibold flex items-center gap-2">
                    <f.icon className="w-4.5 h-4.5 text-[#4aa8ff]" aria-hidden="true" /> {f.title}
                  </h3>
                  <p className="mt-2 text-[15px] text-white/62 leading-relaxed">{f.desc}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {extras.map(e => (
              <div key={e.label} className="bam-glass rounded-xl px-4 py-3 flex items-center gap-2.5">
                <e.icon className="w-4 h-4 text-[#4aa8ff] shrink-0" aria-hidden="true" />
                <span className="text-[13px] text-white/75">{e.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link href="/signup" className="bam-pill text-[15px] px-7 py-3">Start building <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      {/* Replace the stack */}
      <section className="relative py-24 sm:py-32 px-5 sm:px-8 bg-gradient-to-b from-[#05060a] via-[#06112a] to-[#05060a]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="font-display text-[34px] sm:text-[48px] leading-[1.08] font-bold">
              Stop stitching together a website <span className="bam-grad-text">from four freelancers.</span>
            </h2>
            <p className="mt-5 text-[17px] text-white/68 leading-relaxed max-w-lg">
              Most small businesses put off a website because it means finding a designer, a developer,
              a copywriter, and someone for SEO, then managing all of them. BAM does those jobs in one place.
            </p>
            <Link href="/signup" className="bam-pill mt-8 text-[15px] px-7 py-3">Build my site <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="bam-glass rounded-3xl p-3 sm:p-4">
            {replaces.map((r, i) => (
              <div key={r.role} className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl ${i === 0 ? 'bg-white/[0.04]' : ''}`}>
                <span className="mt-0.5 w-8 h-8 rounded-full bg-[#1f8fff]/15 border border-[#1f8fff]/40 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-[#6db8ff]" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13px] uppercase tracking-[0.12em] text-white/50">Instead of a {r.role.toLowerCase()}</p>
                  <p className="text-[16px] text-white/90 mt-1">{r.does}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 sm:py-32 px-5 sm:px-8 scroll-mt-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-14">
          <div className="lg:sticky lg:top-28 self-start">
            <h2 className="font-display text-[34px] sm:text-[48px] leading-[1.08] font-bold">
              From a few answers <span className="bam-grad-text">to a live site.</span>
            </h2>
            <p className="mt-5 text-[17px] text-white/65 leading-relaxed max-w-md">
              No blank page and no template hunting. The wizard asks what it needs, then gets out of the way.
            </p>
          </div>
          <ol className="space-y-3">
            {steps.map(s => (
              <li key={s.n} className="flex gap-6 p-6 sm:p-7 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <span className="font-display text-[48px] leading-none font-bold bam-grad-text w-10 shrink-0">{s.n}</span>
                <div>
                  <h3 className="font-display text-[20px] font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[15px] text-white/62 leading-relaxed">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Design directions */}
      <section id="directions" className="relative py-24 sm:py-32 px-5 sm:px-8 scroll-mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060a] via-[#0a3a8a] to-[#05060a] opacity-70 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 items-end mb-14">
            <h2 className="font-display text-[34px] sm:text-[48px] leading-[1.08] font-bold">
              {directions.length} directions. None of them look like a template.
            </h2>
            <p className="text-[17px] text-white/75 leading-relaxed lg:max-w-md lg:justify-self-end">
              Each BEYOND DESIGN direction is a full design brief: type pairing, color system, spacing, and detail.
              These are previews of each direction&rsquo;s look.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {directions.map(d => (
              <div key={d.key} className="group rounded-2xl overflow-hidden border border-white/10 bg-[#0b0d14] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1.5 hover:border-white/25 hover:shadow-[0_30px_80px_-30px_rgba(31,143,255,0.45)]">
                <div className="overflow-hidden">
                  <DirectionPreview dirKey={d.key} className="transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                </div>
                <div className="px-4 py-3 border-t border-white/[0.06]">
                  <p className="font-display text-[15px] font-semibold">{d.name}</p>
                  <p className="text-[13px] text-white/60">{d.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 sm:py-32 px-5 sm:px-8 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-[34px] sm:text-[48px] leading-[1.08] font-bold">Simple plans. <span className="bam-grad-text">Start free.</span></h2>
            <p className="mt-4 text-[17px] text-white/65">Upgrade when you need more sites or more AI. Cancel anytime.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-7 flex flex-col ${plan.highlighted ? 'bam-glow-card border-[#1f8fff]/45' : 'border border-white/[0.07] bg-white/[0.02]'}`}
              >
                {plan.badge && (
                  <span className={`absolute top-5 right-5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${plan.highlighted ? 'bg-[#0a5bd8] text-white' : 'bg-white/10 text-white/80'}`}>{plan.badge}</span>
                )}
                <h3 className="font-display text-[18px] font-semibold">{plan.name}</h3>
                <p className="text-[14px] text-white/55 mt-1">{plan.desc}</p>
                <div className="mt-6 mb-6">
                  {plan.startingAt && <span className="block text-[12px] text-white/55">Starting at</span>}
                  <span className="font-display text-[44px] font-bold leading-none">${plan.price}</span>
                  <span className="text-[14px] text-white/60">/mo</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/75">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#4aa8ff]" aria-hidden="true" /> {f}
                    </li>
                  ))}
                </ul>
                {plan.href ? (
                  <a href={plan.href} target="_blank" rel="noopener noreferrer" className="bam-pill-ghost w-full text-[14px] py-3">{plan.cta}</a>
                ) : (
                  <Link href="/signup" className={`w-full text-[14px] py-3 ${plan.highlighted ? 'bam-pill' : 'bam-pill-ghost'}`}>{plan.cta}</Link>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-[15px] text-white/65 mb-4">Need more AI? Top up with a credit pack anytime.</p>
            <div className="inline-flex flex-wrap justify-center gap-3">
              {creditPacks.map(p => (
                <div key={p.credits} className="bam-glass rounded-2xl px-6 py-3.5 text-center">
                  <p className="font-display text-[17px] font-bold">{p.credits} credits</p>
                  <p className="text-[14px] text-[#6db8ff]">{p.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 sm:py-32 px-5 sm:px-8 scroll-mt-16 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-[34px] sm:text-[48px] leading-[1.08] font-bold text-center mb-12">Questions, answered.</h2>
          <div className="space-y-3">
            {faqs.map(f => (
              <details key={f.q} className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] open:bg-white/[0.04] transition-colors">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 text-[16px] font-medium text-white/90 [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8ec5ff] rounded-2xl">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-white/50 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="px-6 pb-5 text-[15px] text-white/65 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 sm:px-8 pb-28">
        <div className="relative max-w-5xl mx-auto rounded-[2rem] overflow-hidden border border-[#1f8fff]/30 bg-gradient-to-br from-[#0a2a6b] via-[#081a40] to-[#0b0d14] px-8 py-16 sm:py-20 text-center">
          <div className="absolute inset-0 bam-grid-bg opacity-60 pointer-events-none" />
          <div className="relative">
            <h2 className="font-display text-[34px] sm:text-[52px] leading-[1.05] font-bold">Your site is a few answers away.</h2>
            <p className="mt-5 text-[17px] text-white/75 max-w-xl mx-auto">Start free. No credit card. Publish your first site today.</p>
            <Link href="/signup" className="bam-pill mt-9 text-[16px] px-8 py-4">Build my site free <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
