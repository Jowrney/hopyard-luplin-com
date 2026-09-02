import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { WEBMCP_ORIGIN_TRIAL_TOKEN } from '../lib/webmcp/origin-trial'

function decodeTokenPayload(token: string) {
  const decoded = Buffer.from(token, 'base64')
  const jsonStart = decoded.indexOf('{'.charCodeAt(0))
  assert.ok(jsonStart >= 0, 'Origin Trial token does not contain a JSON payload')
  return JSON.parse(decoded.subarray(jsonStart).toString('utf8')) as {
    origin: string
    feature: string
    expiry: number
  }
}

test('WebMCP Origin Trial token is scoped to the production origin and remains valid', () => {
  const payload = decodeTokenPayload(WEBMCP_ORIGIN_TRIAL_TOKEN)
  assert.equal(payload.origin, 'https://hopyard.luplin.com:443')
  assert.equal(payload.feature, 'WebMCP')
  assert.ok(payload.expiry > Date.now() / 1000)
})

test('root layout emits the Origin Trial token as an http-equiv meta tag', () => {
  const layout = readFileSync('app/layout.tsx', 'utf8')
  assert.match(layout, /httpEquiv="origin-trial"/)
  assert.match(layout, /WEBMCP_ORIGIN_TRIAL_TOKEN/)
})
