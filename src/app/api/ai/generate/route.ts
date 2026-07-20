import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkCredits, deductCredits, refundCredits, getCostForMode } from '@/lib/credits'
import { rateLimit } from '@/lib/rate-limit'
import { buildGenerateSystem } from '@/lib/beyond-design'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  // Set once credits are deducted so we can refund if the AI call fails.
  let refundCtx: { userId: string; cost: number; mode: string } | null = null
  try {
    const { prompt, mode, selectedHtml, style } = await request.json()

    // Polish works on the existing page, so it doesn't need a prompt.
    if (!prompt && !(mode === 'polish' && selectedHtml)) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit AI generation per user (30/min covers heavy editing, blocks abuse).
    const rl = rateLimit(`generate:${user.id}`, 30, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    // Credit check + deduct (atomic via service role)
    const creditCost = getCostForMode(mode)
    const check = await checkCredits(user.id, creditCost)
    if (!check.ok) {
      return NextResponse.json({
        error: 'Insufficient credits',
        upgrade: true,
        needed: creditCost,
        remaining: check.total,
        usagePercent: check.usagePercent,
        warningLevel: 'critical',
      }, { status: 402 })
    }

    const deduct = await deductCredits(user.id, creditCost, mode || 'generate_page')
    if (!deduct.ok) {
      return NextResponse.json({
        error: 'Insufficient credits',
        upgrade: true,
        needed: creditCost,
      }, { status: 402 })
    }
    refundCtx = { userId: user.id, cost: creditCost, mode: mode || 'generate_page' }

    let userPrompt: string

    if (mode === 'edit' && selectedHtml) {
      userPrompt = `I have the following HTML element/section on my website:

<existing_html>
${selectedHtml}
</existing_html>

The user wants to make this change: "${prompt}"

Return the MODIFIED HTML that applies the requested change. Only return the modified HTML, nothing else. Keep the same structure but apply the changes requested.`
    } else if (mode === 'polish' && selectedHtml) {
      userPrompt = `Here is the current full HTML of a page:

<current_page>
${selectedHtml}
</current_page>

Redesign this page to studio quality while PRESERVING all existing content and meaning:
- Keep every section, all copy, links, and the information architecture. Do not invent new
  sections or delete existing ones.
- Elevate the visual craft: typography hierarchy and scale, spacing rhythm, color application,
  alignment, hover states, responsive behaviour.
- Replace any placeholder copy ("Lorem ipsum", "Your Headline Here", "Feature One") with
  specific, plausible copy that fits the page's evident subject.
${prompt ? `- Additionally apply this direction from the user: "${prompt}"` : ''}

Return only the improved HTML with a single <style> tag at the top.`
    } else if (mode === 'section') {
      userPrompt = `Generate a single website section based on this description: "${prompt}"

Return only the HTML for this one section with inline styles. Make it visually stunning and modern.`
    } else {
      userPrompt = `Generate a complete website page based on this description: "${prompt}"

Include these sections as appropriate:
- Navigation/header
- Hero section
- Features/services
- About/story section
- Testimonials or social proof
- Pricing (if relevant)
- Call-to-action
- Contact/footer

Make it a complete, beautiful, professional website page. Return only the HTML with a <style> tag at the top.`
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: buildGenerateSystem(style),
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      if (refundCtx) { await refundCredits(refundCtx.userId, refundCtx.cost, refundCtx.mode); refundCtx = null }
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }
    // Success — do not refund.
    refundCtx = null

    // Clean up any accidental markdown fences
    let html = content.text
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()

    return NextResponse.json({
      html,
      credits: {
        deducted: deduct.deducted,
        remaining: deduct.total,
        monthly: deduct.monthly,
        usagePercent: deduct.usagePercent,
        warningLevel: deduct.warningLevel,
      },
    })
  } catch (error: unknown) {
    if (refundCtx) { try { await refundCredits(refundCtx.userId, refundCtx.cost, refundCtx.mode) } catch { /* ignore */ } }
    const message = error instanceof Error ? error.message : 'AI generation failed'
    console.error('AI generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
