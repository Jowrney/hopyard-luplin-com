// app/api/admin/materials/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('material_categories')
      .select(`*, materials (*)`)
      .order('sort_order')

    if (error) throw error

    // snake_case → camelCase 변환
    const mapped = (data ?? []).map((cat: Record<string, unknown>) => ({
      id:        cat.id,
      code:      cat.code,
      name:      cat.name,
      sortOrder: cat.sort_order,
      materials: ((cat.materials ?? []) as Record<string, unknown>[])
        .filter((m) => m.is_active)
        .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        .map((m) => ({
          id:        m.id,
          code:      m.code,
          name:      m.name,
          spec:      m.spec,
          unit:      m.unit,
          unitPrice: m.unit_price,
          isActive:  m.is_active,
          sortOrder: m.sort_order,
          metadata:  m.metadata,
        })),
    }))

    return NextResponse.json({ success: true, data: mapped })
  } catch (e) {
    console.error('materials GET error:', e)
    return NextResponse.json({ success: false, error: String(e), data: [] })
  }
}

export async function POST(req: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ success: false, error: '로그인 필요' }, { status: 401 })

    const body = await req.json()
    const { categoryId, code, name, spec, unit, unitPrice } = body
    if (!code || !name || !unitPrice) {
      return Response.json({ success: false, error: '코드, 품명, 단가는 필수입니다' }, { status: 400 })
    }

    const { data, error } = await supabase.from('materials').insert({
      category_id: categoryId,
      code,
      name,
      spec: spec ?? null,
      unit: unit ?? '개',
      unit_price: Number(unitPrice),
      is_active: true,
      sort_order: 999,
    }).select().single()

    if (error) {
      console.error('materials POST error:', error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }
    return Response.json({ success: true, data })
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 })
  }
}
