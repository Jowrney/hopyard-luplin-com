// app/api/admin/materials/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })

    const body = await req.json()
    const unitPrice = Number(body.unitPrice)
    const reason = body.reason ?? ''

    if (!unitPrice || unitPrice < 1) {
      return NextResponse.json({ success: false, error: 'Unit price must be at least 1 KRW' }, { status: 400 })
    }

    // 기존 단가 조회
    const { data: existing, error: fetchError } = await supabase
      .from('materials')
      .select('unit_price')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ success: false, error: 'Material not found' }, { status: 404 })
    }

    // 가격 이력 저장
    await supabase.from('price_histories').insert({
      material_id: id,
      old_price: existing.unit_price,
      new_price: unitPrice,
      changed_by: user.id,
      reason,
    })

    // 단가 업데이트
    const { data: updated, error: updateError } = await supabase
      .from('materials')
      .update({ unit_price: unitPrice })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('materials update error:', JSON.stringify(updateError))
      return NextResponse.json({ success: false, error: updateError.message ?? JSON.stringify(updateError) }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('materials PUT error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })

    const { error } = await supabase
      .from('materials')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
