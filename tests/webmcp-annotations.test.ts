import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync('components/webmcp/DesignWebMCP.tsx', 'utf8')

function toolBlock(name: string, nextDeclaration: string): string {
  const start = source.indexOf(`name: '${name}'`)
  const end = source.indexOf(nextDeclaration, start)
  assert.ok(start >= 0 && end > start, `missing ${name} tool block`)
  return source.slice(start, end)
}

test('tools that change candidate or UI state are not annotated read-only', () => {
  assert.match(toolBlock('simulate_design', 'const showTool'), /readOnlyHint: false/)
  assert.match(toolBlock('show_candidates', 'const previewTool'), /readOnlyHint: false/)
  assert.match(toolBlock('preview_candidate', 'const applyTool'), /readOnlyHint: false/)
})

test('context and profile lookups remain read-only', () => {
  assert.match(toolBlock('get_design_context', 'const profilesTool'), /readOnlyHint: true/)
  assert.match(toolBlock('list_regional_profiles', 'const simulationTool'), /readOnlyHint: true/)
})
