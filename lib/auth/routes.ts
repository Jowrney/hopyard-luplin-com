const PROTECTED_PREFIXES = ['/design', '/projects', '/admin'] as const
const GUEST_DEMO_PATH = '/design/demo'

export function isGuestDemoPath(pathname: string): boolean {
  return pathname === GUEST_DEMO_PATH
}

export function isProtectedAppPath(pathname: string): boolean {
  if (isGuestDemoPath(pathname)) return false
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
