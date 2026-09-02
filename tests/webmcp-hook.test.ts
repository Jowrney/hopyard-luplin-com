import assert from 'node:assert/strict'
import test from 'node:test'
import { isExpectedAbortError } from '../lib/webmcp/use-safe-webmcp'

test('WebMCP cleanup ignores only AbortError rejections', () => {
  assert.equal(isExpectedAbortError(new DOMException('aborted', 'AbortError')), true)
  assert.equal(isExpectedAbortError({ name: 'AbortError' }), true)
  assert.equal(isExpectedAbortError(new Error('registration failed')), false)
})
