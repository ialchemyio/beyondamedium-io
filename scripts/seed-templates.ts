/**
 * BAM OS — Template Seeder
 * Generates 100 unique, original templates via Claude API and seeds them into Supabase.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-templates.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// ─── 100 Template Definitions ────────────────────────────────
const TEMPLATES = [
  // SaaS & Tech (15)
  { name: 'NovaCRM', category: 'saas', desc: 'AI-powered CRM platform for modern sales teams' },
  { name: 'CloudSync Pro', category: 'saas', desc: 'Enterprise file sync and collaboration platform' },
  { name: 'DataPulse', category: 'saas', desc: 'Real-time analytics dashboard for startups' },
  { name: 'Launchpad AI', category: 'saas', desc: 'AI startup landing page with waitlist' },
  { name: 'DevStack', category: 'saas', desc: 'Developer tools and API platform' },
  { name: 'TaskForge', category: 'saas', desc: 'Project management for remote teams' },
  { name: 'PayStream', category: 'saas', desc: 'Payment processing fintech platform' },
  { name: 'InboxZero', category: 'saas', desc: 'AI email management tool' },
  { name: 'FormCraft', category: 'saas', desc: 'Smart form builder with integrations' },
  { name: 'MetricFlow', category: 'saas', desc: 'Business intelligence dashboard' },
  { name: 'AutoPilot HR', category: 'saas', desc: 'HR automation platform for SMBs' },
  { name: 'CodeShip', category: 'saas', desc: 'CI/CD deployment platform' },
  { name: 'VaultSec', category: 'saas', desc: 'Cybersecurity monitoring SaaS' },
  { name: 'SignalAI', category: 'saas', desc: 'AI-powered social listening tool' },
  { name: 'ScheduleKit', category: 'saas', desc: 'Appointment scheduling platform' },

  // Restaurant & Food (10)
  { name: 'Ember Kitchen', category: 'restaurant', desc: 'Upscale modern restaurant with seasonal menu' },
  { name: 'Sushi Zen', category: 'restaurant', desc: 'Japanese fusion restaurant and sake bar' },
  { name: 'The Rustic Table', category: 'restaurant', desc: 'Farm-to-table dining experience' },
  { name: 'Taco Fuego', category: 'restaurant', desc: 'Authentic Mexican street food' },
  { name: 'Bella Pasta', category: 'restaurant', desc: 'Italian family restaurant' },
  { name: 'Green Bowl', category: 'restaurant', desc: 'Healthy fast-casual poke and salad bar' },
  { name: 'Brew & Bite', category: 'restaurant', desc: 'Craft brewery and gastropub' },
  { name: 'Cloud Nine Bakery', category: 'restaurant', desc: 'Artisan bakery and pastry shop' },
  { name: 'The Smoke Stack', category: 'restaurant', desc: 'BBQ smokehouse restaurant' },
  { name: 'Spice Route', category: 'restaurant', desc: 'Indian fusion cuisine' },

  // Fitness & Wellness (10)
  { name: 'IronCore Gym', category: 'fitness', desc: 'Strength training and CrossFit gym' },
  { name: 'FlowState Yoga', category: 'fitness', desc: 'Yoga studio with online classes' },
  { name: 'PeakForm Athletics', category: 'fitness', desc: 'Personal training and coaching' },
  { name: 'Zen Mind Wellness', category: 'fitness', desc: 'Meditation and mindfulness center' },
  { name: 'SpinCycle Studio', category: 'fitness', desc: 'Indoor cycling and HIIT studio' },
  { name: 'TitanFit', category: 'fitness', desc: 'Online fitness coaching platform' },
  { name: 'Stretch Lab', category: 'fitness', desc: 'Assisted stretching and recovery center' },
  { name: 'NutriBalance', category: 'fitness', desc: 'Nutrition coaching and meal planning' },
  { name: 'AquaFlow Swim', category: 'fitness', desc: 'Swim school and aquatic fitness' },
  { name: 'MindBody Reset', category: 'fitness', desc: 'Holistic wellness retreat' },

  // E-commerce & DTC (10)
  { name: 'Luma Skincare', category: 'ecommerce', desc: 'Clean beauty and skincare brand' },
  { name: 'Nomad Gear Co', category: 'ecommerce', desc: 'Outdoor adventure gear and apparel' },
  { name: 'Pura Home', category: 'ecommerce', desc: 'Modern home decor and furniture' },
  { name: 'ByteWear', category: 'ecommerce', desc: 'Tech-inspired streetwear brand' },
  { name: 'Bloom & Wild', category: 'ecommerce', desc: 'Premium flower delivery service' },
  { name: 'Roast Republic', category: 'ecommerce', desc: 'Specialty coffee subscription box' },
  { name: 'Pawsome Pet Co', category: 'ecommerce', desc: 'Premium pet food and accessories' },
  { name: 'Drip Supplements', category: 'ecommerce', desc: 'Performance supplements brand' },
  { name: 'ThreadLine', category: 'ecommerce', desc: 'Sustainable fashion marketplace' },
  { name: 'TechNest', category: 'ecommerce', desc: 'Smart home gadgets store' },

  // Real Estate & Property (8)
  { name: 'Pinnacle Realty', category: 'realestate', desc: 'Luxury real estate agency' },
  { name: 'HomeNest Realtors', category: 'realestate', desc: 'Family-friendly real estate brokerage' },
  { name: 'Urban Lofts', category: 'realestate', desc: 'Modern apartment listings platform' },
  { name: 'CrestView Properties', category: 'realestate', desc: 'Commercial real estate firm' },
  { name: 'CoastalHomes', category: 'realestate', desc: 'Beachfront property specialists' },
  { name: 'KeyStone Investments', category: 'realestate', desc: 'Real estate investment group' },
  { name: 'The Property Lab', category: 'realestate', desc: 'Property management company' },
  { name: 'OpenDoor Realty', category: 'realestate', desc: 'First-time homebuyer specialists' },

  // Coaching & Course (8)
  { name: 'LevelUp Academy', category: 'coaching', desc: 'Online business coaching platform' },
  { name: 'MindShift Coach', category: 'coaching', desc: 'Executive leadership coaching' },
  { name: 'CodeMentor Pro', category: 'coaching', desc: 'Programming bootcamp and courses' },
  { name: 'SpeakBold', category: 'coaching', desc: 'Public speaking coaching' },
  { name: 'WealthPath', category: 'coaching', desc: 'Financial literacy course platform' },
  { name: 'FitCoach Online', category: 'coaching', desc: 'Online personal training courses' },
  { name: 'DesignMaster', category: 'coaching', desc: 'UI/UX design course platform' },
  { name: 'LaunchSchool', category: 'coaching', desc: 'Startup accelerator and course hub' },

  // Agency & Portfolio (8)
  { name: 'Pixel Studio', category: 'agency', desc: 'Creative design agency' },
  { name: 'Momentum Digital', category: 'agency', desc: 'Full-service digital marketing agency' },
  { name: 'Architect Bureau', category: 'agency', desc: 'Architecture and interior design firm' },
  { name: 'ShutterFrame', category: 'agency', desc: 'Professional photography portfolio' },
  { name: 'SoundWave Studio', category: 'agency', desc: 'Music production studio' },
  { name: 'Narrative Films', category: 'agency', desc: 'Video production company' },
  { name: 'BrandForge', category: 'agency', desc: 'Branding and identity agency' },
  { name: 'WebCraft Agency', category: 'agency', desc: 'Web development agency' },

  // Medical & Health (7)
  { name: 'SmileBright Dental', category: 'medical', desc: 'Modern dental practice' },
  { name: 'ClearView Eye Care', category: 'medical', desc: 'Optometry and eye health clinic' },
  { name: 'HealWell Clinic', category: 'medical', desc: 'Family medicine practice' },
  { name: 'Glow Dermatology', category: 'medical', desc: 'Dermatology and skin care clinic' },
  { name: 'PhysioMotion', category: 'medical', desc: 'Physical therapy and rehabilitation' },
  { name: 'MindCare Therapy', category: 'medical', desc: 'Mental health and therapy practice' },
  { name: 'PureChiro', category: 'medical', desc: 'Chiropractic and sports medicine' },

  // Legal & Consulting (7)
  { name: 'Shield Law Group', category: 'legal', desc: 'Business and corporate law firm' },
  { name: 'TrustPoint Advisors', category: 'legal', desc: 'Financial advisory and wealth management' },
  { name: 'Apex Consulting', category: 'legal', desc: 'Management consulting firm' },
  { name: 'FairTax CPAs', category: 'legal', desc: 'Accounting and tax services' },
  { name: 'Migration Partners', category: 'legal', desc: 'Immigration law specialists' },
  { name: 'InsureRight', category: 'legal', desc: 'Insurance brokerage firm' },
  { name: 'Resolve Mediation', category: 'legal', desc: 'Dispute resolution and mediation' },

  // Construction & Home Services (7)
  { name: 'BuildRight Construction', category: 'construction', desc: 'General contracting and home building' },
  { name: 'EliteRoof Pro', category: 'construction', desc: 'Roofing and exterior services' },
  { name: 'CleanSpace Interiors', category: 'construction', desc: 'Interior design and renovation' },
  { name: 'PowerFlow Electric', category: 'construction', desc: 'Electrical contracting services' },
  { name: 'AquaPure Plumbing', category: 'construction', desc: 'Plumbing and water services' },
  { name: 'GreenScape Landscaping', category: 'construction', desc: 'Landscaping and outdoor design' },
  { name: 'PaintPro Masters', category: 'construction', desc: 'Residential and commercial painting' },

  // Events & Entertainment (5)
  { name: 'GrandAffair Events', category: 'events', desc: 'Luxury wedding and event planning' },
  { name: 'NightOwl Lounge', category: 'events', desc: 'Nightclub and entertainment venue' },
  { name: 'SummitConf', category: 'events', desc: 'Tech conference and summit' },
  { name: 'StageLight Productions', category: 'events', desc: 'Live event production company' },
  { name: 'PartyBox Rentals', category: 'events', desc: 'Event equipment and party rentals' },

  // Beauty & Salon (5)
  { name: 'Velvet Beauty Bar', category: 'beauty', desc: 'Premium beauty salon and spa' },
  { name: 'Blade & Fade Barber', category: 'beauty', desc: 'Modern barbershop' },
  { name: 'LashLux Studio', category: 'beauty', desc: 'Lash extensions and brow studio' },
  { name: 'NailArt Atelier', category: 'beauty', desc: 'Luxury nail salon' },
  { name: 'Radiance MedSpa', category: 'beauty', desc: 'Medical aesthetics and anti-aging' },
]

const SYSTEM_PROMPT = `You generate beautiful, production-ready HTML landing pages. Output ONLY the HTML — no markdown, no explanations, no code fences.

RULES:
- Use inline <style> tag at the top for all CSS
- Include Google Fonts link for Inter
- Responsive design with CSS grid/flexbox
- Modern dark or light design (vary by business type)
- Realistic content — real-sounding descriptions, prices, team names
- For images use colored divs with text labels (no external URLs)
- Include: hero, features/services, about, testimonials, pricing/CTA, contact, footer
- Make it look like a $3000+ professional template
- Each template must be UNIQUE in layout, color scheme, and style
- Use semantic HTML
- Keep it under 400 lines of HTML`

async function generateTemplate(template: typeof TEMPLATES[0], index: number): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Create a landing page for "${template.name}" — ${template.desc}. Category: ${template.category}. Make it unique and professional. This is template #${index + 1} of 100, so vary the style significantly.`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()
}

async function main() {
  console.log(`\n🚀 BAM OS Template Seeder`)
  console.log(`   Generating ${TEMPLATES.length} templates...\n`)

  // Process in batches of 5 to avoid rate limits
  const BATCH_SIZE = 5
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < TEMPLATES.length; i += BATCH_SIZE) {
    const batch = TEMPLATES.slice(i, i + BATCH_SIZE)
    console.log(`📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(TEMPLATES.length / BATCH_SIZE)} (templates ${i + 1}-${Math.min(i + BATCH_SIZE, TEMPLATES.length)})`)

    const results = await Promise.allSettled(
      batch.map(async (template, batchIdx) => {
        const globalIdx = i + batchIdx
        try {
          console.log(`   ⏳ [${globalIdx + 1}] ${template.name}...`)
          const html = await generateTemplate(template, globalIdx)

          // Insert into Supabase
          const { error } = await supabase.from('templates').insert({
            user_id: '00000000-0000-0000-0000-000000000000', // system user
            name: template.name,
            description: template.desc,
            category: template.category,
            html,
            css: '',
            js: '',
            gjs_data: {},
            is_public: true,
            uses: Math.floor(Math.random() * 500) + 50, // seed with realistic usage numbers
          })

          if (error) throw error
          console.log(`   ✅ [${globalIdx + 1}] ${template.name}`)
          return true
        } catch (err) {
          console.error(`   ❌ [${globalIdx + 1}] ${template.name}: ${err}`)
          return false
        }
      })
    )

    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) successCount++
      else errorCount++
    })

    // Rate limit pause between batches
    if (i + BATCH_SIZE < TEMPLATES.length) {
      console.log(`   ⏸  Pausing 3s for rate limits...\n`)
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  console.log(`\n✨ Done! ${successCount} templates created, ${errorCount} errors.`)
  console.log(`   View at: beyondamedium.io/dashboard/templates\n`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
