// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // sb- 쿠키만 전달 (431 방지)
          return cookieStore.getAll().filter(
            (c) => c.name.startsWith('sb-')
          )
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                // 쿠키 크기 최소화: secure + httpOnly + sameSite
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7일
              })
            )
          } catch {
            // 서버 컴포넌트에서 호출 시 무시
          }
        },
      },
    }
  )
}
