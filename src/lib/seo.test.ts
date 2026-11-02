import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  pageText, parseSeoJson, normalizeSeo, seoForPage, mergeSeo,
  SEO_TITLE_MAX, SEO_DESC_MAX,
} from './seo'

test('pageText strips tags, scripts, and styles and collapses whitespace', () => {
  const html = `<style>.a{color:red}</style><h1>Harbor &amp; Vine</h1>
    <script>alert(1)</script><p>Seasonal   dinners.</p>`
  assert.equal(pageText(html), 'Harbor & Vine Seasonal dinners.')
})

test('pageText bounds very long pages', () => {
  assert.ok(pageText('<p>' + 'word '.repeat(5000) + '</p>', 500).length <= 500)
})

test('parseSeoJson accepts fenced or bare JSON and rejects junk', () => {
  const arr = [{ slug: 'index', title: 'T', description: 'D' }]
  assert.deepEqual(parseSeoJson(JSON.stringify(arr)), arr)
  assert.deepEqual(parseSeoJson('```json\n' + JSON.stringify(arr) + '\n```'), arr)
  assert.deepEqual(parseSeoJson('{"pages":' + JSON.stringify(arr) + '}'), arr)
  assert.equal(parseSeoJson('not json'), null)
})

test('normalizeSeo keeps only known slugs and clamps lengths', () => {
  const out = normalizeSeo([
    { slug: 'index', title: 'x'.repeat(200), description: 'y'.repeat(400) },
    { slug: 'ghost', title: 'Not a page', description: 'nope' },
  ], ['index', 'about'])
  assert.deepEqual(Object.keys(out), ['index'])
  assert.ok(out.index.title.length <= SEO_TITLE_MAX)
  assert.ok(out.index.description.length <= SEO_DESC_MAX)
})

test('normalizeSeo drops entries with no usable title', () => {
  const out = normalizeSeo([{ slug: 'index', title: '   ', description: 'Something' }], ['index'])
  assert.deepEqual(out, {})
})

test('normalizeSeo trims at a word boundary with an ellipsis, not mid-word', () => {
  const desc = 'Seasonal dinners built around what local farms harvest each week, served in a small room by the harbor with a short natural wine list.'
  const out = normalizeSeo([{ slug: 'index', title: 'Harbor', description: desc + ' More words to push it well past the limit for sure.' }], ['index'])
  assert.ok(out.index.description.endsWith('…'))
  assert.ok(!/\s…$/.test(out.index.description))
})

test('normalizeSeo ignores non-string fields from the model', () => {
  const out = normalizeSeo([{ slug: 'index', title: 42, description: null } as unknown as { slug: string; title: string; description: string }], ['index'])
  assert.deepEqual(out, {})
})

test('mergeSeo overwrites generated pages and keeps the rest', () => {
  const merged = mergeSeo({ about: { title: 'A', description: 'a' }, index: { title: 'old', description: 'old' } }, { index: { title: 'new', description: 'new' } })
  assert.deepEqual(merged, { about: { title: 'A', description: 'a' }, index: { title: 'new', description: 'new' } })
})

test('seoForPage reads settings.seo safely', () => {
  const settings = { seo: { index: { title: 'Home | X', description: 'D' } } }
  assert.deepEqual(seoForPage(settings, 'index'), { title: 'Home | X', description: 'D' })
  assert.equal(seoForPage(settings, 'about'), null)
  assert.equal(seoForPage(null, 'index'), null)
  assert.equal(seoForPage({ seo: 'garbage' }, 'index'), null)
})
