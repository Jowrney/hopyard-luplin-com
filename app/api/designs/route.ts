import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, name, inputs, quantities, loads, estimate } = body

    if (!projectId || !name) {
      return NextResponse.json({ success: false, error: '프로젝트와 설계명이 필요합니다' }, { status: 400 })
    }

    // 프로젝트 소유권 확인
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ success: false, error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
    }

    // 버전 계산
    const { data: existing } = await supabase
      .from('designs')
      .select('version')
      .eq('project_id', projectId)
      .eq('name', name)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const version = existing ? existing.version + 1 : 1

    const { data, error } = await supabase
      .from('designs')
      .insert({
        project_id: projectId,
        name,
        version,
        area_m2: (inputs?.widthM ?? 0) * (inputs?.heightM ?? 0),
        width_m: inputs?.widthM ?? 0,
        height_m: inputs?.heightM ?? 0,
        region: inputs?.region ?? 'INLAND',
        pole_code: inputs?.poleCode ?? '',
        row_spacing_m: inputs?.rowSpacingM ?? 3.0,
        plant_spacing_m: inputs?.plantSpacingM ?? 1.2,
        pole_spacing_m: inputs?.poleSpacingM ?? 3.0,
        pole_effective_height_m: inputs?.poleEffectiveHeightM ?? 5.0,
        pole_count: quantities?.totalPoleCount ?? 0,
        wire_code: inputs?.wireCode ?? null,
        wire_rows: inputs?.wireRows ?? 3,
        wire_length_m: quantities?.totalWireM ?? 0,
        anchor_code: inputs?.anchorCode ?? null,
        anchor_count: quantities?.anchorCount ?? 0,
        hop_load_kn: loads?.hopLoadKN ?? 0,
        wind_load_kn: loads?.windLoadKN ?? 0,
        design_tension_kn: loads?.designTensionKN ?? 0,
        total_estimate: estimate?.total ?? 0,
        safety_status: loads?.safetyStatus ?? 'GREEN',
        include_labor: true,
        include_vat: false,
        layout_json: { inputs, quantities, loads, estimate },
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('designs POST error:', e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
