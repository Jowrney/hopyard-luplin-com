import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('caption renderers keep subtitles above every scene with the candidate tray', () => {
  for (const path of [
    'scripts/video/render-submission-video.py',
    'scripts/video/render-korean-version.py',
  ]) {
    const source = readFileSync(path, 'utf8')
    assert.match(source, /['"]impact['"]/, `${path} must position impact captions above the candidate tray`)
  }
})
