import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSitePrompt, validateBrief, MAX_EXTRA_PAGES, type SiteBrief } from './site-brief'

const base: SiteBrief = {
  name: 'Harbor & Vine',
  industry: 'Restaurant',
  location: 'Ventura, CA',
  offer: 'Seasonal dinners built around local produce.',
  audience: '',
  services: ['Tasting menu', 'Private dining', ''],
  phone: '',
  email: 'hello@harborvine.com',
  address: '',
  hours: '',
  pages: ['About', 'Menu'],
}

test('validateBrief requires a business name and what it offers', () => {
  assert.deepEqual(validateBrief(base), [])
  assert.ok(validateBrief({ ...base, name: '  ' }).some(e => /name/i.test(e)))
  assert.ok(validateBrief({ ...base, offer: '' }).some(e => /offer|what/i.test(e)))
})

test('validateBrief caps extra pages so the agent stays within 1-3 pages', () => {
  const tooMany = { ...base, pages: ['About', 'Menu', 'Contact'] }
  assert.ok(MAX_EXTRA_PAGES === 2)
  assert.ok(validateBrief(tooMany).some(e => /page/i.test(e)))
})

test('buildSitePrompt carries every supplied fact and the exact business name', () => {
  const p = buildSitePrompt(base)
  assert.match(p, /Harbor & Vine/)
  assert.match(p, /Restaurant/)
  assert.match(p, /Ventura, CA/)
  assert.match(p, /Seasonal dinners built around local produce\./)
  assert.match(p, /Tasting menu/)
  assert.match(p, /Private dining/)
  assert.match(p, /hello@harborvine\.com/)
  assert.match(p, /projectName.*Harbor & Vine/i)
})

test('buildSitePrompt lists Home plus the chosen pages, in order', () => {
  const p = buildSitePrompt(base)
  assert.match(p, /Home, About, Menu/)
})

test('buildSitePrompt omits empty optional fields instead of inventing them', () => {
  const p = buildSitePrompt(base)
  assert.doesNotMatch(p, /Phone:/)
  assert.doesNotMatch(p, /Hours:/)
  assert.doesNotMatch(p, /Address:/)
  assert.doesNotMatch(p, /Audience:/)
  // blank service lines are dropped
  assert.doesNotMatch(p, /- \s*\n/)
})

test('buildSitePrompt tells the agent not to fabricate missing facts', () => {
  assert.match(buildSitePrompt(base), /do not invent/i)
})

test('buildSitePrompt trims and bounds long free-text input', () => {
  const long = 'x'.repeat(5000)
  const p = buildSitePrompt({ ...base, offer: long })
  assert.ok(p.length < 4000, `prompt too long: ${p.length}`)
})
