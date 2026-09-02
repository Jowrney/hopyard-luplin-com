import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const form = readFileSync('submission/DEVPOST-FORM.md', 'utf8')

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
  assert.match(form, /https:\/\/github\.com\/Jowrney\/hopyard-luplin-com/)
  assert.match(form, /complete source repository is available under the MIT License/)
})
