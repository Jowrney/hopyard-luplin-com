import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const form = readFileSync('submission/DEVPOST-FORM.md', 'utf8')

test('Devpost form copy includes project overview values', () => {
  assert.match(form, /## Project name\s+Hopyard Designer/)
  assert.match(form, /## Project tagline\s+[^#]+/)
})

test('Devpost project story covers every requested topic', () => {
  for (const heading of [
    '## Inspiration',
    '## What it does',
    '## How we built it',
    '## Challenges we ran into',
    '## What we learned',
  ]) {
    assert.match(form, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('Devpost technology tags stay within the visible limit', () => {
  const block = form.match(/## Built with[\s\S]*?```text\n([^`]+)```/)
  assert.ok(block)
  const tags = block[1].split(',').map((tag) => tag.trim()).filter(Boolean)
  assert.ok(tags.length > 0)
  assert.ok(tags.length <= 25)
})

test('Devpost copy includes demo, source, and MIT license information', () => {
  assert.match(form, /https:\/\/hopyard\.luplin\.com\/design\/demo/)
  assert.match(form, /https:\/\/hopyard\.luplin\.com\//)
  assert.match(form, /https:\/\/github\.com\/Jowrney\/hopyard-luplin-com/)
  assert.match(form, /complete source repository is available under the MIT License/)
  assert.match(form, /five to seven[\s\S]*returns to five tools/)
  assert.match(form, /Existing product and challenge work/)
  assert.doesNotMatch(form, /returns 404|Do not add the GitHub link/)
  assert.doesNotMatch(form, /must wait for the farmer before keeping or discarding/)
})
