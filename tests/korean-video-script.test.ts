import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

type VideoSegment = {
  scene: string
  ko: string
  koSpoken?: string
}

const segments = JSON.parse(
  readFileSync('submission/video-segments.json', 'utf8'),
) as VideoSegment[]
const byScene = new Map(segments.map((segment) => [segment.scene, segment]))

test('Korean video localizes product and challenge names for natural narration', () => {
  assert.match(byScene.get('landing')?.ko ?? '', /홉 야드 디자이너/)
  assert.match(byScene.get('webmcp-tools')?.ko ?? '', /웹 MCP 챌린지/)
  assert.match(byScene.get('webmcp-tools')?.koSpoken ?? '', /웹 엠씨피 챌린지/)
  assert.doesNotMatch(segments.map((segment) => segment.ko).join('\n'), /Hopyard Designer|HOPEDEN|WebMCP Challenge/)
})

test('Korean video uses concise requested collaboration wording', () => {
  assert.doesNotMatch(byScene.get('simulate')?.ko ?? '', /출처가 있는/)
  assert.match(byScene.get('preview')?.ko ?? '', /선택한 후보가 화면에서/)
  assert.match(byScene.get('approval')?.ko ?? '', /적용과 취소/)
  assert.match(byScene.get('integrity')?.ko ?? '', /농가가 취소를 선택합니다/)
  assert.match(byScene.get('impact')?.ko ?? '', /투명하게 사람과/)
  assert.match(byScene.get('closing')?.ko ?? '', /홉이든의 홉 야드 디자이너/)
})
