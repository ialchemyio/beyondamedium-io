import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { deductCredits, refundCredits } from '@/lib/credits'
import { CREDIT_COSTS } from '@/lib/credit-costs'
import { rateLimit } from '@/lib/rate-limit'
import { requireUser, userOwnsProject } from '@/lib/api-auth'
import { pageText, parseSeoJson, normalizeSeo, mergeSeo, SEO_TITLE_MAX, SEO_DESC_MAX, type SeoMap } from '@/lib/seo'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are the SEO writer for Beyond A Medium. For each page you are given, write a search
title and a meta description that a real person would click.

RULES:
- Title: at most ${SEO_TITLE_MAX} characters. Lead with what the page is about, then the brand,
  e.g. "Menu | Harbor & Vine". The home page leads with the business and what it does.
- Description: 120-${SEO_DESC_MAX} characters, one or two plain sentences, specific to that page.
- Use only facts present in the page text. Never invent prices, ratings, awards, or locations.
- No keyword stuffing, no ALL CAPS, no emoji.

Output ONLY a JSON array, no prose and no code fences:
[{ "slug": "<page slug>", "title": "...", "description": "..." }]`

// POST { projectId } — generate titles + meta descriptions for every page of a project.
export async function POST(request: Request) {
  let refund: { userId: string } | null = null
  const cost = CREDIT_COSTS.seo_all_pages
  try {
    const { projectId } = await request.json().catch(() => ({}))
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI is not configured on this server' }, { status: 503 })
    }

    const supabase = await createClient()
    const auth = await requireUser(supabase)
    if ('response' in auth) return auth.response
    const { user } = auth

    if (!(await userOwnsProject(supabase, projectId, user.id))) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const rl = rateLimit(`seo:${user.id}`, 6, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    const [{ data: project }, { data: pages }] = await Promise.all([
      supabase.from('projects').select('name, description, settings').eq('id', projectId).single(),
      supabase.from('pages').select('title, slug, html, is_home').eq('project_id', projectId).order('sort_order'),
    ])
    if (!project || !pages?.length) {
      return NextResponse.json({ error: 'This project has no pages yet.' }, { status: 400 })
    }

    const deduct = await deductCredits(user.id, cost, 'seo_all_pages')
    if (!deduct.ok) {
      return NextResponse.json({ error: 'Insufficient credits', upgrade: true, needed: cost }, { status: 402 })
    }
    refund = { userId: user.id }

    const pageBlocks = pages.slice(0, 20).map(p =>
      `<page slug="${p.slug}" title="${(p.title || '').replace(/"/g, "'")}"${p.is_home ? ' home="true"' : ''}>\n${pageText(p.html || '', 1800) || '(empty page)'}\n</page>`,
    ).join('\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Brand: ${project.name}${project.description ? `\nAbout: ${project.description}` : ''}\n\n${pageBlocks}`,
      }],
    })

    const block = message.content[0]
    const entries = block?.type === 'text' ? parseSeoJson(block.text) : null
    const generated: SeoMap = entries ? normalizeSeo(entries, pages.map(p => p.slug)) : {}
    if (!Object.keys(generated).length) throw new Error('The AI did not return usable SEO. No credits were used.')

    const settings = (project.settings ?? {}) as Record<string, unknown>
    const seo = mergeSeo(settings.seo as SeoMap | undefined, generated)
    const { error: saveErr } = await supabase
      .from('projects')
      .update({ settings: { ...settings, seo }, updated_at: new Date().toISOString() })
      .eq('id', projectId)
    if (saveErr) throw new Error(`Could not save SEO: ${saveErr.message}`)

    refund = null
    return NextResponse.json({
      seo,
      generated: Object.keys(generated).length,
      credits: {
        deducted: deduct.deducted, remaining: deduct.total, monthly: deduct.monthly,
        usagePercent: deduct.usagePercent, warningLevel: deduct.warningLevel,
      },
    })
  } catch (error: unknown) {
    if (refund) { try { await refundCredits(refund.userId, cost, 'seo_all_pages') } catch { /* ignore */ } }
    const msg = error instanceof Error ? error.message : 'SEO generation failed'
    console.error('SEO generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
