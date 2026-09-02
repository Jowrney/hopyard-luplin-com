import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('training labels describe the rendered I and Y shapes while preserving wire enums', () => {
  const form = readFileSync('components/design/DesignInputForm.tsx', 'utf8')
  const canvas = readFileSync('components/canvas/FarmCanvas3D.tsx', 'utf8')
  const contracts = readFileSync('lib/webmcp/design-tool-contracts.ts', 'utf8')
  const video = readFileSync('submission/video-segments.json', 'utf8')

  assert.match(form, /Y-shaped training/)
  assert.match(form, /Y자형/)
  assert.match(form, /I-shaped training/)
  assert.match(form, /I자형/)
  assert.match(canvas, /Y-shaped training/)
  assert.match(contracts, /Y-shaped split training/)
  assert.match(video, /Korean I-shaped training/)
  assert.match(video, /Korean eye-shaped training/)
  assert.doesNotMatch(video, /Korean I-training/)
})
