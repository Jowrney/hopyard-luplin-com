import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

test('repository uses the MIT License for the complete source tree', () => {
  const license = read('LICENSE')
  assert.match(license, /^MIT License/)
  assert.match(license, /HOPEDEN Agricultural Corporation/)
  assert.match(license, /Permission is hereby granted, free of charge/)
  assert.match(license, /copyright notice and this permission notice shall be included/)
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/)
  assert.match(license, /IN NO EVENT SHALL THE[\s\S]*AUTHORS OR COPYRIGHT HOLDERS BE LIABLE/)
})

test('README identifies the repository license as MIT', () => {
  const readme = read('README.md')
  assert.match(readme, /## License[\s\S]*MIT/)
  assert.doesNotMatch(readme, /Apache-2\.0|LICENSE-MAP\.md/)
})

test('package metadata identifies MIT consistently', () => {
  const packageJson = JSON.parse(read('package.json')) as { license?: string }
  assert.equal(packageJson.license, 'MIT')
})
