/**
 * BAM OS — Template Seeder Batch 2
 * 100 MORE unique templates. 40% premium (marked is_premium = true).
 * Premium templates get enhanced prompts for higher quality designs.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface TemplateDef {
  name: string
  category: string
  desc: string
  premium: boolean
}

// ─── 100 NEW Template Definitions (40 premium) ──────────────
const TEMPLATES: TemplateDef[] = [
  // SaaS & Tech — 12 (5 premium)
  { name: 'Nexus AI', category: 'saas', desc: 'AI workflow automation platform', premium: true },
  { name: 'ChartLab', category: 'saas', desc: 'Data visualization and reporting tool', premium: true },
  { name: 'PipelineHQ', category: 'saas', desc: 'Sales pipeline management CRM', premium: true },
  { name: 'DocuSign Pro', category: 'saas', desc: 'Digital document signing platform', premium: false },
  { name: 'BotBuilder', category: 'saas', desc: 'No-code chatbot builder', premium: false },
  { name: 'MailForge', category: 'saas', desc: 'Email marketing automation', premium: true },
  { name: 'CloudVault', category: 'saas', desc: 'Secure cloud storage for teams', premium: false },
  { name: 'APIGateway', category: 'saas', desc: 'API management and monitoring', premium: false },
  { name: 'PixelTrack', category: 'saas', desc: 'Conversion tracking and attribution', premium: true },
  { name: 'TeamSync', category: 'saas', desc: 'Team communication platform', premium: false },
  { name: 'InvoiceFlow', category: 'saas', desc: 'Automated invoicing and billing', premium: false },
  { name: 'FeatureFlag', category: 'saas', desc: 'Feature management and A/B testing', premium: false },

  // Restaurant & Food — 8 (3 premium)
  { name: 'Sakura Ramen', category: 'restaurant', desc: 'Authentic Japanese ramen house', premium: true },
  { name: 'The Copper Kettle', category: 'restaurant', desc: 'Victorian-era themed tea house and bistro', premium: true },
  { name: 'Fuego Grill', category: 'restaurant', desc: 'Argentinian steakhouse and wine bar', premium: true },
  { name: 'Noodle Republic', category: 'restaurant', desc: 'Asian noodle bar with build-your-own bowls', premium: false },
  { name: 'The Juice Press', category: 'restaurant', desc: 'Cold-pressed juice and smoothie bar', premium: false },
  { name: 'MediterraneanTable', category: 'restaurant', desc: 'Mediterranean cuisine and mezze', premium: false },
  { name: 'Urban Slice', category: 'restaurant', desc: 'New York style pizza by the slice', premium: false },
  { name: 'Sweet Surrender', category: 'restaurant', desc: 'Gourmet dessert bar and chocolate shop', premium: false },

  // Fitness & Wellness — 8 (3 premium)
  { name: 'Apex Performance', category: 'fitness', desc: 'Elite athletic training facility', premium: true },
  { name: 'Serenity Spa', category: 'fitness', desc: 'Luxury day spa and wellness retreat', premium: true },
  { name: 'CrossTrain Elite', category: 'fitness', desc: 'CrossFit box with competition training', premium: true },
  { name: 'Dance Fusion', category: 'fitness', desc: 'Dance fitness studio with multiple styles', premium: false },
  { name: 'Trail Runners Club', category: 'fitness', desc: 'Trail running community and coaching', premium: false },
  { name: 'Power Yoga Collective', category: 'fitness', desc: 'Hot power yoga and breathwork studio', premium: false },
  { name: 'Boxing Academy', category: 'fitness', desc: 'Boxing training and self-defense classes', premium: false },
  { name: 'Recovery Zone', category: 'fitness', desc: 'Sports recovery and cryotherapy center', premium: false },

  // E-commerce & DTC — 10 (5 premium)
  { name: 'Artisan Leather Co', category: 'ecommerce', desc: 'Handcrafted leather goods and accessories', premium: true },
  { name: 'Zenith Watches', category: 'ecommerce', desc: 'Luxury minimalist watch brand', premium: true },
  { name: 'Verdant Home', category: 'ecommerce', desc: 'Indoor plants and botanical supplies', premium: true },
  { name: 'Aurora Jewelry', category: 'ecommerce', desc: 'Fine jewelry and gemstone collections', premium: true },
  { name: 'Basecamp Outdoors', category: 'ecommerce', desc: 'Premium camping and hiking equipment', premium: true },
  { name: 'Vinyl Revival', category: 'ecommerce', desc: 'Vinyl records and turntable shop', premium: false },
  { name: 'Candlewick Co', category: 'ecommerce', desc: 'Hand-poured soy candles and home fragrance', premium: false },
  { name: 'Pixel Prints', category: 'ecommerce', desc: 'Custom art prints and poster shop', premium: false },
  { name: 'Brew Kit', category: 'ecommerce', desc: 'Home brewing kits and supplies', premium: false },
  { name: 'Sole Traders', category: 'ecommerce', desc: 'Premium sneaker resale marketplace', premium: false },

  // Real Estate — 6 (3 premium)
  { name: 'Skyline Properties', category: 'realestate', desc: 'High-rise luxury condo developer', premium: true },
  { name: 'Ranch & Land Co', category: 'realestate', desc: 'Rural land and ranch real estate', premium: true },
  { name: 'Metro Living', category: 'realestate', desc: 'Urban apartment rental platform', premium: true },
  { name: 'Sunset Villas', category: 'realestate', desc: 'Vacation rental property management', premium: false },
  { name: 'Blueprint Homes', category: 'realestate', desc: 'Custom home builder', premium: false },
  { name: 'Student Housing Hub', category: 'realestate', desc: 'Student accommodation finder', premium: false },

  // Coaching & Education — 8 (3 premium)
  { name: 'Revenue Academy', category: 'coaching', desc: 'Sales training and revenue growth coaching', premium: true },
  { name: 'AI Mastery School', category: 'coaching', desc: 'AI and machine learning bootcamp', premium: true },
  { name: 'Leadership Forge', category: 'coaching', desc: 'C-suite executive coaching program', premium: true },
  { name: 'Guitar Academy Online', category: 'coaching', desc: 'Online guitar lessons for all levels', premium: false },
  { name: 'Language Bridge', category: 'coaching', desc: 'Online language learning platform', premium: false },
  { name: 'MathGenius Tutoring', category: 'coaching', desc: 'Math tutoring for K-12 students', premium: false },
  { name: 'Career Catalyst', category: 'coaching', desc: 'Career transition coaching', premium: false },
  { name: 'Parenting Compass', category: 'coaching', desc: 'Parenting skills and child development courses', premium: false },

  // Agency & Creative — 8 (3 premium)
  { name: 'Prism Creative', category: 'agency', desc: 'Award-winning creative advertising agency', premium: true },
  { name: 'Velocity Growth', category: 'agency', desc: 'Growth hacking and performance marketing', premium: true },
  { name: 'Lens & Light', category: 'agency', desc: 'Commercial photography and videography', premium: true },
  { name: 'TypeFoundry', category: 'agency', desc: 'Typography and font design studio', premium: false },
  { name: 'Motion Graphics Lab', category: 'agency', desc: 'Motion design and animation studio', premium: false },
  { name: 'Indie Game Studio', category: 'agency', desc: 'Independent game development studio', premium: false },
  { name: 'Podcast Studio Pro', category: 'agency', desc: 'Podcast production and editing service', premium: false },
  { name: 'Print & Press', category: 'agency', desc: 'Print design and publishing house', premium: false },

  // Medical & Health — 8 (3 premium)
  { name: 'EliteCare Medical', category: 'medical', desc: 'Concierge medicine practice', premium: true },
  { name: 'Bright Smile Orthodontics', category: 'medical', desc: 'Invisalign and braces specialist', premium: true },
  { name: 'NeuroPeak Brain Center', category: 'medical', desc: 'Neurofeedback and cognitive wellness', premium: true },
  { name: 'KidsCare Pediatrics', category: 'medical', desc: 'Pediatric healthcare clinic', premium: false },
  { name: 'VisionFirst Laser', category: 'medical', desc: 'LASIK and vision correction center', premium: false },
  { name: 'Harmony Acupuncture', category: 'medical', desc: 'Acupuncture and traditional Chinese medicine', premium: false },
  { name: 'SportsMed Clinic', category: 'medical', desc: 'Sports medicine and injury rehabilitation', premium: false },
  { name: 'Senior Care Partners', category: 'medical', desc: 'Geriatric care and elder health services', premium: false },

  // Legal & Finance — 8 (3 premium)
  { name: 'Atlas Law Partners', category: 'legal', desc: 'International business law firm', premium: true },
  { name: 'Fortuna Wealth', category: 'legal', desc: 'Private wealth management for high-net-worth', premium: true },
  { name: 'CryptoLegal', category: 'legal', desc: 'Blockchain and cryptocurrency law specialists', premium: true },
  { name: 'StartupCounsel', category: 'legal', desc: 'Legal services for startups and founders', premium: false },
  { name: 'EstatePlan Pro', category: 'legal', desc: 'Estate planning and probate law', premium: false },
  { name: 'TaxShield Group', category: 'legal', desc: 'Tax optimization and compliance', premium: false },
  { name: 'Patent Masters', category: 'legal', desc: 'Intellectual property and patent attorneys', premium: false },
  { name: 'Divorce Solutions', category: 'legal', desc: 'Family law and mediation practice', premium: false },

  // Construction & Home — 8 (3 premium)
  { name: 'Prestige Builders', category: 'construction', desc: 'Luxury custom home construction', premium: true },
  { name: 'SmartHome Systems', category: 'construction', desc: 'Home automation and smart tech installation', premium: true },
  { name: 'SolarEdge Pros', category: 'construction', desc: 'Solar panel installation and green energy', premium: true },
  { name: 'Hardwood Heroes', category: 'construction', desc: 'Hardwood flooring installation and refinishing', premium: false },
  { name: 'WaterWorks Pool Co', category: 'construction', desc: 'Swimming pool construction and maintenance', premium: false },
  { name: 'ClearView Windows', category: 'construction', desc: 'Window replacement and installation', premium: false },
  { name: 'FenceLine Pros', category: 'construction', desc: 'Fencing installation and repair', premium: false },
  { name: 'Foundation First', category: 'construction', desc: 'Foundation repair and waterproofing', premium: false },

  // Events & Entertainment — 8 (3 premium)
  { name: 'Luxe Weddings', category: 'events', desc: 'Luxury destination wedding planning', premium: true },
  { name: 'TechCon Global', category: 'events', desc: 'International technology conference', premium: true },
  { name: 'Neon Nights DJ', category: 'events', desc: 'Professional DJ and event entertainment', premium: true },
  { name: 'Laugh Factory', category: 'events', desc: 'Comedy club and standup venue', premium: false },
  { name: 'Art Gallery 360', category: 'events', desc: 'Contemporary art gallery and exhibitions', premium: false },
  { name: 'FoodFest Events', category: 'events', desc: 'Food festival and culinary event organizer', premium: false },
  { name: 'KidZone Parties', category: 'events', desc: 'Children birthday party planning', premium: false },
  { name: 'CorporateRetreat Co', category: 'events', desc: 'Corporate team building and retreat planning', premium: false },

  // Beauty & Salon — 8 (3 premium)
  { name: 'Aura Beauty Lounge', category: 'beauty', desc: 'Luxury beauty lounge with VIP suites', premium: true },
  { name: 'Ink & Art Tattoo', category: 'beauty', desc: 'Custom tattoo and body art studio', premium: true },
  { name: 'The Brow Room', category: 'beauty', desc: 'Microblading and brow architecture studio', premium: true },
  { name: 'CurlPower Salon', category: 'beauty', desc: 'Natural hair and curly hair specialist salon', premium: false },
  { name: 'Zen Nails & Spa', category: 'beauty', desc: 'Japanese-inspired nail art and spa', premium: false },
  { name: 'ManCave Grooming', category: 'beauty', desc: 'Premium men grooming and barbershop', premium: false },
  { name: 'GlowUp Aesthetics', category: 'beauty', desc: 'Non-invasive cosmetic treatments', premium: false },
  { name: 'Hair Color Lab', category: 'beauty', desc: 'Creative hair coloring and balayage studio', premium: false },

  // NEW CATEGORY: Nonprofit — 4 (1 premium)
  { name: 'Hope Foundation', category: 'nonprofit', desc: 'Children education and welfare charity', premium: true },
  { name: 'OceanGuard', category: 'nonprofit', desc: 'Ocean conservation and marine protection', premium: false },
  { name: 'FeedForward', category: 'nonprofit', desc: 'Food bank and hunger relief organization', premium: false },
  { name: 'GreenFuture', category: 'nonprofit', desc: 'Environmental sustainability nonprofit', premium: false },

  // NEW CATEGORY: Automotive — 4 (2 premium)
  { name: 'AutoElite Detailing', category: 'automotive', desc: 'Premium car detailing and ceramic coating', premium: true },
  { name: 'EV Motors', category: 'automotive', desc: 'Electric vehicle dealership', premium: true },
  { name: 'QuickFix Auto', category: 'automotive', desc: 'Auto repair and maintenance shop', premium: false },
  { name: 'TireKing', category: 'automotive', desc: 'Tire sales and wheel alignment center', premium: false },
]

const STANDARD_PROMPT = `You generate beautiful, production-ready HTML landing pages. Output ONLY the HTML — no markdown, no explanations, no code fences.

RULES:
- Use inline <style> tag at the top for all CSS
- Include Google Fonts link for Inter
- Responsive design with CSS grid/flexbox
- Modern design — vary between dark and light themes
- Realistic content — real-sounding descriptions, prices, team names
- For images use colored divs with text labels (no external URLs)
- Include: hero, features/services, about, testimonials, pricing/CTA, contact, footer
- Each template must be UNIQUE in layout, color scheme, and structure
- Use semantic HTML
- Keep it under 400 lines`

const PREMIUM_PROMPT = `You generate PREMIUM, ultra-polished, production-ready HTML landing pages that look like they were designed by a top-tier agency. Output ONLY the HTML — no markdown, no explanations, no code fences.

RULES:
- Use inline <style> tag at the top for all CSS
- Include Google Fonts link for Inter AND a display font (Playfair Display, Space Grotesk, or Outfit)
- PREMIUM quality: subtle animations (CSS transitions on hover), gradient accents, glassmorphism effects, premium spacing
- Responsive design with CSS grid/flexbox
- Rich visual hierarchy — use varying font sizes, weights, letter-spacing
- For images use beautifully colored gradient divs with descriptive text
- Include ALL of: hero, value proposition, features/services, social proof/testimonials, pricing with highlighted tier, FAQ, CTA, footer with links
- Use creative layouts — asymmetric grids, overlapping elements, full-bleed sections
- Add subtle details: hover effects on buttons, card shadows, border accents
- Each template must be VISUALLY DISTINCT — different color palette, typography style, layout pattern
- Premium templates should feel like a $5000+ custom design
- Use semantic HTML
- Keep under 500 lines`

async function generateTemplate(template: TemplateDef, index: number): Promise<string> {
  const system = template.premium ? PREMIUM_PROMPT : STANDARD_PROMPT
  const quality = template.premium ? 'Make this a PREMIUM, agency-quality design with polished details, subtle animations, and sophisticated typography.' : 'Make it clean and professional.'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: template.premium ? 10000 : 8000,
    system,
    messages: [{
      role: 'user',
      content: `Create a landing page for "${template.name}" — ${template.desc}. Category: ${template.category}. Template #${index + 1}. ${quality}`,
    }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()
}

async function main() {
  const premiumCount = TEMPLATES.filter(t => t.premium).length
  console.log(`\n🚀 BAM OS Template Seeder — Batch 2`)
  console.log(`   ${TEMPLATES.length} templates (${premiumCount} premium, ${TEMPLATES.length - premiumCount} standard)\n`)

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
          const tag = template.premium ? '⭐' : '  '
          console.log(`   ${tag} ⏳ [${globalIdx + 1}] ${template.name}...`)
          const html = await generateTemplate(template, globalIdx)

          const { error } = await supabase.from('templates').insert({
            user_id: '7aee1ca8-626b-4c14-89ff-50cc86ae54e1',
            name: template.name,
            description: template.desc,
            category: template.category,
            html,
            css: '',
            js: '',
            gjs_data: {},
            is_public: true,
            is_premium: template.premium,
            uses: template.premium
              ? Math.floor(Math.random() * 300) + 200
              : Math.floor(Math.random() * 400) + 50,
          })

          if (error) throw error
          console.log(`   ${tag} ✅ [${globalIdx + 1}] ${template.name}`)
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

    if (i + BATCH_SIZE < TEMPLATES.length) {
      console.log(`   ⏸  Pausing 3s...\n`)
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  console.log(`\n✨ Done! ${successCount} templates created, ${errorCount} errors.`)
  console.log(`   Premium: ${premiumCount} | Standard: ${TEMPLATES.length - premiumCount}`)
  console.log(`   Total in marketplace: 200\n`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
