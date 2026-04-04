'use client'

import { useState } from 'react'
import { Crown, Rocket, Globe, Music, Utensils, Briefcase, Star, Check, ArrowRight, Zap, Eye } from 'lucide-react'
import Link from 'next/link'

interface PremiumTemplate {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  icon: React.ReactNode
  gradient: string
  features: string[]
  pages: string[]
  integrations: string[]
  demoUrl: string | null
  status: 'available' | 'coming_soon'
}

const PREMIUM_TEMPLATES: PremiumTemplate[] = [
  {
    id: 'dj-nightlife',
    name: 'DJ / Nightlife',
    tagline: 'Premium booking machine for DJs & entertainers',
    description: 'Full conversion funnel with Cal.com scheduling, Tally booking forms, Stripe tip/song requests, Instagram funnel, review social proof, and scarcity-driven psychology. 100% config-driven — launch a new artist site in minutes.',
    category: 'entertainment',
    icon: <Music className="w-5 h-5" />,
    gradient: 'from-orange-500 to-amber-500',
    features: [
      'Conversion-optimized booking funnel',
      'Cal.com inline scheduling',
      'Tally form integration',
      'Stripe payment links (tips & song requests)',
      'Instagram follower funnel',
      'Review social proof system',
      'Scarcity & reverse psychology copy',
      'Multi-city location pages',
      'SEO-optimized with sitemap & robots',
      'Mobile-first responsive design',
      'Framer Motion animations',
      'Dark premium aesthetic',
    ],
    pages: ['Home', 'Services', 'Media', 'Reviews', 'Availability', 'Book', 'Contact', 'Locations', 'Request a Song', 'Privacy', 'Terms'],
    integrations: ['Cal.com', 'Tally', 'Stripe', 'Instagram', 'YouTube', 'Vercel'],
    demoUrl: 'https://djsammyjay.com',
    status: 'available',
  },
  {
    id: 'restaurant-cafe',
    name: 'Restaurant / Cafe',
    tagline: 'Reservation-ready site for food businesses',
    description: 'Menu showcase, online ordering integration, reservation system, photo gallery, reviews, and location-based SEO. Perfect for restaurants, cafes, food trucks, and catering.',
    category: 'food',
    icon: <Utensils className="w-5 h-5" />,
    gradient: 'from-emerald-500 to-teal-500',
    features: [
      'Menu showcase with categories',
      'Online reservation system',
      'Photo gallery with lightbox',
      'Customer reviews & ratings',
      'Multi-location support',
      'Hours & contact integration',
    ],
    pages: ['Home', 'Menu', 'Gallery', 'Reviews', 'Reservations', 'Contact', 'About'],
    integrations: ['OpenTable', 'Google Maps', 'Yelp', 'Instagram'],
    demoUrl: null,
    status: 'coming_soon',
  },
  {
    id: 'agency-studio',
    name: 'Agency / Studio',
    tagline: 'Client-winning site for creative agencies',
    description: 'Portfolio showcase, case studies, team profiles, services breakdown, and lead capture. Built for agencies, studios, and freelancers who want premium positioning.',
    category: 'business',
    icon: <Briefcase className="w-5 h-5" />,
    gradient: 'from-violet-500 to-purple-500',
    features: [
      'Portfolio & case study showcase',
      'Team profiles & bios',
      'Service packages with pricing',
      'Client testimonials',
      'Lead capture forms',
      'Blog / insights section',
    ],
    pages: ['Home', 'Work', 'Services', 'About', 'Blog', 'Contact'],
    integrations: ['Cal.com', 'Tally', 'Stripe', 'Dribbble'],
    demoUrl: null,
    status: 'coming_soon',
  },
]

export default function PremiumTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'entertainment', 'food', 'business']
  const filtered = selectedCategory === 'all'
    ? PREMIUM_TEMPLATES
    : PREMIUM_TEMPLATES.filter(t => t.category === selectedCategory)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Premium Site Templates</h1>
        </div>
        <p className="text-sm text-white/40">
          Full-stack Next.js sites with integrations, SEO, and conversion funnels. Configure and deploy in minutes — no code required.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { step: '01', icon: <Zap className="w-4 h-4" />, title: 'Pick a Template', desc: 'Choose a premium site template for your industry' },
          { step: '02', icon: <Star className="w-4 h-4" />, title: 'Configure', desc: 'Fill in your brand, copy, colors, and integrations' },
          { step: '03', icon: <Rocket className="w-4 h-4" />, title: 'Deploy', desc: 'Live on beyondamedium.io/sites/you in seconds' },
        ].map(item => (
          <div key={item.step} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-3 text-cyan-400">
              {item.icon}
            </div>
            <span className="text-[10px] text-white/20 font-mono">{item.step}</span>
            <h3 className="text-sm font-semibold text-white mt-1">{item.title}</h3>
            <p className="text-xs text-white/30 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-white/[0.03] text-white/30 border border-transparent hover:text-white/50'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="space-y-6">
        {filtered.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  )
}

function TemplateCard({ template }: { template: PremiumTemplate }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-white/[0.1] transition-all">
      {/* Preview header */}
      <div className={`h-48 bg-gradient-to-br ${template.gradient} opacity-[0.07] relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${template.gradient} flex items-center justify-center opacity-70`}>
            {template.icon}
          </div>
        </div>
        {template.status === 'coming_soon' && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-medium text-white/60">
            Coming Soon
          </div>
        )}
        {template.status === 'available' && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-full text-[10px] font-medium text-emerald-400">
            Available Now
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{template.name}</h2>
            <p className="text-sm text-white/50 mt-0.5">{template.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
            {template.demoUrl && (
              <a
                href={template.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-xs text-white/50 hover:text-white/80 hover:border-white/[0.1] transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Live Demo
              </a>
            )}
            {template.status === 'available' ? (
              <Link
                href={`/dashboard/premium-templates/${template.id}/configure`}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 transition-all"
              >
                Configure & Deploy <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white/[0.04] text-white/20 text-xs font-semibold rounded-xl cursor-not-allowed"
              >
                Coming Soon
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-white/35 leading-relaxed mb-4">{template.description}</p>

        {/* Quick stats */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[10px] text-white/25">
            <span className="text-white/50 font-medium">{template.pages.length}</span> pages
          </span>
          <span className="text-[10px] text-white/25">
            <span className="text-white/50 font-medium">{template.integrations.length}</span> integrations
          </span>
          <span className="text-[10px] text-white/25">
            <span className="text-white/50 font-medium">{template.features.length}</span> features
          </span>
        </div>

        {/* Integrations badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.integrations.map(int => (
            <span key={int} className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-[10px] text-white/40">
              {int}
            </span>
          ))}
        </div>

        {/* Expand/collapse features */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors"
        >
          {expanded ? 'Hide features' : 'Show all features & pages'}
        </button>

        {expanded && (
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            {/* Features */}
            <div>
              <h4 className="text-xs font-medium text-white/50 mb-2">Features</h4>
              <div className="space-y-1.5">
                {template.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-white/35">
                    <Check className="w-3 h-3 text-emerald-400/60 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            {/* Pages */}
            <div>
              <h4 className="text-xs font-medium text-white/50 mb-2">Pages Included</h4>
              <div className="flex flex-wrap gap-1.5">
                {template.pages.map(p => (
                  <span key={p} className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[11px] text-white/40">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
