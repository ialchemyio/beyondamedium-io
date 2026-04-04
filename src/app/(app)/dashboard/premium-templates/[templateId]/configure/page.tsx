'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2, Rocket, Crown, Globe, Music, Palette, Settings, Eye } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────
interface BrandIdentity {
  name: string
  shortName: string
  tagline: string
  logoFirst: string
  logoAccent: string
  email: string
  phone: string
}

interface SocialLocation {
  instagramHandle: string
  instagramUrl: string
  instagramFollowers: string
  youtubeUrl: string
  markets: { city: string; region: string }[]
  locationBase: string
}

interface Integrations {
  calcomUsername: string
  calcomEventSlug: string
  tallyFormId: string
  stripeTipLink5: string
  stripeTipLink10: string
  stripeTipLink20: string
  stripeTipLink50: string
  stripeDepositLink: string
}

interface Appearance {
  accentColor: string
  siteSlug: string
  customDomain: string
}

// ─── Color presets ────────────────────────────────
const COLOR_PRESETS = [
  { name: 'Orange Fire', value: '#ea580c', gradient: 'from-orange-500 to-amber-500' },
  { name: 'Electric Blue', value: '#3b82f6', gradient: 'from-blue-500 to-cyan-500' },
  { name: 'Neon Purple', value: '#8b5cf6', gradient: 'from-violet-500 to-purple-500' },
  { name: 'Hot Pink', value: '#ec4899', gradient: 'from-pink-500 to-rose-500' },
  { name: 'Emerald', value: '#10b981', gradient: 'from-emerald-500 to-teal-500' },
  { name: 'Gold', value: '#eab308', gradient: 'from-yellow-500 to-amber-500' },
  { name: 'Crimson', value: '#ef4444', gradient: 'from-red-500 to-orange-500' },
  { name: 'Cyan', value: '#06b6d4', gradient: 'from-cyan-400 to-blue-500' },
]

const STEPS = [
  { id: 'identity', label: 'Brand Identity', icon: <Crown className="w-4 h-4" /> },
  { id: 'social', label: 'Social & Location', icon: <Globe className="w-4 h-4" /> },
  { id: 'integrations', label: 'Integrations', icon: <Settings className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { id: 'review', label: 'Review & Deploy', icon: <Rocket className="w-4 h-4" /> },
]

export default function ConfigureTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.templateId as string
  const [step, setStep] = useState(0)
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<{ url: string; slug: string } | null>(null)
  const [error, setError] = useState('')

  // ─── Form state ─────────────────────────────────
  const [identity, setIdentity] = useState<BrandIdentity>({
    name: '', shortName: '', tagline: '', logoFirst: '', logoAccent: '',
    email: '', phone: '',
  })

  const [social, setSocial] = useState<SocialLocation>({
    instagramHandle: '', instagramUrl: '', instagramFollowers: '',
    youtubeUrl: '',
    markets: [{ city: '', region: '' }],
    locationBase: '',
  })

  const [integrations, setIntegrations] = useState<Integrations>({
    calcomUsername: '', calcomEventSlug: 'consultation',
    tallyFormId: '', stripeTipLink5: '', stripeTipLink10: '',
    stripeTipLink20: '', stripeTipLink50: '', stripeDepositLink: '',
  })

  const [appearance, setAppearance] = useState<Appearance>({
    accentColor: '#ea580c', siteSlug: '', customDomain: '',
  })

  // ─── Helpers ────────────────────────────────────
  function addMarket() {
    setSocial(prev => ({ ...prev, markets: [...prev.markets, { city: '', region: '' }] }))
  }

  function removeMarket(i: number) {
    setSocial(prev => ({ ...prev, markets: prev.markets.filter((_, idx) => idx !== i) }))
  }

  function updateMarket(i: number, field: 'city' | 'region', value: string) {
    setSocial(prev => ({
      ...prev,
      markets: prev.markets.map((m, idx) => idx === i ? { ...m, [field]: value } : m),
    }))
  }

  // ─── Auto-fill helpers ──────────────────────────
  function onNameChange(name: string) {
    const short = name.replace(/^(DJ\s+|MC\s+|The\s+)/i, '')
    const words = name.toUpperCase().split(/\s+/)
    setIdentity(prev => ({
      ...prev,
      name,
      shortName: prev.shortName || short,
      logoFirst: prev.logoFirst || (words[0] ?? ''),
      logoAccent: prev.logoAccent || (words.slice(1).join(' ') || ''),
    }))
    if (!appearance.siteSlug) {
      setAppearance(prev => ({ ...prev, siteSlug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))
    }
  }

  // ─── Deploy ─────────────────────────────────────
  async function handleDeploy() {
    setDeploying(true)
    setError('')

    try {
      const config = {
        templateId,
        slug: appearance.siteSlug,
        brandConfig: {
          name: identity.name,
          shortName: identity.shortName,
          tagline: identity.tagline,
          logoText: { first: identity.logoFirst, accent: identity.logoAccent },
          email: identity.email,
          phone: identity.phone,
          instagram: {
            handle: social.instagramHandle,
            url: social.instagramUrl || `https://instagram.com/${social.instagramHandle.replace('@', '')}`,
            followers: social.instagramFollowers,
            posts: '',
          },
          youtube: { url: social.youtubeUrl },
          markets: social.markets.filter(m => m.city),
          location: { base: social.locationBase },
          integrations: {
            calcom: {
              username: integrations.calcomUsername,
              eventSlug: integrations.calcomEventSlug,
            },
            tally: { bookingFormId: integrations.tallyFormId },
            stripe: {
              tipLinks: {
                support5: integrations.stripeTipLink5,
                request10: integrations.stripeTipLink10,
                priority20: integrations.stripeTipLink20,
                shoutout50: integrations.stripeTipLink50,
              },
              depositLink: integrations.stripeDepositLink,
            },
          },
          accentColor: appearance.accentColor,
          customDomain: appearance.customDomain,
        },
      }

      const res = await fetch('/api/premium-templates/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Deployment failed')

      setDeployResult({ url: data.siteUrl, slug: data.slug })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Deployment failed')
    } finally {
      setDeploying(false)
    }
  }

  const canAdvance = () => {
    if (step === 0) return identity.name && identity.email
    if (step === 1) return social.markets.some(m => m.city)
    if (step === 3) return appearance.siteSlug
    return true
  }

  // ─── Render ─────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/dashboard/premium-templates" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to templates
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Configure DJ / Nightlife Template</h1>
          <p className="text-xs text-white/40">Fill in your brand details — everything else is handled</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all w-full ${
                i === step
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : i < step
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer'
                  : 'bg-white/[0.02] text-white/20 border border-transparent'
              }`}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
        {step === 0 && (
          <StepIdentity identity={identity} setIdentity={setIdentity} onNameChange={onNameChange} />
        )}
        {step === 1 && (
          <StepSocial social={social} setSocial={setSocial} addMarket={addMarket} removeMarket={removeMarket} updateMarket={updateMarket} />
        )}
        {step === 2 && (
          <StepIntegrations integrations={integrations} setIntegrations={setIntegrations} />
        )}
        {step === 3 && (
          <StepAppearance appearance={appearance} setAppearance={setAppearance} />
        )}
        {step === 4 && (
          <StepReview
            identity={identity}
            social={social}
            integrations={integrations}
            appearance={appearance}
            deploying={deploying}
            deployResult={deployResult}
            error={error}
            onDeploy={handleDeploy}
          />
        )}
      </div>

      {/* Navigation */}
      {!deployResult && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs text-white/40 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            !deploying && !deployResult && (
              <button
                onClick={handleDeploy}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded-xl hover:brightness-110 transition-all"
              >
                <Rocket className="w-3.5 h-3.5" /> Deploy Site
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step Components ────────────────────────────────

function InputField({ label, value, onChange, placeholder, required, type = 'text', hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string
  required?: boolean; type?: string; hint?: string
}) {
  return (
    <div>
      <label className="text-xs font-medium text-white/50 mb-1.5 block">
        {label} {required && <span className="text-amber-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/15 focus:border-amber-500/30 focus:outline-none transition-colors"
      />
      {hint && <p className="text-[10px] text-white/20 mt-1">{hint}</p>}
    </div>
  )
}

function StepIdentity({ identity, setIdentity, onNameChange }: {
  identity: BrandIdentity
  setIdentity: React.Dispatch<React.SetStateAction<BrandIdentity>>
  onNameChange: (name: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Brand Identity</h2>
        <p className="text-xs text-white/30">The name and personality of your site</p>
      </div>
      <InputField
        label="Brand Name" required
        value={identity.name}
        onChange={onNameChange}
        placeholder="e.g. DJ Sammy Jay"
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Short Name"
          value={identity.shortName}
          onChange={v => setIdentity(p => ({ ...p, shortName: v }))}
          placeholder="e.g. Sammy Jay"
          hint="Used in CTAs and buttons"
        />
        <InputField
          label="Tagline"
          value={identity.tagline}
          onChange={v => setIdentity(p => ({ ...p, tagline: v }))}
          placeholder="e.g. High-Energy DJ Experiences"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Logo Text (First)"
          value={identity.logoFirst}
          onChange={v => setIdentity(p => ({ ...p, logoFirst: v }))}
          placeholder="e.g. SAMMY"
          hint="Bold part of the logo"
        />
        <InputField
          label="Logo Text (Accent)"
          value={identity.logoAccent}
          onChange={v => setIdentity(p => ({ ...p, logoAccent: v }))}
          placeholder="e.g. JAY"
          hint="Colored part of the logo"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Contact Email" required
          value={identity.email}
          onChange={v => setIdentity(p => ({ ...p, email: v }))}
          placeholder="e.g. bookings@example.com"
          type="email"
        />
        <InputField
          label="Phone (optional)"
          value={identity.phone}
          onChange={v => setIdentity(p => ({ ...p, phone: v }))}
          placeholder="e.g. (805) 555-0100"
        />
      </div>
    </div>
  )
}

function StepSocial({ social, setSocial, addMarket, removeMarket, updateMarket }: {
  social: SocialLocation
  setSocial: React.Dispatch<React.SetStateAction<SocialLocation>>
  addMarket: () => void
  removeMarket: (i: number) => void
  updateMarket: (i: number, field: 'city' | 'region', value: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Social & Location</h2>
        <p className="text-xs text-white/30">Where you are and where people can find you online</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="Instagram Handle"
          value={social.instagramHandle}
          onChange={v => setSocial(p => ({ ...p, instagramHandle: v, instagramUrl: `https://instagram.com/${v.replace('@', '')}` }))}
          placeholder="e.g. @djsammyjaay"
        />
        <InputField
          label="Instagram Followers"
          value={social.instagramFollowers}
          onChange={v => setSocial(p => ({ ...p, instagramFollowers: v }))}
          placeholder="e.g. 12.4K"
        />
      </div>
      <InputField
        label="YouTube URL"
        value={social.youtubeUrl}
        onChange={v => setSocial(p => ({ ...p, youtubeUrl: v }))}
        placeholder="e.g. https://youtube.com/@djsammyjaay"
      />
      <InputField
        label="Base Location"
        value={social.locationBase}
        onChange={v => setSocial(p => ({ ...p, locationBase: v }))}
        placeholder="e.g. Ventura County, CA"
      />

      {/* Markets */}
      <div>
        <label className="text-xs font-medium text-white/50 mb-2 block">
          Service Markets <span className="text-amber-400">*</span>
        </label>
        <div className="space-y-2">
          {social.markets.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={m.city}
                onChange={e => updateMarket(i, 'city', e.target.value)}
                placeholder="City"
                className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/15 focus:border-amber-500/30 focus:outline-none"
              />
              <input
                value={m.region}
                onChange={e => updateMarket(i, 'region', e.target.value)}
                placeholder="Region"
                className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/15 focus:border-amber-500/30 focus:outline-none"
              />
              {social.markets.length > 1 && (
                <button onClick={() => removeMarket(i)} className="text-white/20 hover:text-red-400 text-xs transition-colors">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addMarket} className="text-xs text-cyan-400/60 hover:text-cyan-400 mt-2 transition-colors">
          + Add market
        </button>
      </div>
    </div>
  )
}

function StepIntegrations({ integrations, setIntegrations }: {
  integrations: Integrations
  setIntegrations: React.Dispatch<React.SetStateAction<Integrations>>
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Integrations</h2>
        <p className="text-xs text-white/30">Connect your booking and payment tools. All are optional — add them later if needed.</p>
      </div>

      {/* Cal.com */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
        <h3 className="text-xs font-semibold text-white/70 mb-3">Cal.com (Scheduling)</h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Cal.com Username"
            value={integrations.calcomUsername}
            onChange={v => setIntegrations(p => ({ ...p, calcomUsername: v }))}
            placeholder="e.g. djsammyjay"
          />
          <InputField
            label="Event Slug"
            value={integrations.calcomEventSlug}
            onChange={v => setIntegrations(p => ({ ...p, calcomEventSlug: v }))}
            placeholder="e.g. consultation"
          />
        </div>
      </div>

      {/* Tally */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
        <h3 className="text-xs font-semibold text-white/70 mb-3">Tally (Booking Form)</h3>
        <InputField
          label="Tally Form ID"
          value={integrations.tallyFormId}
          onChange={v => setIntegrations(p => ({ ...p, tallyFormId: v }))}
          placeholder="e.g. wQ9JRa"
          hint="Found in your Tally form URL: tally.so/r/[ID]"
        />
      </div>

      {/* Stripe */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
        <h3 className="text-xs font-semibold text-white/70 mb-3">Stripe (Payments)</h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="$5 Tip Link"
            value={integrations.stripeTipLink5}
            onChange={v => setIntegrations(p => ({ ...p, stripeTipLink5: v }))}
            placeholder="https://buy.stripe.com/..."
          />
          <InputField
            label="$10 Request Link"
            value={integrations.stripeTipLink10}
            onChange={v => setIntegrations(p => ({ ...p, stripeTipLink10: v }))}
            placeholder="https://buy.stripe.com/..."
          />
          <InputField
            label="$20 Priority Link"
            value={integrations.stripeTipLink20}
            onChange={v => setIntegrations(p => ({ ...p, stripeTipLink20: v }))}
            placeholder="https://buy.stripe.com/..."
          />
          <InputField
            label="$50 Shoutout Link"
            value={integrations.stripeTipLink50}
            onChange={v => setIntegrations(p => ({ ...p, stripeTipLink50: v }))}
            placeholder="https://buy.stripe.com/..."
          />
        </div>
        <div className="mt-4">
          <InputField
            label="Deposit Link"
            value={integrations.stripeDepositLink}
            onChange={v => setIntegrations(p => ({ ...p, stripeDepositLink: v }))}
            placeholder="https://buy.stripe.com/..."
          />
        </div>
      </div>
    </div>
  )
}

function StepAppearance({ appearance, setAppearance }: {
  appearance: Appearance
  setAppearance: React.Dispatch<React.SetStateAction<Appearance>>
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Appearance & Domain</h2>
        <p className="text-xs text-white/30">Choose your accent color and site URL</p>
      </div>

      {/* Accent color */}
      <div>
        <label className="text-xs font-medium text-white/50 mb-2 block">Accent Color</label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PRESETS.map(color => (
            <button
              key={color.value}
              onClick={() => setAppearance(p => ({ ...p, accentColor: color.value }))}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                appearance.accentColor === color.value
                  ? 'border-white/20 bg-white/[0.06]'
                  : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${color.gradient}`} />
              <span className="text-[11px] text-white/50">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Site slug */}
      <div>
        <InputField
          label="Site Slug" required
          value={appearance.siteSlug}
          onChange={v => setAppearance(p => ({ ...p, siteSlug: v.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
          placeholder="e.g. djsammyjay"
          hint={`Your site will be at beyondamedium.io/sites/${appearance.siteSlug || '...'}`}
        />
      </div>

      {/* Custom domain */}
      <InputField
        label="Custom Domain (optional)"
        value={appearance.customDomain}
        onChange={v => setAppearance(p => ({ ...p, customDomain: v }))}
        placeholder="e.g. djsammyjay.com"
        hint="We'll help you connect your domain after deployment"
      />
    </div>
  )
}

function StepReview({ identity, social, integrations, appearance, deploying, deployResult, error, onDeploy }: {
  identity: BrandIdentity
  social: SocialLocation
  integrations: Integrations
  appearance: Appearance
  deploying: boolean
  deployResult: { url: string; slug: string } | null
  error: string
  onDeploy: () => void
}) {
  if (deployResult) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Site Deployed!</h2>
        <p className="text-sm text-white/40 mb-6">
          Your site is live and ready to go.
        </p>
        <a
          href={deployResult.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
        >
          <Eye className="w-4 h-4" /> View Live Site
        </a>
        <p className="text-xs text-white/20 mt-4 font-mono">{deployResult.url}</p>
      </div>
    )
  }

  if (deploying) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-semibold text-white mb-1">Deploying your site...</h2>
        <p className="text-xs text-white/30">Cloning template, injecting config, and deploying to Vercel</p>
      </div>
    )
  }

  const activeMarkets = social.markets.filter(m => m.city)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Review Configuration</h2>
        <p className="text-xs text-white/30">Double-check your settings before deploying</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <ReviewCard title="Brand">
          <ReviewLine label="Name" value={identity.name} />
          <ReviewLine label="Tagline" value={identity.tagline} />
          <ReviewLine label="Logo" value={`${identity.logoFirst} ${identity.logoAccent}`} />
          <ReviewLine label="Email" value={identity.email} />
        </ReviewCard>

        <ReviewCard title="Social & Location">
          <ReviewLine label="Instagram" value={social.instagramHandle} />
          <ReviewLine label="YouTube" value={social.youtubeUrl ? 'Connected' : 'Not set'} />
          <ReviewLine label="Markets" value={activeMarkets.map(m => m.city).join(', ')} />
          <ReviewLine label="Base" value={social.locationBase} />
        </ReviewCard>

        <ReviewCard title="Integrations">
          <ReviewLine label="Cal.com" value={integrations.calcomUsername || 'Not set'} />
          <ReviewLine label="Tally" value={integrations.tallyFormId || 'Not set'} />
          <ReviewLine label="Stripe" value={integrations.stripeTipLink5 ? 'Connected' : 'Not set'} />
        </ReviewCard>

        <ReviewCard title="Deployment">
          <ReviewLine label="Slug" value={appearance.siteSlug} />
          <ReviewLine label="URL" value={`beyondamedium.io/sites/${appearance.siteSlug}`} />
          <ReviewLine label="Color" value={COLOR_PRESETS.find(c => c.value === appearance.accentColor)?.name ?? appearance.accentColor} />
          <ReviewLine label="Domain" value={appearance.customDomain || 'None'} />
        </ReviewCard>
      </div>
    </div>
  )
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
      <h3 className="text-xs font-semibold text-white/60 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/25">{label}</span>
      <span className="text-[11px] text-white/50 font-medium truncate ml-2 max-w-[60%] text-right">{value || '—'}</span>
    </div>
  )
}
