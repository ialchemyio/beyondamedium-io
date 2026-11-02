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

// $ per million tokens, from Anthropic's price list. Unknown models log no cost.
const PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
}

/** Estimated API cost of one response in USD (output includes thinking tokens), or null if the model isn't priced. */
export function estimateCostUsd(model: string, usage: Anthropic.Usage): number | null {
  const p = PRICES[model]
  if (!p) return null
  const cost = (usage.input_tokens * p.input
    + usage.output_tokens * p.output
    + (usage.cache_read_input_tokens ?? 0) * p.cacheRead
    + (usage.cache_creation_input_tokens ?? 0) * p.cacheWrite) / 1_000_000
  return Math.round(cost * 100_000) / 100_000
}

/**
 * Record what an AI call cost, next to what it charged, so margins are measured
 * rather than guessed. Always prints one JSON line to the server log; also writes
 * to `ai_usage` when that table exists. Never throws: logging must not fail a build.
 */
export async function logAiUsage(entry: {
  route: string; userId: string; projectId?: string | null
  message: Anthropic.Message; credits: number; ok: boolean
}): Promise<void> {
  const { usage, model } = entry.message
  const row = {
    route: entry.route,
    user_id: entry.userId,
    project_id: entry.projectId ?? null,
    model,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cache_read_tokens: usage.cache_read_input_tokens ?? 0,
    cache_write_tokens: usage.cache_creation_input_tokens ?? 0,
    est_cost_usd: estimateCostUsd(model, usage),
    credits: entry.credits,
    ok: entry.ok,
  }
  console.log(JSON.stringify({ ai_usage: row }))
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await db.from('ai_usage').insert(row)
    if (error) console.warn('ai_usage insert skipped:', error.message)
  } catch (e) {
    console.warn('ai_usage insert skipped:', e instanceof Error ? e.message : e)
  }
}
