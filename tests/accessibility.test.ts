import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('numeric design inputs have programmatically associated labels', () => {
  const source = readFileSync('components/design/DesignInputForm.tsx', 'utf8')
  assert.match(source, /const inputId = useId\(\)/)
  assert.match(source, /<NumLabel htmlFor={inputId}>/)
  assert.match(source, /id={inputId}/)
})

test('WebMCP help moves focus into the dialog and restores it on close', () => {
  const source = readFileSync('components/webmcp/WebMCPHelpDialog.tsx', 'utf8')
  const owner = readFileSync('components/webmcp/DesignWebMCP.tsx', 'utf8')
  assert.match(source, /closeButtonRef\.current\?\.focus\(\)/)
  assert.match(source, /previousFocusRef\.current\?\.focus\(\)/)
  assert.match(source, /dialogRef\.current/)
  assert.match(owner, /const closeHelp = useCallback/)
  assert.match(owner, /onClose={closeHelp}/)
})
