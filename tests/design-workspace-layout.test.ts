import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync('app/design/page.tsx', 'utf8')

test('design workspace exposes independent input and review panel toggles', () => {
  assert.match(source, /leftPanelOpen/)
  assert.match(source, /rightPanelOpen/)
  assert.match(source, /aria-controls="design-input-panel"/)
  assert.match(source, /aria-controls="design-review-panel"/)
  assert.match(source, /PanelBackdrop/)
})

test('WebMCP, safety, language, and document actions live in the review panel', () => {
  const rightPanelStart = source.indexOf('<RightPanel')
  assert.ok(rightPanelStart >= 0)
  const rightPanel = source.slice(rightPanelStart, source.indexOf('</RightPanel>', rightPanelStart))
  assert.match(rightPanel, /<LanguageSwitcher/)
  assert.match(rightPanel, /<DesignWebMCP/)
  assert.match(rightPanel, /<SafetyBadge/)
  assert.match(rightPanel, /Estimate PDF/)
})

test('panels become overlay drawers below the desktop workspace breakpoint', () => {
  assert.match(source, /@media \(max-width: 1199px\)/)
  assert.match(source, /transform: translateX/)
  assert.match(source, /position:\s*fixed/)
})
