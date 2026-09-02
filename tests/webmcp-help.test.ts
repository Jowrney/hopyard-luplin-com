import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  CORE_WEBMCP_TOOLS,
  PREVIEW_WEBMCP_TOOLS,
  WEBMCP_TEST_PROMPTS,
} from '../lib/webmcp/help-content'

test('WebMCP help lists core and preview-only tools accurately', () => {
  assert.deepEqual(CORE_WEBMCP_TOOLS, [
    'get_design_context',
    'list_regional_profiles',
    'simulate_design',
    'show_candidates',
    'preview_candidate',
  ])
  assert.deepEqual(PREVIEW_WEBMCP_TOOLS, ['apply_candidate', 'discard_preview'])
})

test('WebMCP help provides equivalent English and Korean human-in-the-loop test prompts', () => {
  assert.match(WEBMCP_TEST_PROMPTS.en, /two design alternatives/i)
  assert.match(WEBMCP_TEST_PROMPTS.en, /wait for my approval/i)
  assert.match(WEBMCP_TEST_PROMPTS.ko, /두 개의 설계 대안/)
  assert.match(WEBMCP_TEST_PROMPTS.ko, /승인/)
})

test('the WebMCP status button opens the bilingual help dialog', () => {
  const source = readFileSync('components/webmcp/DesignWebMCP.tsx', 'utf8')
  assert.match(source, /WebMCPHelpDialog/)
  assert.match(source, /setHelpOpen\(true\)/)
})
