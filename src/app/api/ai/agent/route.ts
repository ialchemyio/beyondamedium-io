import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AI_MODEL, responseText, aiErrorMessage, logAiUsage } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_COSTS } from '@/lib/stripe'
import { checkCredits, deductCredits, refundCredits } from '@/lib/credits'
import { userOwnsProject } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'
import { buildAgentSystem } from '@/lib/beyond-design'
import { isProjectLimitError, parseQuota, quotaReached } from '@/lib/project-limits'
import { newProjectSettings } from '@/lib/theme'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  let refundCtx: { userId: string; cost: number } | null = null
  try {
    const { prompt, projectId, style } = await request.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

    const creditCost = CREDIT_COSTS.agent_build

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit — agent builds are the most expensive AI call.
    const rl = rateLimit(`agent:${user.id}`, 10, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } })
    }

    // If targeting an existing project, the caller must own it (we delete its pages).
    if (projectId && !(await userOwnsProject(supabase, projectId, user.id))) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // A new project must fit the plan's project limit. Check before charging
    // credits or calling the model; the DB trigger is the final guard.
    if (!projectId) {
      const { data: quotaRow } = await supabase.rpc('my_project_quota')
      const quota = parseQuota(quotaRow)
      if (quotaReached(quota)) {
        return NextResponse.json({
          error: `Your ${quota?.plan ?? 'current'} plan includes ${quota?.max_projects} project${quota?.max_projects === 1 ? '' : 's'}, and you've used ${quota?.used}. Upgrade to build another site, or rebuild an existing project.`,
          upgrade: true,
          reason: 'projects',
        }, { status: 402 })
      }
    }

    // Credit check + deduct
    const check = await checkCredits(user.id, creditCost)
    if (!check.ok) {
      return NextResponse.json({
        error: 'Insufficient credits. Upgrade your plan for more AI power.',
        upgrade: true,
        needed: creditCost,
        remaining: check.total,
        warningLevel: 'critical',
      }, { status: 402 })
    }
    const deduct = await deductCredits(user.id, creditCost, 'agent_build')
    if (!deduct.ok) {
      return NextResponse.json({ error: 'Insufficient credits', upgrade: true, needed: creditCost }, { status: 402 })
    }
    refundCtx = { userId: user.id, cost: creditCost }

    // Call Claude
    // Streamed so a multi-page build can use a large budget (thinking shares it)
    // without tripping the SDK's non-streaming timeout guard.
    const message = await anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 32000,
      output_config: { effort: 'medium' },
      system: buildAgentSystem(style),
      messages: [{ role: 'user', content: `Build this website: "${prompt}"` }],
    }).finalMessage()

    const text = responseText(message)
    await logAiUsage({ route: 'agent_build', userId: user.id, projectId, message, credits: creditCost, ok: !!text })
    if (!text) {
      if (refundCtx) { await refundCredits(refundCtx.userId, refundCtx.cost, 'agent_build'); refundCtx = null }
      return NextResponse.json({ error: 'The AI did not return a site. No credits were used — please try again.' }, { status: 500 })
    }

    // Parse JSON response
    let result
    try {
      // Strip markdown fences if present
      const json = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '')
      result = JSON.parse(json)
    } catch {
      if (refundCtx) { await refundCredits(refundCtx.userId, refundCtx.cost, 'agent_build'); refundCtx = null }
      return NextResponse.json({ error: 'The AI returned a site we could not read. No credits were used — please try again.' }, { status: 500 })
    }
    if (!result || !Array.isArray(result.pages) || result.pages.length === 0) {
      if (refundCtx) { await refundCredits(refundCtx.userId, refundCtx.cost, 'agent_build'); refundCtx = null }
      return NextResponse.json({ error: 'Agent returned no pages' }, { status: 500 })
    }
    // Success from here — the build is committed; do not refund.
    refundCtx = null

    // If projectId provided, save pages directly
    if (projectId) {
      // Update project
      if (result.description) {
        await supabase.from('projects').update({
          description: result.description,
          updated_at: new Date().toISOString(),
        }).eq('id', projectId)
      }

      // Delete existing pages and create new ones
      await supabase.from('pages').delete().eq('project_id', projectId)

      for (let i = 0; i < result.pages.length; i++) {
        const page = result.pages[i]
        await supabase.from('pages').insert({
          project_id: projectId,
          title: page.title,
          slug: page.slug || (page.isHome ? 'index' : page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
          html: page.html,
          css: page.css || '',
          is_home: page.isHome ?? i === 0,
          sort_order: i,
        })
      }
    } else {
      // Create a new project
      const slug = (result.projectName || prompt)
        .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 40) + '-' + Date.now().toString(36)

      const { data: project, error: projError } = await supabase.from('projects').insert({
        user_id: user.id,
        name: result.projectName || prompt.slice(0, 50),
        slug,
        description: result.description || '',
        settings: newProjectSettings(),
      }).select().single()

      if (projError) {
        // The build ran but could not be saved: give the credits back.
        await refundCredits(user.id, creditCost, 'agent_build')
        if (isProjectLimitError(projError)) {
          return NextResponse.json({ error: 'You have reached your plan\'s project limit. Upgrade to build another site. Your credits were returned.', upgrade: true, reason: 'projects' }, { status: 402 })
        }
        return NextResponse.json({ error: `${projError.message}. Your credits were returned.` }, { status: 500 })
      }

      for (let i = 0; i < result.pages.length; i++) {
        const page = result.pages[i]
        await supabase.from('pages').insert({
          project_id: project.id,
          title: page.title,
          slug: page.slug || (page.isHome ? 'index' : page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
          html: page.html,
          css: page.css || '',
          is_home: page.isHome ?? i === 0,
          sort_order: i,
        })
      }

      result.projectId = project.id
      result.projectSlug = slug
    }

    return NextResponse.json({
      ...result,
      credits: {
        deducted: deduct.deducted,
        remaining: deduct.total,
        monthly: deduct.monthly,
        usagePercent: deduct.usagePercent,
        warningLevel: deduct.warningLevel,
      },
    })
  } catch (error: unknown) {
    if (refundCtx) { try { await refundCredits(refundCtx.userId, refundCtx.cost, 'agent_build') } catch { /* ignore */ } }
    const message = aiErrorMessage(error, 'Agent failed')
    console.error('Agent error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
