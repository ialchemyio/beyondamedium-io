import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Template repo map — each premium template points to its GitHub source repo
const TEMPLATE_REPOS: Record<string, { owner: string; repo: string }> = {
  'dj-nightlife': { owner: 'ialchemyio', repo: 'dj-sammy-jay-platform' },
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { templateId, slug, brandConfig } = body

  if (!templateId || !slug || !brandConfig) {
    return NextResponse.json({ error: 'Missing required fields: templateId, slug, brandConfig' }, { status: 400 })
  }

  // Validate template exists
  const templateRepo = TEMPLATE_REPOS[templateId]
  if (!templateRepo) {
    return NextResponse.json({ error: `Unknown template: ${templateId}` }, { status: 400 })
  }

  // Validate slug format
  if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
    return NextResponse.json({ error: 'Slug must be 3-50 lowercase alphanumeric characters or hyphens' }, { status: 400 })
  }

  const githubToken = process.env.GITHUB_TOKEN
  const vercelToken = process.env.VERCEL_TOKEN
  const vercelTeamId = process.env.VERCEL_TEAM_ID

  if (!githubToken || !vercelToken) {
    return NextResponse.json({ error: 'Server not configured for deployments. Set GITHUB_TOKEN and VERCEL_TOKEN.' }, { status: 500 })
  }

  try {
    // ── Step 1: Create repo from template via GitHub API ──────────
    const newRepoName = `bam-site-${slug}`
    const ghHeaders = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    const createRepoRes = await fetch(
      `https://api.github.com/repos/${templateRepo.owner}/${templateRepo.repo}/generate`,
      {
        method: 'POST',
        headers: { ...ghHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: templateRepo.owner,
          name: newRepoName,
          description: `BAM Premium Site: ${brandConfig.name}`,
          private: true,
          include_all_branches: false,
        }),
      }
    )

    if (!createRepoRes.ok) {
      const err = await createRepoRes.json()
      // If repo already exists, that's ok — we'll push to it
      if (err.message?.includes('already exists')) {
        // Continue with existing repo
      } else {
        return NextResponse.json({ error: `GitHub error: ${err.message}` }, { status: 500 })
      }
    }

    const repoData = createRepoRes.ok ? await createRepoRes.json() : null
    const repoFullName = repoData?.full_name || `${templateRepo.owner}/${newRepoName}`

    // ── Step 2: Generate brand-config.ts content ──────────────────
    const brandConfigContent = generateBrandConfig(brandConfig, slug)

    // ── Step 3: Push brand-config.ts to the new repo ──────────────
    // Get current file SHA first
    const fileRes = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/src/lib/brand-config.ts`,
      { headers: ghHeaders }
    )
    const fileData = fileRes.ok ? await fileRes.json() : null
    const fileSha = fileData?.sha

    await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/src/lib/brand-config.ts`,
      {
        method: 'PUT',
        headers: { ...ghHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Configure brand: ${brandConfig.name}`,
          content: Buffer.from(brandConfigContent).toString('base64'),
          ...(fileSha ? { sha: fileSha } : {}),
        }),
      }
    )

    // ── Step 4: Create Vercel project from the repo ───────────────
    const vercelHeaders = {
      'Authorization': `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    }
    const teamQuery = vercelTeamId ? `?teamId=${vercelTeamId}` : ''

    // Create project
    const projectRes = await fetch(
      `https://api.vercel.com/v10/projects${teamQuery}`,
      {
        method: 'POST',
        headers: vercelHeaders,
        body: JSON.stringify({
          name: newRepoName,
          framework: 'nextjs',
          gitRepository: {
            type: 'github',
            repo: repoFullName,
          },
          buildCommand: 'next build',
          outputDirectory: '.next',
        }),
      }
    )

    let vercelProject = null
    if (projectRes.ok) {
      vercelProject = await projectRes.json()
    } else {
      const projErr = await projectRes.json()
      // Project might already exist
      if (!projErr.error?.message?.includes('already exist')) {
        return NextResponse.json({ error: `Vercel error: ${projErr.error?.message}` }, { status: 500 })
      }
    }

    // ── Step 5: Trigger deployment ────────────────────────────────
    const deployRes = await fetch(
      `https://api.vercel.com/v13/deployments${teamQuery}`,
      {
        method: 'POST',
        headers: vercelHeaders,
        body: JSON.stringify({
          name: newRepoName,
          gitSource: {
            type: 'github',
            ref: 'main',
            repoId: repoFullName,
          },
        }),
      }
    )

    let deployUrl = `https://${newRepoName}.vercel.app`
    if (deployRes.ok) {
      const deployData = await deployRes.json()
      deployUrl = `https://${deployData.url || `${newRepoName}.vercel.app`}`
    }

    // ── Step 6: Update beyondamedium.io rewrites ──────────────────
    // Store deployment record in Supabase
    await supabase.from('premium_deployments').insert({
      user_id: user.id,
      template_id: templateId,
      slug,
      repo_name: newRepoName,
      repo_full_name: repoFullName,
      vercel_project_name: newRepoName,
      deploy_url: deployUrl,
      site_url: `https://beyondamedium.io/sites/${slug}`,
      brand_config: brandConfig,
      custom_domain: brandConfig.customDomain || null,
      status: 'deployed',
    })

    // Update vercel.json in the beyondamedium-io repo to add rewrite
    await addRewriteToVercelJson(ghHeaders, slug, deployUrl)

    const siteUrl = `https://beyondamedium.io/sites/${slug}`

    return NextResponse.json({
      success: true,
      slug,
      siteUrl,
      deployUrl,
      repoFullName,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Deploy failed: ${message}` }, { status: 500 })
  }
}

// ─── Generate brand-config.ts from wizard data ────────────────────

function generateBrandConfig(config: Record<string, unknown>, slug: string): string {
  const c = config as {
    name: string
    shortName: string
    tagline: string
    logoText: { first: string; accent: string }
    email: string
    phone: string
    instagram: { handle: string; url: string; followers: string; posts: string }
    youtube: { url: string }
    markets: { city: string; region: string }[]
    location: { base: string }
    integrations: {
      calcom: { username: string; eventSlug: string }
      tally: { bookingFormId: string }
      stripe: {
        tipLinks: { support5: string; request10: string; priority20: string; shoutout50: string }
        depositLink: string
      }
    }
    accentColor: string
    customDomain: string
  }

  const markets = (c.markets || []).filter((m: { city: string }) => m.city)
  const marketsString = markets.map((m: { city: string }) => m.city).join(', ').replace(/, ([^,]*)$/, ' & $1')
  const footerLine = markets.map((m: { city: string }) => m.city).join(' \u2022 ')
  const siteUrl = c.customDomain ? `https://${c.customDomain}` : `https://beyondamedium.io/sites/${slug}`

  return `/**
 * BAM Brand Configuration
 * ========================
 * Central config for the entire site.
 * Powered by BAM — BeyondAMedium LLC
 */

export const brand = {
  name: ${JSON.stringify(c.name)},
  shortName: ${JSON.stringify(c.shortName)},
  tagline: ${JSON.stringify(c.tagline)},
  logoText: { first: ${JSON.stringify(c.logoText?.first || '')}, accent: ${JSON.stringify(c.logoText?.accent || '')} },

  email: ${JSON.stringify(c.email)},
  phone: ${JSON.stringify(c.phone || '')},
  instagram: {
    handle: ${JSON.stringify(c.instagram?.handle || '')},
    url: ${JSON.stringify(c.instagram?.url || '')},
    followers: ${JSON.stringify(c.instagram?.followers || '')},
    posts: "",
  },
  youtube: {
    url: ${JSON.stringify(c.youtube?.url || '')},
  },

  markets: ${JSON.stringify(markets, null, 4)},
  marketsString: ${JSON.stringify(marketsString)},

  integrations: {
    calcom: {
      username: ${JSON.stringify(c.integrations?.calcom?.username || '')},
      eventSlug: ${JSON.stringify(c.integrations?.calcom?.eventSlug || 'consultation')},
      embedUrl: ${JSON.stringify(c.integrations?.calcom?.username ? `https://cal.com/${c.integrations.calcom.username}/${c.integrations.calcom.eventSlug || 'consultation'}` : '')},
    },
    tally: {
      bookingFormId: ${JSON.stringify(c.integrations?.tally?.bookingFormId || 'YOUR_TALLY_FORM_ID')},
      bookingFormUrl: ${JSON.stringify(c.integrations?.tally?.bookingFormId ? `https://tally.so/r/${c.integrations.tally.bookingFormId}` : 'https://tally.so/r/YOUR_TALLY_FORM_ID')},
    },
    stripe: {
      tipLinks: {
        support5: ${JSON.stringify(c.integrations?.stripe?.tipLinks?.support5 || 'https://buy.stripe.com/YOUR_LINK_5')},
        request10: ${JSON.stringify(c.integrations?.stripe?.tipLinks?.request10 || 'https://buy.stripe.com/YOUR_LINK_10')},
        priority20: ${JSON.stringify(c.integrations?.stripe?.tipLinks?.priority20 || 'https://buy.stripe.com/YOUR_LINK_20')},
        shoutout50: ${JSON.stringify(c.integrations?.stripe?.tipLinks?.shoutout50 || 'https://buy.stripe.com/YOUR_LINK_50')},
      },
      depositLink: ${JSON.stringify(c.integrations?.stripe?.depositLink || 'https://buy.stripe.com/YOUR_DEPOSIT_LINK')},
    },
  },

  location: {
    base: ${JSON.stringify(c.location?.base || '')},
    servingLine: ${JSON.stringify(`Serving ${marketsString}`)},
    footerLine: ${JSON.stringify(footerLine)},
  },

  seo: {
    siteUrl: ${JSON.stringify(siteUrl)},
    title: ${JSON.stringify(`${c.name} | Premium Open Format DJ — ${marketsString}`)},
    titleTemplate: ${JSON.stringify(`%s | ${c.name}`)},
    description: ${JSON.stringify(`High-energy open format DJ for weddings, private parties, nightlife, and corporate events across ${marketsString}.`)},
    ogTitle: ${JSON.stringify(`${c.name} | Premium Open Format DJ`)},
    ogImage: "/og-image.jpg",
    keywords: [
      ${markets.map((m: { city: string }) => `"DJ ${m.city}"`).join(', ')},
      "wedding DJ", "event DJ", "open format DJ", "private party DJ", "corporate event DJ",
      ${JSON.stringify(c.name)},
    ],
  },

  stats: {
    eventsPlayed: "100+",
    citiesServed: "${markets.length}",
    happyClients: "100+",
    repeatRate: "75%",
    avgRating: "5.0",
  },

  copy: {
    heroHeadline: "The DJ That Moves\\nthe Entire Room",
    heroSubheadline: ${JSON.stringify(`Premium open format sets for clients who refuse to settle for background noise. Weddings, nightlife, private events — ${marketsString}.`)},
    heroBadge: "Now Accepting Select Bookings for ${new Date().getFullYear()}–${new Date().getFullYear() + 1}",
    scarcity: [
      "Prime weekends fill fast",
      "High-demand dates go first",
      "Now accepting select events",
    ],
    reversePsychology: {
      headline: "Not every event needs the same energy.",
      subline: ${JSON.stringify(`${c.shortName} is for clients who want the room to actually move.`)},
      bullets: [
        "Best for hosts who care about the experience",
        "Not background music — this is a performance",
        "If your guests sit down, something went wrong",
      ],
    },
    reviewsHeadline: "Clients Don't Rebook DJs.\\nThey Rebook Experiences.",
    bookingHeadline: "Let's See If We're a Perfect Fit",
    bookingSubline: "A few details now saves time later. Tell me about your event and I'll get back to you within 24 hours.",
    whySection: {
      eyebrow: ${JSON.stringify(`Why ${c.shortName}`)},
      title: "The Difference Is in the Experience",
      description: "Not just a DJ — a complete entertainment experience built on crowd psychology, musical versatility, and an obsession with making every event unforgettable.",
    },
    finalCtaButton: ${JSON.stringify(`Book ${c.shortName}`)},
    footerDescription: ${JSON.stringify(`Premium open format DJ for weddings, private parties, nightlife, and corporate events across ${marketsString}.`)},
    bookMeta: { title: ${JSON.stringify(`Book ${c.name}`)}, description: ${JSON.stringify(`Book ${c.name} for your next event. Weddings, private parties, nightlife, and corporate events across ${marketsString}.`)} },
    contactMeta: { title: ${JSON.stringify(`Contact ${c.name}`)}, description: ${JSON.stringify(`Get in touch with ${c.name} for booking inquiries, questions, or collaboration opportunities.`)} },
    reviewsMeta: { title: "Reviews & Testimonials", description: ${JSON.stringify(`Read reviews from real clients who booked ${c.name} for their weddings, parties, and events across ${marketsString}.`)} },
    songRequestMeta: { title: "Request a Song — Tips & Dedications", description: ${JSON.stringify(`Request a song, send a shoutout, or tip ${c.name}. Priority requests, birthday dedications, and more.`)} },
    privacyMeta: { title: "Privacy Policy", description: ${JSON.stringify(`Privacy policy for ${c.name}'s website and services.`)} },
    termsMeta: { title: "Terms of Service", description: ${JSON.stringify(`Terms of service for ${c.name}'s website and booking services.`)} },
  },

  bam: {
    name: "BAM",
    fullName: "BeyondAMedium LLC",
    url: "https://beyondamedium.io",
  },
} as const;

export type BrandConfig = typeof brand;
`
}

// ─── Add rewrite to beyondamedium-io vercel.json ──────────────────

async function addRewriteToVercelJson(
  ghHeaders: Record<string, string>,
  slug: string,
  deployUrl: string
) {
  const bamRepo = 'ialchemyio/beyondamedium-io'

  try {
    // Get current vercel.json
    const fileRes = await fetch(
      `https://api.github.com/repos/${bamRepo}/contents/vercel.json`,
      { headers: ghHeaders }
    )

    if (!fileRes.ok) return // vercel.json doesn't exist, skip

    const fileData = await fileRes.json()
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
    const config = JSON.parse(content)

    // Normalize deployUrl to origin only
    const origin = deployUrl.replace(/\/$/, '')

    // Check if rewrite already exists
    const existing = config.rewrites?.find(
      (r: { source: string }) => r.source === `/sites/${slug}` || r.source === `/sites/${slug}/:path*`
    )
    if (existing) return // Already exists

    // Add new rewrites
    config.rewrites = config.rewrites || []
    config.rewrites.push(
      { source: `/sites/${slug}`, destination: `${origin}/` },
      { source: `/sites/${slug}/:path*`, destination: `${origin}/:path*` }
    )

    // Push updated vercel.json
    await fetch(
      `https://api.github.com/repos/${bamRepo}/contents/vercel.json`,
      {
        method: 'PUT',
        headers: { ...ghHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Add rewrite for /sites/${slug}`,
          content: Buffer.from(JSON.stringify(config, null, 2)).toString('base64'),
          sha: fileData.sha,
        }),
      }
    )
  } catch {
    // Non-fatal — rewrites can be added manually
  }
}
