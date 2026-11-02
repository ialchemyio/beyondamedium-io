import Anthropic from '@anthropic-ai/sdk'

/**
 * Model for every site-building call. Was a hardcoded, since-retired
 * `claude-sonnet-4-20250514` in three routes (all AI features 404'd).
 * Override with ANTHROPIC_MODEL without a code change.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'

/**
 * The response's text, or null when there's nothing usable. Current models
 * think by default, so the first content block can be `thinking`, not text.
 * A refusal or a reply cut off at max_tokens is treated as no result so the
 * caller refunds instead of saving half a page.
 */
export function responseText(message: Anthropic.Message): string | null {
  if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') return null
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()
  return text || null
}

/** User-facing message for a failed AI call; raw API errors stay in the server log. */
export function aiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Anthropic.APIError) {
    console.error(`Anthropic API error ${error.status}:`, error.message)
    return error.status === 429 || error.status === 529
      ? 'The AI service is busy right now. Please try again in a minute.'
      : 'The AI service returned an error. Please try again.'
  }
  return error instanceof Error ? error.message : fallback
}
