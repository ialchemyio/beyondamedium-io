import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeNextPath, publicOrigin } from './safe-redirect'

test('safeNextPath keeps same-site paths', () => {
  assert.equal(safeNextPath('/dashboard/abc/editor'), '/dashboard/abc/editor')
  assert.equal(safeNextPath('/billing?x=1'), '/billing?x=1')
})

test('safeNextPath rejects anything that leaves the site', () => {
  for (const bad of ['@evil.com', '//evil.com', '/\\evil.com', 'https://evil.com', '', null, undefined]) {
    assert.equal(safeNextPath(bad), '/dashboard')
  }
})

test('publicOrigin uses the browser-facing host, never the container address', () => {
  const req = (h: Record<string, string>) => new Request('https://0.0.0.0:3000/auth/callback', { headers: h })
  assert.equal(publicOrigin(req({ host: 'beyondamedium.io' })), 'https://beyondamedium.io')
  assert.equal(publicOrigin(req({ host: '0.0.0.0:3000', 'x-forwarded-host': 'www.beyondamedium.io' })), 'https://www.beyondamedium.io')
  assert.equal(publicOrigin(req({ host: 'localhost:3002' })), 'http://localhost:3002')
  assert.equal(publicOrigin(req({ host: 'evil.com' })), 'https://beyondamedium.io')
  assert.equal(publicOrigin(req({ host: '0.0.0.0:3000' })), 'https://beyondamedium.io')
})
