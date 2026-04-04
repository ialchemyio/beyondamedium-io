import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { CREDIT_COSTS } from '@/lib/stripe'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const AGENT_SYSTEM = `You are BAM OS Builder Agent — an autonomous AI that builds complete websites.

When a user describes what they want, you plan and execute the build in structured steps. You output a JSON object with the following structure:

{
  "plan": [
    { "step": 1, "action": "planning", "description": "Analyzing requirements..." },
    { "step": 2, "action": "structure", "description": "Creating page structure..." },
    { "step": 3, "action": "content", "description": "Writing copy and content..." },
    { "step": 4, "action": "styling", "description": "Applying design and styling..." },
    { "step": 5, "action": "complete", "description": "Finalizing and optimizing..." }
  ],
  "pages": [
    {
      "title": "Home",
      "slug": "index",
      "isHome": true,
      "html": "<full HTML content with inline styles>",
      "css": "<additional CSS if needed>"
    }
  ],
  "projectName": "suggested project name",
  "description": "site description for SEO"
}

RULES:
- Output ONLY valid JSON. No markdown, no explanations.
- Generate complete, beautiful, production-ready HTML with inline styles.
- Use Inter font (include Google Fonts link in first page's HTML).
- Include Tailwind CDN in the first page's HTML style block.
- Make designs premium quality — like a $5000 agency website.
- Use realistic content — real business names, descriptions, prices. Not lorem ipsum.
- For images, use colored placeholder divs (not external URLs).
- Include proper semantic HTML.
- Generate 1-3 pages depending on the request complexity.
- Each page should be a complete standalone page.
- Make it responsive.
- Include navigation between pages if multiple pages.`

export async function POST(request: Request) {
  try {
    const { prompt, projectId } = await request.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

    // Credit check for agent (costs more)
    const creditCost = CREDIT_COSTS.agent_build
    const creditRes = await fetch(new URL('/api/credits', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
      body: JSON.stringify({ action: 'agent_build', amount: creditCost }),
    })
    if (!creditRes.ok) {
      const creditData = await creditRes.json()
      if (creditData.upgrade) {
        return NextResponse.json({ error: 'Insufficient credits. Upgrade your plan for more AI power.', upgrade: true, needed: creditCost }, { status: 402 })
      }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: AGENT_SYSTEM,
      messages: [{ role: 'user', content: `Build this website: "${prompt}"` }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return NextResponse.json({ error: 'Unexpected response' }, { status: 500 })

    // Parse JSON response
    let result
    try {
      let text = content.text.trim()
      // Strip markdown fences if present
      text = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '')
      result = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: 'Failed to parse agent response', raw: content.text }, { status: 500 })
    }

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
      }).select().single()

      if (projError) return NextResponse.json({ error: projError.message }, { status: 500 })

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

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Agent failed'
    console.error('Agent error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
