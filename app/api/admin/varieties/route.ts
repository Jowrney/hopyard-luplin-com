// app/api/admin/varieties/route.ts
import { NextResponse } from 'next/server'
import { REFERENCE_VARIETIES } from '@/lib/catalog/reference-catalog'

export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('hop_varieties')
      .select('*')
      .eq('is_active', true)
      .order('is_own_brand', { ascending: false })
      .order('name')

    if (error) throw error

    // snake_case → camelCase 변환
    const mapped = (data ?? []).map((v: Record<string, unknown>) => ({
      id:                   v.id,
      code:                 v.code,
      name:                 v.name,
      nameKo:               v.name_ko,
      characteristics:      v.characteristics,
      unitPrice:            v.unit_price,
      recommendedSpacingM:  v.recommended_spacing_m,
      isActive:             v.is_active,
      isOwnBrand:           v.is_own_brand,
    }))

    if (mapped.length === 0) {
      return NextResponse.json({ success: true, data: REFERENCE_VARIETIES, dataSource: 'reference-catalog' })
    }
    return NextResponse.json({ success: true, data: mapped, dataSource: 'database' })
  } catch (e) {
    console.error('varieties GET error:', e)
    return NextResponse.json({
      success: true,
      data: REFERENCE_VARIETIES,
      dataSource: 'reference-catalog',
      warning: 'Live variety catalog unavailable; using the bundled reference catalog.',
    })
  }
}

export async function POST(req: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ success: false, error: 'Authentication required' }, { status: 401 })

    const body = await req.json()
    const { code, name, characteristics, unitPrice, recommendedSpacingM, isOwnBrand } = body
    if (!code || !name || !unitPrice) {
      return Response.json({ success: false, error: 'Code, variety name, and unit price are required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('hop_varieties').insert({
      code,
      name,
      characteristics: characteristics ?? null,
      unit_price: Number(unitPrice),
      recommended_spacing_m: Number(recommendedSpacingM) || 1.2,
      is_own_brand: isOwnBrand ?? false,
      is_active: true,
    }).select().single()

    if (error) {
      console.error('varieties POST error:', error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }
    return Response.json({ success: true, data })
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 })
  }
}
