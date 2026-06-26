import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        designs (
          id, name, version, area_m2, width_m, height_m,
          total_estimate, safety_status, pole_code, updated_at,
          row_spacing_m, plant_spacing_m, pole_spacing_m,
          pole_effective_height_m, region, training_type, layout_json
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('projects GET error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (e) {
    console.error('projects GET exception:', e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인 필요' }, { status: 401 })
    }

    const { name, description, location } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: '프로젝트명을 입력해주세요' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name, description, location })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, error: '서버 오류' }, { status: 500 })
  }
}
