import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeNextPath } from './safe-redirect'

test('safeNextPath keeps same-site paths', () => {
  assert.equal(safeNextPath('/dashboard/abc/editor'), '/dashboard/abc/editor')
  assert.equal(safeNextPath('/billing?x=1'), '/billing?x=1')
})

test('safeNextPath rejects anything that leaves the site', () => {
  for (const bad of ['@evil.com', '//evil.com', '/\\evil.com', 'https://evil.com', '', null, undefined]) {
    assert.equal(safeNextPath(bad), '/dashboard')
  }
})
