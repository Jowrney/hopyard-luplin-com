import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import test from 'node:test'

const logoPath = 'public/brand/hopyard-designer.svg'

test('header logo is the supplied lightweight Hopyard Designer SVG', () => {
  const source = readFileSync(logoPath, 'utf8')
  assert.match(source, /viewBox="0 0 190\.73 20\.72"/)
  assert.ok(statSync(logoPath).size < 10_000)
})

test('all primary page headers use the shared brand logo', () => {
  for (const path of ['app/page.tsx', 'app/design/page.tsx', 'app/projects/page.tsx', 'app/admin/page.tsx']) {
    const source = readFileSync(path, 'utf8')
    assert.match(source, /<BrandLogo/)
  }
})
