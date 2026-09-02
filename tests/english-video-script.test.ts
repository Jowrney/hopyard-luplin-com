import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

type VideoSegment = {
  scene: string
  en: string
  spoken?: string
}

const segments = JSON.parse(
  readFileSync('submission/video-segments.json', 'utf8'),
) as VideoSegment[]
const byScene = new Map(segments.map((segment) => [segment.scene, segment]))

test('English demo uses conversational native product-demo phrasing', () => {
  assert.match(byScene.get('landing')?.en ?? '', /^Hi, this is Hopyard Designer/)
  assert.match(byScene.get('human-workflow')?.en ?? '', /Before adding WebMCP/)
  assert.match(byScene.get('human-choice')?.en ?? '', /the agent stops and waits/)
  assert.match(byScene.get('impact')?.en ?? '', /the farmer stays in control/)
})

test('English demo avoids translated and generic AI-demo phrasing', () => {
  const script = segments.map((segment) => segment.en).join('\n')
  assert.doesNotMatch(
    script,
    /human-operated design form|construction-oriented|interactive three-dimensional|current collaboration state|non-destructive alternatives|same visual workspace|preserving an exact snapshot|Final control remains|transparent human-agent design conversation/,
  )
})

test('English TTS has explicit pronunciation hints for product and training names', () => {
  assert.match(byScene.get('landing')?.spoken ?? '', /Hop yard Designer/)
  assert.match(byScene.get('webmcp-tools')?.spoken ?? '', /Web M C P Challenge/)
  assert.match(byScene.get('simulate')?.spoken ?? '', /eye-shaped.*why-shaped/)
  assert.match(byScene.get('closing')?.spoken ?? '', /Hop yard Designer by Hop Eden.*Web M C P/)
})
