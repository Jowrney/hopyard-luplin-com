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
  assert.match(byScene.get('simulate')?.ko ?? '', /기존 설계는 건드리지 않은 채/)
  assert.match(byScene.get('preview')?.ko ?? '', /선택한 안은 2차원과 3차원 화면에 바로 반영/)
  assert.match(byScene.get('approval')?.ko ?? '', /적용과 취소 도구가 추가돼/)
  assert.match(byScene.get('integrity')?.ko ?? '', /이번에는 농가가 취소를 선택/)
  assert.match(byScene.get('impact')?.ko ?? '', /같은 화면에서 함께 검토/)
  assert.match(byScene.get('closing')?.ko ?? '', /웹 MCP를 적용한 홉이든의 홉 야드 디자이너/)
})

test('Korean narration avoids translated or bureaucratic phrasing', () => {
  const script = segments.map((segment) => segment.ko).join('\n')
  assert.doesNotMatch(script, /상호작용 가능한|시공 중심의|협업 상태|정확한 스냅샷|설계 대화|화면 클릭을 추측/)
})
