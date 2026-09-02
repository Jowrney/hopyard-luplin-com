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

test('desktop header centers the logo between icon-only panel toggles', () => {
  assert.match(source, /grid-template-columns:\s*1fr auto 1fr/)
  assert.match(source, /<HeaderCenter>/)
  assert.match(source, /aria-label={text\('Open design inputs'/)
  assert.match(source, /aria-label={text\('Open review & estimate'/)
  assert.doesNotMatch(source, /PanelToggleLabel/)
})

test('desktop header keeps language, safety, and estimate actions on top', () => {
  const headerStart = source.indexOf('<PageHeader>')
  const header = source.slice(headerStart, source.indexOf('</PageHeader>', headerStart))
  assert.match(header, /<LanguageSwitcher/)
  assert.match(header, /<SafetyBadge/)
  assert.match(header, /Estimate PDF/)
})

test('WebMCP and remaining details live in the review panel', () => {
  const rightPanelStart = source.indexOf('<RightPanel')
  assert.ok(rightPanelStart >= 0)
  const rightPanel = source.slice(rightPanelStart, source.indexOf('</RightPanel>', rightPanelStart))
  assert.match(rightPanel, /<DesignWebMCP/)
  assert.match(rightPanel, /<EstimatePanel/)
})

test('panels become overlay drawers below the desktop workspace breakpoint', () => {
  assert.match(source, /@media \(max-width: 1199px\)/)
  assert.match(source, /transform: translateX/)
  assert.match(source, /position:\s*fixed/)
})

test('each side panel has one scrolling owner', () => {
  const estimate = readFileSync('components/estimate/EstimatePanel.tsx', 'utf8')
  assert.doesNotMatch(estimate, /const ScrollArea[\s\S]*?overflow-y:\s*auto/)
  assert.doesNotMatch(estimate, /const PanelWrapper[\s\S]*?height:\s*100%/)
})

test('view mode labels are only 2D and 3D', () => {
  assert.match(source, /text\('2D', '2D'\)/)
  assert.match(source, /text\('3D', '3D'\)/)
  assert.doesNotMatch(source, /2D plan|3D perspective|2D 평면도|3D 투시도/)
})

test('workspace controls use Phosphor icons instead of text glyphs', () => {
  assert.match(source, /@phosphor-icons\/react/)
  assert.doesNotMatch(source, /<span>☰<\/span>|<span>▤<\/span>|📄|💾|📥/)
})
