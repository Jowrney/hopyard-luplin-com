'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styled from 'styled-components'
import { useDesignStore } from '@/stores/designStore'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useLocale } from '@/components/i18n/LocaleProvider'

// ── 타입 ──────────────────────────────────────────────
interface Design {
  id: string
  name: string
  version: number
  area_m2?: number
  width_m?: number
  height_m?: number
  total_estimate?: number
  safety_status?: 'GREEN' | 'YELLOW' | 'RED'
  pole_code?: string
  updated_at?: string
  row_spacing_m?: number
  plant_spacing_m?: number
  pole_spacing_m?: number
  pole_effective_height_m?: number
  region?: string
  training_type?: string
  layout_json?: { inputs?: Record<string,unknown>; quantities?: unknown; loads?: unknown; estimate?: unknown }
}

interface Project {
  id: string
  name: string
  description?: string
  location?: string
  updated_at?: string
  designs: Design[]
}

// ── 유틸 ──────────────────────────────────────────────
const SAFETY_COLOR = {
  GREEN:  { bg: '#f0fdf4', text: '#16a34a' },
  YELLOW: { bg: '#fefce8', text: '#ca8a04' },
  RED:    { bg: '#fef2f2', text: '#dc2626' },
}

// ── 스타일 ──────────────────────────────────────────
const PageWrapper = styled.div`
    min-height: 100vh;
    background: #F5F3EE;
`

const PageHeader = styled.header`
    background: white;
    border-bottom: 1px solid #E8E4DC;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`

const HeaderLogo = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
`

const LogoMain = styled.span`
    font-weight: 700;
    color: #2D5A27;
`

const LogoSub = styled.span`
    color: #8BA888;
    font-size: 0.875rem;
`

const Divider = styled.div`
    width: 1px;
    height: 1.25rem;
    background: #e5e7eb;
`

const PageLabel = styled.span`
    font-size: 0.875rem;
    color: #6b7280;
`

const NewDesignButton = styled(Link)`
    font-size: 0.875rem;
    background: #2D5A27;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
    transition: background 0.15s;

    &:hover { background: #234820; }
`

const HeaderRight = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
`

const Content = styled.div`
    max-width: 1024px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
`

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`

const StatCard = styled.div`
    background: white;
    border-radius: 1rem;
    padding: 1.25rem;
    border: 1px solid #E8E4DC;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`

const StatTop = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
`

const StatIcon = styled.span`font-size: 1.5rem;`

const StatValue = styled.span`
    font-size: 1.5rem;
    font-weight: 700;
    color: #2D5A27;
`

const StatLabel = styled.p`
    font-size: 0.875rem;
    color: #6b7280;
`

const ProjectList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`

const ProjectCard = styled.div`
    background: white;
    border-radius: 1rem;
    border: 1px solid #E8E4DC;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    overflow: hidden;
`

const ProjectToggle = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: #F8FAF7;
    border: none;
    border-bottom: 1px solid #E8E4DC;
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;

    &:hover { background: #F0F7EF; }
`

const ProjectInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
`

const ProjectIcon = styled.span`font-size: 1.5rem;`

const ProjectName = styled.h3`
    font-weight: 700;
    color: #1A2E18;
    margin: 0;
`

const ProjectMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.25rem;
`

const MetaText = styled.span`
    font-size: 0.75rem;
    color: #9ca3af;
`

const ToggleArrow = styled.span`
    color: #9ca3af;
    font-size: 0.875rem;
`

const EmptyDesigns = styled.div`
    padding: 2rem 1.5rem;
    text-align: center;
    color: #9ca3af;
    font-size: 0.875rem;
`

const DesignList = styled.div`
    & > * + * { border-top: 1px solid #E8E4DC; }
`

const DesignRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    transition: background 0.1s;

    &:hover { background: #FAFAF8; }
`

const DesignLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`

const DesignIcon = styled.span`font-size: 1.125rem;`

const DesignNameRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`

const DesignName = styled.span`
    font-size: 0.875rem;
    font-weight: 600;
    color: #1A2E18;
`

const VersionBadge = styled.span`
    font-size: 0.625rem;
    background: #f3f4f6;
    color: #6b7280;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
`

const SafetyBadge = styled.span<{ $status?: 'GREEN' | 'YELLOW' | 'RED' }>`
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-weight: 500;
    background: ${({ $status }) => (SAFETY_COLOR[$status as 'GREEN'] ?? SAFETY_COLOR.GREEN).bg};
    color: ${({ $status }) => (SAFETY_COLOR[$status as 'GREEN'] ?? SAFETY_COLOR.GREEN).text};
`

const DesignMetaRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.25rem;
`

const DesignMetaText = styled.span`
    font-size: 0.75rem;
    color: #9ca3af;
`

const EstimateText = styled.span`
    font-size: 0.75rem;
    font-weight: 600;
    color: #2D5A27;
`

const ActionRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`

const LoadButton = styled.button`
    font-size: 0.75rem;
    background: #2D5A27;
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.15s;

    &:hover { background: #234820; }
`

const DeleteButton = styled.button`
    font-size: 0.75rem;
    border: 1px solid #fecaca;
    color: #ef4444;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.15s;

    &:hover { background: #fef2f2; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const EmptyState = styled.div`
    background: white;
    border-radius: 1rem;
    border: 1px solid #E8E4DC;
    padding: 5rem 1.5rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`

const EmptyIcon = styled.div`font-size: 3rem; margin-bottom: 1rem;`

const EmptyTitle = styled.p`
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 0.25rem;
`

const EmptyDesc = styled.p`
    font-size: 0.875rem;
    color: #9ca3af;
    margin-bottom: 1.5rem;
`

const EmptyButton = styled(Link)`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #2D5A27;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 700;
    text-decoration: none;
    transition: background 0.15s;

    &:hover { background: #234820; }
`

const LoadingCard = styled.div`
    background: white;
    border-radius: 1rem;
    height: 10rem;
    border: 1px solid #E8E4DC;
    animation: pulse 1.5s infinite;

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`

const Toast = styled.div`
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    background: #2D5A27;
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 50;
`

// ── 컴포넌트 ─────────────────────────────────────────
export default function ProjectsPage() {
  const { text, number, currency, date } = useLocale()
  const router = useRouter()
  const { loadFromSaved } = useDesignStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const formatProjectDate = (value: string | null | undefined) => {
    if (!value) return '—'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '—' : date(parsed)
  }

  const safetyLabel = {
    GREEN: text('Safe', '안전'),
    YELLOW: text('Caution', '주의'),
    RED: text('Danger', '위험'),
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    const res = await fetch('/api/projects')
    // 빈 응답 방어 처리
    const text = await res.text()
    if (!text || !text.trim()) {
      console.error('Projects API returned an empty response')
      setIsLoading(false)
      return
    }
    let data: { success: boolean; data: Project[]; error?: string }
    try { data = JSON.parse(text) }
    catch (e) { console.error('Projects API JSON parsing error:', e, text); setIsLoading(false); return }
    if (data.success) {
      setProjects(data.data)
      setOpenProjects(new Set(data.data.map((p: Project) => p.id)))
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleLoadDesign = async (designId: string) => {
    try {
      const res = await fetch(`/api/designs/${designId}`)
      const data = await res.json()
      if (!data.success) { alert(`${text('Failed to load:', '불러오기 실패:')} ${data.error ?? text('Unknown error', '알 수 없는 오류')}`); return }
      const design = data.data
      // layoutJson이 있으면 전체 복원, 없으면 기본 inputs만으로 이동
      const lj = design.layout_json
      if (lj?.inputs) {
        const inputs = { ...lj.inputs, trainingType: (lj.inputs as Record<string,unknown>).trainingType ?? design.training_type ?? 'V' }
        loadFromSaved({
          inputs: inputs as Parameters<typeof loadFromSaved>[0]['inputs'],
          quantities: lj.quantities ?? null,
          loads: lj.loads ?? null,
          estimate: lj.estimate ?? null,
          designId: design.id,
          designName: design.name,
        })
      } else {
        loadFromSaved({
          inputs: {
            widthM: design.width_m ?? 60,
            heightM: design.height_m ?? 60,
            rowSpacingM: design.row_spacing_m ?? 3.5,
            plantSpacingM: design.plant_spacing_m ?? 1.0,
            poleSpacingM: design.pole_spacing_m ?? 8.0,
            wireRows: 1,
            poleEffectiveHeightM: design.pole_effective_height_m ?? 5.5,
            region: (design.region ?? 'INLAND') as import('@/types').WindRegion,
            trainingType: (design.training_type ?? 'V') as import('@/types').TrainingType,
          },
          quantities: null, loads: null, estimate: null,
          designId: design.id,
          designName: design.name,
        })
      }
      router.push('/design')
    } catch {
      alert(text('Network error', '네트워크 오류'))
    }
  }

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm(text('Delete this design?', '이 설계안을 삭제하시겠습니까?'))) return
    setDeletingId(designId)
    const res = await fetch(`/api/designs/${designId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast(text('Design deleted.', '설계안이 삭제되었습니다'))
      fetchProjects()
    }
    setDeletingId(null)
  }

  const toggleProject = (id: string) => {
    setOpenProjects((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalDesigns = projects.reduce((s, p) => s + p.designs.length, 0)

  return (
    <PageWrapper>
      <PageHeader>
        <HeaderLeft>
          <HeaderLogo href="/">
            <span style={{ fontSize: '1.25rem' }}>🌿</span>
            <LogoMain>HopEden</LogoMain>
            <LogoSub>Designer</LogoSub>
          </HeaderLogo>
          <Divider />
          <PageLabel>{text('My projects', '내 프로젝트')}</PageLabel>
        </HeaderLeft>
        <HeaderRight>
          <LanguageSwitcher />
          <NewDesignButton href="/design">+ {text('New design', '새 설계 시작')}</NewDesignButton>
        </HeaderRight>
      </PageHeader>

      <Content>
        <StatsGrid>
          {[
            { label: text('Total projects', '총 프로젝트'), value: number(projects.length), icon: '📁' },
            { label: text('Total designs', '총 설계안'), value: number(totalDesigns), icon: '📐' },
            { label: text('Last updated', '최근 수정'), value: projects[0] ? formatProjectDate(projects[0]?.updated_at) : '—', icon: '🕐' },
          ].map((s) => (
            <StatCard key={s.label}>
              <StatTop>
                <StatIcon>{s.icon}</StatIcon>
                <StatValue>{s.value}</StatValue>
              </StatTop>
              <StatLabel>{s.label}</StatLabel>
            </StatCard>
          ))}
        </StatsGrid>

        {isLoading ? (
          <ProjectList>
            {[1, 2].map((i) => <LoadingCard key={i} />)}
          </ProjectList>
        ) : projects.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🌱</EmptyIcon>
            <EmptyTitle>{text('No saved designs yet', '아직 저장된 설계가 없습니다')}</EmptyTitle>
            <EmptyDesc>{text('Create a design, then save it to see it here.', '설계 페이지에서 작업 후 저장해 보세요')}</EmptyDesc>
            <EmptyButton href="/design">🌿 {text('Create your first design', '첫 설계 시작하기')}</EmptyButton>
          </EmptyState>
        ) : (
          <ProjectList>
            {projects.map((project) => (
              <ProjectCard key={project.id}>
                <ProjectToggle onClick={() => toggleProject(project.id)}>
                  <ProjectInfo>
                    <ProjectIcon>📁</ProjectIcon>
                    <div>
                      <ProjectName>{project.name}</ProjectName>
                      <ProjectMeta>
                        {project.location && <MetaText>📍 {project.location}</MetaText>}
                        <MetaText>{text('Designs', '설계안')} {number(project.designs.length)}</MetaText>
                        <MetaText>{text('Updated', '수정')} {formatProjectDate(project.updated_at)}</MetaText>
                      </ProjectMeta>
                    </div>
                  </ProjectInfo>
                  <ToggleArrow>{openProjects.has(project.id) ? '▲' : '▼'}</ToggleArrow>
                </ProjectToggle>

                {openProjects.has(project.id) && (
                  project.designs.length === 0 ? (
                    <EmptyDesigns>{text('No saved designs', '저장된 설계안이 없습니다')}</EmptyDesigns>
                  ) : (
                    <DesignList>
                      {project.designs.map((design) => (
                        <DesignRow key={design.id}>
                          <DesignLeft>
                            <DesignIcon>📐</DesignIcon>
                            <div>
                              <DesignNameRow>
                                <DesignName>{design.name}</DesignName>
                                <VersionBadge>v{design.version}</VersionBadge>
                                <SafetyBadge $status={design.safety_status}>
                                  {safetyLabel[(design.safety_status ?? 'GREEN') as 'GREEN'|'YELLOW'|'RED']}
                                </SafetyBadge>
                              </DesignNameRow>
                              <DesignMetaRow>
                                <DesignMetaText>
                                  {number(design.width_m ?? 0)}×{number(design.height_m ?? 0)}m ({number((design.area_m2 ?? (design.width_m ?? 0) * (design.height_m ?? 0)) || 0)}㎡)
                                </DesignMetaText>
                                <EstimateText>{currency(design.total_estimate ?? 0, 'KRW')}</EstimateText>
                                <DesignMetaText>
                                  {formatProjectDate(design.updated_at)}
                                </DesignMetaText>
                              </DesignMetaRow>
                            </div>
                          </DesignLeft>
                          <ActionRow>
                            <LoadButton onClick={() => handleLoadDesign(design.id)}>{text('Load', '불러오기')}</LoadButton>
                            <DeleteButton
                              onClick={() => handleDeleteDesign(design.id)}
                              disabled={deletingId === design.id}
                            >
                              {deletingId === design.id ? '⌛' : text('Delete', '삭제')}
                            </DeleteButton>
                          </ActionRow>
                        </DesignRow>
                      ))}
                    </DesignList>
                  )
                )}
              </ProjectCard>
            ))}
          </ProjectList>
        )}
      </Content>

      {toast && <Toast>{toast}</Toast>}
    </PageWrapper>
  )
}
