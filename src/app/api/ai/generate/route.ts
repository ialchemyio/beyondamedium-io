import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CREDIT_COSTS } from '@/lib/stripe'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert web designer and developer. You generate beautiful, modern, production-ready HTML and CSS for websites.

RULES:
- Output ONLY valid HTML and CSS. No markdown, no explanations, no code fences.
- Use inline styles or a <style> tag in the HTML. No external CSS files.
- Use modern design: clean typography, good spacing, professional colors.
- Use the Inter font from Google Fonts (include the link tag).
- Make designs responsive using CSS grid/flexbox.
- Use real placeholder content (not lorem ipsum) — realistic business names, descriptions, prices.
- Include proper semantic HTML (section, header, nav, footer, etc).
- Make it look like a premium Squarespace/Framer template.
- For images, use placeholder divs with background colors and text like "Image" — do NOT use external image URLs.
- Output format: the complete HTML content for the page body (no <html>, <head>, or <body> tags — just the inner content with a <style> tag at the top if needed).`

export async function POST(request: Request) {
  try {
    const { prompt, mode, selectedHtml } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    // Credit cost tracking (logged, not blocking for MVP)
    const creditCost = mode === 'edit' ? CREDIT_COSTS.edit_element : mode === 'section' ? CREDIT_COSTS.generate_section : CREDIT_COSTS.generate_page
    console.log(`AI generation: mode=${mode}, cost=${creditCost} credits`)

    let userPrompt: string

    if (mode === 'edit' && selectedHtml) {
      userPrompt = `I have the following HTML element/section on my website:

<existing_html>
${selectedHtml}
</existing_html>

The user wants to make this change: "${prompt}"

Return the MODIFIED HTML that applies the requested change. Only return the modified HTML, nothing else. Keep the same structure but apply the changes requested.`
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
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    // Clean up any accidental markdown fences
    let html = content.text
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()

    return NextResponse.json({ html })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI generation failed'
    console.error('AI generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
