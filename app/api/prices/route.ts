// app/api/prices/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const [{ data: materials }, { data: varieties }] = await Promise.all([
      supabase.from('materials').select('code, unit_price').eq('is_active', true),
      supabase.from('hop_varieties').select('code, unit_price').eq('is_active', true),
    ])

    const prices: Record<string, number> = {}
    for (const m of materials ?? []) prices[m.code] = m.unit_price
    for (const v of varieties ?? []) prices[v.code] = v.unit_price

    return NextResponse.json({ prices })
  } catch {
    return NextResponse.json({ prices: {} })
  }
}
