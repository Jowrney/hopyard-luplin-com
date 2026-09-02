// app/api/admin/varieties/[id]/route.ts
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

    if (!unitPrice || unitPrice < 1) {
      return NextResponse.json({ success: false, error: 'Unit price must be at least 1 KRW' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('hop_varieties')
      .update({ unit_price: unitPrice })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('varieties update error:', JSON.stringify(error))
      return NextResponse.json({ success: false, error: error.message ?? JSON.stringify(error) }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('varieties PUT error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
