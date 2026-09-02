'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styled from 'styled-components'
import { DesignInputForm } from '@/components/design/DesignInputForm'
import { EstimatePanel } from '@/components/estimate/EstimatePanel'
import { SafetyBadge } from '@/components/design/SafetyBadge'
import { PDFExportModal } from '@/components/estimate/PDFExportModal'
import { SaveDesignModal } from '@/components/design/SaveDesignModal'
import { useDesignStore } from '@/stores/designStore'
import { usePriceStore } from '@/stores/priceStore'
import UserMenu from '@/components/auth/UserMenu'
import { CandidateTray } from '@/components/webmcp/CandidateTray'
import { DesignWebMCP } from '@/components/webmcp/DesignWebMCP'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'

// ── 동적 임포트 ───────────────────────────────────────
const FarmCanvas2D = dynamic(
  () => import('@/components/canvas/FarmCanvas2D').then((m) => ({ default: m.FarmCanvas2D })),
  { ssr: false, loading: () => <LocalizedCanvasPlaceholder view="2d" /> }
)
const FarmCanvas3D = dynamic(
  () => import('@/components/canvas/FarmCanvas3D').then((m) => ({ default: m.FarmCanvas3D })),
  { ssr: false, loading: () => <LocalizedCanvasPlaceholder view="3d" /> }
)

type ViewMode = '2d' | '3d'

// ── 스타일 ──────────────────────────────────────────
const PageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100dvh;
`

const PageHeader = styled.header`
    flex-shrink: 0;
    background: white;
    border-bottom: 1px solid #E8E4DC;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 50;
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
    letter-spacing: -0.02em;
`

const LogoSub = styled.span`
    color: #8BA888;
    font-size: 0.875rem;
    font-weight: 500;
`

const HeaderDivider = styled.div`
    width: 1px;
    height: 1.25rem;
    background: #e5e7eb;
`

const PageLabel = styled.span`
    font-size: 0.875rem;
    color: #6b7280;
`

const HeaderRight = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;
`

const PriceLoadingText = styled.span`
    font-size: 0.75rem;
    color: #9ca3af;
    animation: pulse 1s infinite;
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`

const OutlineButton = styled.button`
    font-size: 0.875rem;
    border: 1px solid #2D5A27;
    color: #2D5A27;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.15s;

    &:hover { background: #F0F7EF; }
`

const PrimaryButton = styled.button`
    font-size: 0.875rem;
    background: #2D5A27;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.15s;

    &:hover { background: #234820; }
`

const Body = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;
`

const LeftPanel = styled.aside`
    flex-shrink: 0;
    width: 400px;
    background: white;
    border-right: 1px solid #E8E4DC;
    overflow-y: auto;
    min-height: 0;
`

const CenterPanel = styled.main`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
`

const ViewToolbar = styled.div`
    flex-shrink: 0;
    background: white;
    border-bottom: 1px solid #E8E4DC;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
`

const ViewTabs = styled.div`
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: #F5F3EE;
    border-radius: 0.5rem;
    padding: 0.25rem;
`

const ViewTab = styled.button<{ $active: boolean }>`
    padding: 0.375rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    background: ${({ $active }) => ($active ? 'white' : 'transparent')};
    color: ${({ $active }) => ($active ? '#2D5A27' : '#6b7280')};
    box-shadow: ${({ $active }) => ($active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none')};

    &:hover { color: ${({ $active }) => ($active ? '#2D5A27' : '#374151')}; }
`

const ChipsRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`

const Chip = styled.div`
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    background: #F0F7EF;
    color: #2D5A27;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-weight: 500;
`

const PngButton = styled.button`
    font-size: 0.75rem;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #f9fafb; }
`

const CanvasArea = styled.div`
    flex: 1;
    min-height: 0;
    position: relative;
    background: #F5F3EE;
`

const CanvasLayer = styled.div<{ $visible: boolean }>`
    position: absolute;
    inset: 0;
    display: ${({ $visible }) => ($visible ? 'block' : 'none')};
`

const RightPanel = styled.aside`
    flex-shrink: 0;
    width: 340px;
    background: white;
    border-left: 1px solid #E8E4DC;
    overflow-y: auto;
    min-height: 0;
`

const PlaceholderWrapper = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`

const PlaceholderInner = styled.div`
    text-align: center;
    color: #9ca3af;
`

const PlaceholderIcon = styled.div`
    font-size: 3rem;
    margin-bottom: 0.75rem;
    animation: pulse 1s infinite;
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`

// ── 컴포넌트 ─────────────────────────────────────────
function CanvasPlaceholder({ text, icon = '🗺️' }: { text: string; icon?: string }) {
  return (
    <PlaceholderWrapper>
      <PlaceholderInner>
        <PlaceholderIcon>{icon}</PlaceholderIcon>
        <p style={{ fontSize: '0.875rem' }}>{text}</p>
      </PlaceholderInner>
    </PlaceholderWrapper>
  )
}

function LocalizedCanvasPlaceholder({ view }: { view: ViewMode }) {
  const { text } = useLocale()
  return (
    <CanvasPlaceholder
      text={view === '2d'
        ? text('Loading 2D canvas…', '2D 캔버스 로딩 중…')
        : text('Loading 3D viewer…', '3D 뷰어 로딩 중…')}
      icon={view === '3d' ? '🏗️' : undefined}
    />
  )
}

export default function DesignPage() {
  const pathname = usePathname()
  const isDemo = pathname === '/design/demo'
  const { text, number, date } = useLocale()
  const { quantities, inputs, recalculate } = useDesignStore()
  const { fetchPrices, isLoading: pricesLoading } = usePriceStore()
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  const [showPDF, setShowPDF] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const [userName, setUserName] = useState<string | undefined>()
  const canvasAreaRef = useRef<HTMLDivElement>(null)

  const handlePngSave = useCallback(() => {
    const el = canvasAreaRef.current
    if (!el) return
    try {
      const canvas = el.querySelector('canvas') as HTMLCanvasElement | null
      if (!canvas) { alert(text('Load the drawing first.', '도면을 먼저 불러주세요.')); return }

      const dateStr = date(new Date()).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
      const filename = `hopeden-${viewMode === '2d'
        ? text('floor-plan', '평면도')
        : text('perspective-view', '투시도')}-${dateStr}.png`

      const doSave = () => {
        const dataUrl = canvas.toDataURL('image/png')
        if (dataUrl === 'data:,') {
          alert(text('The drawing is still loading. Please try again shortly.', '도면이 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.'))
          return
        }
        const link = document.createElement('a')
        link.download = filename
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      if (viewMode === '3d') {
        requestAnimationFrame(() => {
          // id로 3D 캔버스 직접 접근
          const canvas3d = document.getElementById('hopeden-3d-canvas') as HTMLCanvasElement | null
          if (!canvas3d) { alert(text('Load the 3D drawing first.', '3D 도면을 먼저 로딩해주세요.')); return }
          const dataUrl = canvas3d.toDataURL('image/png')
          if (!dataUrl || dataUrl === 'data:,') { alert(text('Please try again shortly.', '잠시 후 다시 시도해주세요.')); return }
          const link = document.createElement('a')
          link.download = filename
          link.href = dataUrl
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        })
      } else {
        doSave()
      }
    } catch (e) {
      console.error(text('PNG save failed:', 'PNG 저장 실패:'), e)
      alert(text('Failed to save the PNG.', 'PNG 저장에 실패했습니다.'))
    }
  }, [date, text, viewMode])
  const [userEmail, setUserEmail] = useState<string | undefined>()

  useEffect(() => {
    fetchPrices().then(() => {
      if (!quantities) recalculate()
    })

    if (isDemo) return

    // Supabase 세션에서 유저 정보 가져오기
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.name ?? user.email?.split('@')[0])
        setUserEmail(user.email)
      }
    })
  }, [fetchPrices, isDemo]) // eslint-disable-line

  return (
    <PageWrapper>
      <PageHeader>
        <HeaderLeft>
          <HeaderLogo href="/">
            <span style={{ fontSize: '1.25rem' }}>🌿</span>
            <LogoMain>HopEden</LogoMain>
            <LogoSub>Designer</LogoSub>
          </HeaderLogo>
          <HeaderDivider />
          <PageLabel>{isDemo ? text('WebMCP Challenge Demo', 'WebMCP 챌린지 데모') : text('New design', '새 설계안')}</PageLabel>
        </HeaderLeft>

        <HeaderRight>
          <LanguageSwitcher />
          <DesignWebMCP />
          <SafetyBadge />
          {pricesLoading && <PriceLoadingText>{text('Loading prices…', '가격 로드 중…')}</PriceLoadingText>}
          <OutlineButton onClick={() => setShowPDF(true)}>📄 {text('Estimate PDF', '견적서 PDF')}</OutlineButton>
          {!isDemo && <PrimaryButton onClick={() => setShowSave(true)}>💾 {text('Save design', '설계 저장')}</PrimaryButton>}
          {!isDemo && <UserMenu userName={userName} userEmail={userEmail} />}
        </HeaderRight>
      </PageHeader>

      <Body>
        <LeftPanel>
          <DesignInputForm />
        </LeftPanel>

        <CenterPanel>
          <ViewToolbar>
            <ViewTabs>
              {(['2d', '3d'] as ViewMode[]).map((mode) => (
                <ViewTab key={mode} $active={viewMode === mode} onClick={() => setViewMode(mode)}>
                  {mode === '2d' ? text('2D plan', '2D 평면도') : text('3D perspective', '3D 투시도')}
                </ViewTab>
              ))}
            </ViewTabs>

            {quantities && (
              <ChipsRow>
                <Chip><span>🏗️</span><span>{text(`${number(quantities.totalPoleCount)} poles`, `폴 ${number(quantities.totalPoleCount)}개`)}</span></Chip>
                <Chip><span>🔗</span><span>{text(`${number(quantities.totalWireM)} m wire`, `와이어 ${number(quantities.totalWireM)}m`)}</span></Chip>
                <Chip><span>🌱</span><span>{text(`${number(quantities.plantCount)} plants`, `${number(quantities.plantCount)}주`)}</span></Chip>
                <Chip><span>📐</span><span>{text(`${number(inputs.widthM * inputs.heightM)} m²`, `${number(inputs.widthM * inputs.heightM)}㎡`)}</span></Chip>
              </ChipsRow>
            )}

            <PngButton onClick={handlePngSave}>📥 {text('Save PNG', 'PNG 저장')}</PngButton>
          </ViewToolbar>

          <CanvasArea ref={canvasAreaRef}>
            <CanvasLayer $visible={viewMode === '2d'}><FarmCanvas2D /></CanvasLayer>
            <CanvasLayer $visible={viewMode === '3d'}><FarmCanvas3D /></CanvasLayer>
            <CandidateTray />
          </CanvasArea>
        </CenterPanel>

        <RightPanel>
          <EstimatePanel onPDFClick={() => setShowPDF(true)} />
        </RightPanel>
      </Body>

      {showPDF && <PDFExportModal onClose={() => setShowPDF(false)} />}
      {showSave && <SaveDesignModal onClose={() => setShowSave(false)} />}
    </PageWrapper>
  )
}
