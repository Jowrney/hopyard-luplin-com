import assert from 'node:assert/strict'
import test from 'node:test'
import { isGuestDemoPath, isProtectedAppPath } from '../lib/auth/routes'

test('only the explicit design demo bypasses authenticated app routes', () => {
  assert.equal(isProtectedAppPath('/design'), true)
  assert.equal(isProtectedAppPath('/design/saved-id'), true)
  assert.equal(isProtectedAppPath('/projects'), true)
  assert.equal(isProtectedAppPath('/admin'), true)
  assert.equal(isProtectedAppPath('/design/demo'), false)
  assert.equal(isProtectedAppPath('/design/demo/extra'), true)
  assert.equal(isGuestDemoPath('/design/demo'), true)
  assert.equal(isGuestDemoPath('/design'), false)
})
