import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DESIGN_DIRECTIONS, buildAgentSystem, buildGenerateSystem } from './beyond-design'

// Every AI-generated customer site inherits these prompts, so fabricated social
// proof here would ship on every site. Check both builders for every direction.
const builders = { buildGenerateSystem, buildAgentSystem }

for (const [name, build] of Object.entries(builders)) {
  for (const dir of [undefined, ...DESIGN_DIRECTIONS.map(d => d.key)]) {
    test(`${name}(${dir ?? 'default'}) forbids invented social proof`, () => {
      const system = build(dir)
      assert.ok(!system.includes('testimonials with full names'), 'still asks the model to invent testimonials')
      assert.ok(!/invent a plausible/i.test(system), 'still asks the model to invent a brand')
      assert.ok(system.includes('NEVER INVENT social proof or facts'), 'missing the never-invent rule')
      assert.ok(system.includes('[Testimonial: add a real customer quote]'), 'missing the placeholder example')
      assert.ok(system.includes('[Price]'), 'missing the price placeholder')
    })
  }
}
