// app/api/prices/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getReferencePriceMap } from '@/lib/catalog/reference-catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const [{ data: materials }, { data: varieties }] = await Promise.all([
      supabase.from('materials').select('code, unit_price').eq('is_active', true),
      supabase.from('hop_varieties').select('code, unit_price').eq('is_active', true),
    ])

    const prices: Record<string, number> = getReferencePriceMap()
    for (const m of materials ?? []) prices[m.code] = m.unit_price
    for (const v of varieties ?? []) prices[v.code] = v.unit_price

    const hasDatabasePrices = (materials?.length ?? 0) + (varieties?.length ?? 0) > 0
    return NextResponse.json({
      prices,
      dataSource: hasDatabasePrices ? 'database-with-reference-fallback' : 'reference-catalog',
    })
  } catch {
    return NextResponse.json({ prices: getReferencePriceMap(), dataSource: 'reference-catalog' })
  }
}
