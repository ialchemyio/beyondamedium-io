import { test } from 'node:test'
import assert from 'node:assert/strict'
import type Anthropic from '@anthropic-ai/sdk'
import { estimateCostUsd, responseText } from './ai'

const usage = (input: number, output: number, cacheRead = 0, cacheWrite = 0) =>
  ({ input_tokens: input, output_tokens: output, cache_read_input_tokens: cacheRead, cache_creation_input_tokens: cacheWrite }) as Anthropic.Usage

const msg = (content: unknown[], stop_reason = 'end_turn') =>
  ({ content, stop_reason, model: 'claude-sonnet-5-5', usage: usage(0, 0) }) as unknown as Anthropic.Message

test('estimateCostUsd prices input, output and cache tokens per million', () => {
  // 10k in × $2 + 20k out × $10 + 5k cache read × $0.20 = 0.02 + 0.2 + 0.001
  assert.equal(estimateCostUsd('claude-sonnet-5-5', usage(10_000, 20_000, 5_000)), 0.221)
  assert.equal(estimateCostUsd('some-unpriced-model', usage(1, 1)), null)
})

test('responseText skips thinking blocks and joins the text', () => {
  const m = msg([{ type: 'thinking', thinking: '' }, { type: 'text', text: '{"a":' }, { type: 'text', text: '1}' }])
  assert.equal(responseText(m), '{"a":1}')
})

test('responseText treats refusals, truncation and empty replies as no result', () => {
  assert.equal(responseText(msg([{ type: 'text', text: 'partial' }], 'max_tokens')), null)
  assert.equal(responseText(msg([], 'refusal')), null)
  assert.equal(responseText(msg([{ type: 'thinking', thinking: '' }])), null)
})
