import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDomain, lookupKey, isPlatformHost, customDomainRewrite } from './custom-domains'

const ok = (input: string) => {
  const r = normalizeDomain(input)
  assert.ok('domain' in r, `expected ok for ${input}, got ${JSON.stringify(r)}`)
  return (r as { domain: string }).domain
}
const bad = (input: string) => {
  const r = normalizeDomain(input)
  assert.ok('error' in r, `expected error for ${input}, got ${JSON.stringify(r)}`)
}

test('normalizeDomain cleans what people paste', () => {
  assert.equal(ok('HarborVine.com'), 'harborvine.com')
  assert.equal(ok('  https://www.harborvine.com/menu?x=1 '), 'harborvine.com')
  assert.equal(ok('http://harborvine.com:443/'), 'harborvine.com')
  assert.equal(ok('harborvine.com.'), 'harborvine.com')
  assert.equal(ok('shop.harborvine.co.uk'), 'shop.harborvine.co.uk')
})

test('normalizeDomain rejects things that cannot be a customer domain', () => {
  bad('')
  bad('harborvine')            // no TLD
  bad('localhost')
  bad('192.168.1.10')          // IPs
  bad('harbor_vine.com')       // underscore
  bad('-harbor.com')           // leading hyphen
  bad('harbor..com')
  bad('a'.repeat(64) + '.com') // label too long
  bad('beyondamedium.io')      // the platform itself
  bad('www.beyondamedium.io')
  bad('evil.beyondamedium.io')
})

test('lookupKey maps apex and www to the same key and drops ports', () => {
  assert.equal(lookupKey('www.HarborVine.com:443'), 'harborvine.com')
  assert.equal(lookupKey('harborvine.com'), 'harborvine.com')
})

test('isPlatformHost: BAM hosts, localhost, and IPs are never treated as customer domains', () => {
  for (const h of ['beyondamedium.io', 'www.beyondamedium.io', 'localhost:3001', '127.0.0.1:3000', '[::1]:3000', '10.0.0.5', 'app.localhost']) {
    assert.equal(isPlatformHost(h), true, h)
  }
  assert.equal(isPlatformHost('harborvine.com'), false)
  assert.equal(isPlatformHost(null), true) // missing Host never routes to a tenant
})

test('customDomainRewrite: root and app paths serve the tenant site', () => {
  assert.equal(customDomainRewrite('harbor-vine', '/', ''), '/p/harbor-vine')
  assert.equal(customDomainRewrite('harbor-vine', '/', '?page=menu'), '/p/harbor-vine?page=menu')
  // BAM app routes must never show on a customer domain
  assert.equal(customDomainRewrite('harbor-vine', '/dashboard', ''), '/p/harbor-vine')
  assert.equal(customDomainRewrite('harbor-vine', '/login', ''), '/p/harbor-vine')
})

test('customDomainRewrite: the tenant\'s own /p/<slug> path passes through, others do not', () => {
  assert.equal(customDomainRewrite('harbor-vine', '/p/harbor-vine', '?page=menu'), null)
  assert.equal(customDomainRewrite('harbor-vine', '/p/someone-else', ''), '/p/harbor-vine')
})
