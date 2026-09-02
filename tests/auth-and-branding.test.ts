import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

function sourceFiles(path: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const fullPath = join(path, entry.name)
    if (entry.isDirectory()) files.push(...sourceFiles(fullPath))
    else if (/\.(?:ts|tsx|md)$/.test(entry.name)) files.push(fullPath)
  }
  return files
}

test('email authentication remains available without Google OAuth', () => {
  const login = readFileSync('app/(auth)/login/page.tsx', 'utf8')
  const register = readFileSync('app/(auth)/register/page.tsx', 'utf8')
  assert.match(login, /signInWithPassword/)
  assert.match(register, /auth\.signUp/)
  assert.doesNotMatch(login, /signInWithOAuth|Continue with Google|Google 계정/)
  assert.doesNotMatch(register, /signInWithOAuth|Sign up with Google|Google 계정/)
})

test('landing exposes account entry points and the public challenge demo', () => {
  const source = readFileSync('app/page.tsx', 'utf8')
  assert.match(source, /href="\/login"/)
  assert.match(source, /href="\/register"/)
  assert.match(source, /href="\/design\/demo"/)
})

test('brand and corporate domain use canonical public spelling', () => {
  const files = [...sourceFiles('app'), ...sourceFiles('components'), ...sourceFiles('lib'), 'README.md']
  for (const path of files) {
    const source = readFileSync(path, 'utf8')
    assert.doesNotMatch(source, /HopEden|hopeden\.kr/, `${path} contains stale brand spelling`)
  }
  assert.match(readFileSync('app/page.tsx', 'utf8'), /HOPEDEN Agricultural Corporation.*hopeden\.com/)
})
