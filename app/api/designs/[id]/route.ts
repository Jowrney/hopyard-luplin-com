import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('designs')
      .select('*, projects!inner(user_id)')
      .eq('id', id)
      .eq('projects.user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ success: false, error: '설계를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })

    // 소유권 확인
    const { data: existing } = await supabase
      .from('designs')
      .select('id, projects!inner(user_id)')
      .eq('id', id)
      .eq('projects.user_id', user.id)
      .single()

    if (!existing) return NextResponse.json({ success: false, error: '설계를 찾을 수 없습니다' }, { status: 404 })

    const { inputs, quantities, loads, estimate } = await req.json()

    const { data, error } = await supabase
      .from('designs')
      .update({
        area_m2:               (inputs?.widthM ?? 0) * (inputs?.heightM ?? 0),
        width_m:               inputs?.widthM ?? 0,
        height_m:              inputs?.heightM ?? 0,
        region:                inputs?.region ?? 'INLAND',
        training_type:         inputs?.trainingType ?? 'V',
        row_spacing_m:         inputs?.rowSpacingM ?? 3.5,
        plant_spacing_m:       inputs?.plantSpacingM ?? 1.0,
        pole_spacing_m:        inputs?.poleSpacingM ?? 8.0,
        pole_effective_height_m: inputs?.poleEffectiveHeightM ?? 5.5,
        pole_count:            quantities?.totalPoleCount ?? 0,
        wire_rows:             inputs?.wireRows ?? 1,
        wire_length_m:         quantities?.totalWireM ?? 0,
        anchor_count:          quantities?.anchorCount ?? 0,
        hop_load_kn:           loads?.hopLoadKN ?? 0,
        wind_load_kn:          loads?.windLoadKN ?? 0,
        design_tension_kn:     loads?.designTensionKN ?? 0,
        total_estimate:        estimate?.total ?? 0,
        safety_status:         loads?.safetyStatus ?? 'GREEN',
        layout_json:           { inputs, quantities, loads, estimate },
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
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
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })
    }

    // 소유권 확인
    const { data: design } = await supabase
      .from('designs')
      .select('id, projects!inner(user_id)')
      .eq('id', id)
      .eq('projects.user_id', user.id)
      .single()

    if (!design) {
      return NextResponse.json({ success: false, error: '설계를 찾을 수 없습니다' }, { status: 404 })
    }

    const { error } = await supabase.from('designs').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
