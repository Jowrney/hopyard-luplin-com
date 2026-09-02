import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const contractFiles = [
  'components/webmcp/DesignWebMCP.tsx',
  'lib/webmcp/design-tool-contracts.ts',
]

test('WebMCP contracts stay English-first for interoperable agents', () => {
  for (const path of contractFiles) {
    const source = readFileSync(path, 'utf8')
    assert.doesNotMatch(source, /[가-힣]/, `${path} contains Korean contract text`)
  }
})
