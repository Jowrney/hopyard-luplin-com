// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isGuestDemoPath, isProtectedAppPath } from '@/lib/auth/routes'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (isGuestDemoPath(pathname)) return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // sb- 쿠키만 읽기 (431 방지)
          return request.cookies.getAll().filter(
            (c) => c.name.startsWith('sb-')
          )
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7,
            })
          )
        },
      },
    }
  )

  // 세션 갱신 (반드시 호출해야 토큰 자동 갱신됨)
  const { data: { user } } = await supabase.auth.getUser()
  // 보호 경로 — 비로그인 시 /login으로
  if (isProtectedAppPath(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // 관리자 전용
  if (pathname.startsWith('/admin') && user) {
    const role = user.user_metadata?.role as string | undefined
    if (role !== 'ADMIN' && role !== 'SUPER') {
      const url = request.nextUrl.clone()
      url.pathname = '/design'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
