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

test('mobile centers the logo while desktop places the input button before the logo', () => {
  assert.match(source, /grid-template-columns:\s*1fr auto 1fr/)
  assert.match(source, /@media \(min-width: 1200px\)/)
  assert.match(source, /grid-template-columns:\s*auto auto 1fr/)
  const headerLeft = source.slice(source.indexOf('const HeaderLeft'), source.indexOf('const HeaderCenter'))
  const headerCenter = source.slice(source.indexOf('const HeaderCenter'), source.indexOf('const HeaderLogo'))
  assert.match(headerLeft, /grid-column:\s*1/)
  assert.match(headerCenter, /grid-column:\s*2/)
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
  assert.match(header, /<DesignWebMCP/)
  assert.match(header, /Save design/)
  assert.match(header, /<UserMenu/)
  assert.ok(header.indexOf('<DesignWebMCP') < header.indexOf('<LanguageSwitcher'))
  assert.ok(header.indexOf('<LanguageSwitcher') < header.indexOf('<SafetyBadge'))
  assert.ok(header.indexOf('<SafetyBadge') < header.indexOf('Estimate PDF'))
  assert.ok(header.indexOf('Estimate PDF') < header.indexOf('aria-controls="design-review-panel"'))
})

test('mobile-only utilities remain available in the review panel', () => {
  const rightPanelStart = source.indexOf('<RightPanel')
  assert.ok(rightPanelStart >= 0)
  const rightPanel = source.slice(rightPanelStart, source.indexOf('</RightPanel>', rightPanelStart))
  assert.match(rightPanel, /<MobileUtilities>[\s\S]*<DesignWebMCP/)
  assert.match(rightPanel, /<MobileUtilities>[\s\S]*<UserMenu/)
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
  assert.match(source, /aria-pressed={viewMode === mode}/)
})

test('canvas toolbar puts actions above a dedicated metrics row', () => {
  const toolbar = source.slice(source.indexOf('<ViewToolbar>'), source.indexOf('</ViewToolbar>'))
  assert.match(toolbar, /data-testid="view-action-row"/)
  assert.match(toolbar, /data-testid="view-metrics-row"/)
  assert.match(toolbar, /<ViewActionRow[\s>][\s\S]*<ViewTabs[\s>][\s\S]*<PngButton[\s\S]*<\/ViewActionRow>/)
  assert.ok(toolbar.indexOf('</ViewActionRow>') < toolbar.indexOf('<ChipsRow'))
})

test('design page exposes a heading and uniquely named panel landmarks', () => {
  assert.match(source, /<ScreenReaderTitle>/)
  assert.match(source, /aria-label={text\('Design inputs'/)
  assert.match(source, /aria-label={text\('Review & estimate'/)
})

test('workspace controls use Phosphor icons instead of text glyphs', () => {
  assert.match(source, /@phosphor-icons\/react/)
  assert.doesNotMatch(source, /<span>☰<\/span>|<span>▤<\/span>|📄|💾|📥/)
})
