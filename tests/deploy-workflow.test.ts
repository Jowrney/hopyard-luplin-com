import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8')

test('deployment ships the checked-out commit instead of pulling from the private repo on the server', () => {
  assert.match(workflow, /actions\/checkout@/)
  assert.match(workflow, /appleboy\/scp-action@/)
  assert.doesNotMatch(workflow, /git pull origin main/)
})

test('deployment can be run manually and verifies the public demo route', () => {
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /\/design\/demo/)
  assert.match(workflow, /curl -fsS/)
})
