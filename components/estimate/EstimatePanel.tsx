'use client'

import styled from 'styled-components'
import { useDesignStore } from '@/stores/designStore'
import type { SafetyStatus } from '@/types'
import { getRegionalProfile, type MaterialRole } from '@/lib/design/regional-profiles'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { getEstimateCategoryLabel, getEstimateItemLabel, getUnitLabel } from '@/lib/i18n'
import { ShieldCheck, ShieldWarning, WarningCircle } from '@phosphor-icons/react'

// ── 스타일 ──────────────────────────────────────────
const PanelWrapper = styled.div`
    display: flex;
    flex-direction: column;
`

const PanelHeader = styled.div`
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #E8E4DC;
    background: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
`

const PanelTitle = styled.h2`
    font-size: 0.9375rem;
    font-weight: 700;
    color: #1A2E18;
    margin: 0;
`

const CalcText = styled.span`
    font-size: 0.75rem;
    color: #9ca3af;
    animation: pulse 1s infinite;
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`

const ScrollArea = styled.div`
    overflow-y: visible;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
`

// 수량 요약
const SummaryBox = styled.div`
    background: #F5F3EE;
    border-radius: 1rem;
    padding: 1rem;
`

const SummaryLabel = styled.p`
    font-size: 0.625rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.75rem;
`

const SummaryRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    & + & { margin-top: 0.5rem; }
`

const SummaryKey = styled.span`font-size: 0.75rem; color: #6b7280;`
const SummaryVal = styled.span`font-size: 0.875rem; font-weight: 600; color: #1f2937;`

// 하중 분석
const LoadCard = styled.div`
    border-radius: 1rem;
    border: 1px solid #E8E4DC;
    overflow: hidden;
`

const LoadCardHeader = styled.div`
    padding: 0.75rem 1rem;
    background: #F5F3EE;
    border-bottom: 1px solid #E8E4DC;
`

const LoadCardTitle = styled.p`
    font-size: 0.625rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
`

const LoadCardBody = styled.div`padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;`

const LoadRow = styled.div`display: flex; align-items: flex-start; justify-content: space-between;`

const LoadLabel = styled.span<{ $bold?: boolean }>`
    font-size: 0.75rem;
    color: ${({ $bold }) => ($bold ? '#1f2937' : '#6b7280')};
    font-weight: ${({ $bold }) => ($bold ? '600' : '400')};
`

const LoadSub = styled.p`font-size: 0.625rem; color: #9ca3af; margin: 0.125rem 0 0;`

const LoadValue = styled.span<{ $bold?: boolean }>`
    font-size: 0.875rem;
    margin-left: 0.5rem;
    color: ${({ $bold }) => ($bold ? '#1A2E18' : '#374151')};
    font-weight: ${({ $bold }) => ($bold ? '700' : '400')};
`

const WireDivider = styled.div`
    padding-top: 0.5rem;
    border-top: 1px solid #E8E4DC;
    display: flex;
    align-items: center;
    justify-content: space-between;
`

const WireLabel = styled.span`font-size: 0.75rem; color: #6b7280;`
const WireValue = styled.span`font-size: 0.875rem; font-weight: 700; color: #2D5A27;`

// 안전 바
const SafetyBarWrapper = styled.div<{ $status: SafetyStatus }>`
    padding: 0.625rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: ${({ $status }) => ({ GREEN: '#f0fdf4', YELLOW: '#fefce8', RED: '#fef2f2' }[$status])};
    color: ${({ $status }) => ({ GREEN: '#15803d', YELLOW: '#ca8a04', RED: '#dc2626' }[$status])};
`

// 비용 구성
const RatioWrapper = styled.div``
const RatioLabel = styled.p`font-size: 0.75rem; color: #6b7280; margin: 0 0 0.5rem;`
const RatioBar = styled.div`display: flex; height: 0.75rem; border-radius: 9999px; overflow: hidden; gap: 1px;`
const RatioFill = styled.div<{ $color: string; $width: string }>`
    background: ${({ $color }) => $color};
    width: ${({ $width }) => $width};
    transition: width 0.3s;
`
const RatioLegend = styled.div`display: flex; gap: 1rem; margin-top: 0.375rem;`
const LegendItem = styled.div`display: flex; align-items: center; gap: 0.25rem;`
const LegendDot = styled.div<{ $color: string }>`width: 0.5rem; height: 0.5rem; border-radius: 50%; background: ${({ $color }) => $color};`
const LegendText = styled.span`font-size: 0.625rem; color: #6b7280;`

// 카테고리 블록
const CatDetails = styled.details`
    border-radius: 0.75rem;
    border: 1px solid #E8E4DC;
    overflow: hidden;
`

const CatSummary = styled.summary`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: white;
    cursor: pointer;
    list-style: none;
    transition: background 0.1s;

    &:hover { background: #F5F3EE; }
    &::-webkit-details-marker { display: none; }
`

const CatLeft = styled.div`display: flex; align-items: center; gap: 0.5rem;`
const CatDot = styled.div<{ $color: string }>`width: 0.5rem; height: 0.5rem; border-radius: 50%; background: ${({ $color }) => $color};`
const CatName = styled.span`font-size: 0.875rem; font-weight: 600; color: #374151;`
const CatRight = styled.div`display: flex; align-items: center; gap: 0.5rem;`
const CatTotal = styled.span`font-size: 0.875rem; font-weight: 700; color: #1A2E18;`
const CatArrow = styled.span`font-size: 0.75rem; color: #9ca3af;`

const CatBody = styled.div`
    padding: 0.75rem 1rem;
    background: #FAFAF8;
    border-top: 1px solid #E8E4DC;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`

const LineItem = styled.div`display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem;`
const LineLeft = styled.div`flex: 1; min-width: 0;`
const LineName = styled.p`font-size: 0.75rem; color: #374151; margin: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`
const LineMeta = styled.p`font-size: 0.625rem; color: #9ca3af; margin: 0.125rem 0 0;`
const LineTotal = styled.span`font-size: 0.75rem; font-weight: 600; color: #1f2937; white-space: nowrap;`

// 합계 박스
const TotalBox = styled.div`
    border-radius: 1rem;
    background: #1A2E18;
    color: white;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`

const TotalRow = styled.div`display: flex; align-items: center; justify-content: space-between;`
const TotalLabel = styled.span`font-size: 0.875rem; color: rgba(255,255,255,0.7);`
const TotalValue = styled.span`font-size: 0.875rem; font-weight: 600;`
const TotalDivider = styled.div`border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem;`
const GrandTotal = styled.div`display: flex; align-items: center; justify-content: space-between;`
const GrandLabel = styled.span`font-size: 0.875rem; color: rgba(255,255,255,0.8); font-weight: 500;`
const GrandValue = styled.span`font-size: 1.5rem; font-weight: 700;`
const PerSqm = styled.p`font-size: 0.75rem; color: rgba(255,255,255,0.4); text-align: right; margin: 0;`

// 빈 상태
const EmptyState = styled.div`
    text-align: center;
    padding: 3rem 1rem;
    color: #9ca3af;
`

const EmptyIcon = styled.p`font-size: 2.5rem; margin-bottom: 0.75rem;`
const EmptyText = styled.p`font-size: 0.875rem; line-height: 1.5;`

const ReferenceCard = styled.div`
    border:1px solid #c7d9c3;border-radius:1rem;overflow:hidden;background:#F8FAF7;
`
const ReferenceHeader = styled.div`
    padding:0.85rem 1rem;background:#2D5A27;color:white;
`
const ReferenceTitle = styled.div`font-size:0.85rem;font-weight:700;`
const ReferenceSub = styled.div`font-size:0.65rem;opacity:0.75;margin-top:0.2rem;line-height:1.35;`
const ReferenceList = styled.div`display:flex;flex-direction:column;`
const ReferenceItem = styled.div`
    padding:0.65rem 0.8rem;border-top:1px solid #e5e7eb;background:white;
`
const ReferenceItemTop = styled.div`display:flex;align-items:center;justify-content:space-between;gap:0.5rem;`
const ReferenceName = styled.strong`font-size:0.72rem;color:#1A2E18;`
const ReferenceQty = styled.span`font-size:0.64rem;font-weight:700;color:#2D5A27;white-space:nowrap;`
const ReferenceSpec = styled.div`font-size:0.62rem;color:#6b7280;line-height:1.35;margin-top:0.2rem;`
const ReferenceSource = styled.a`
    display:block;padding:0.7rem 0.8rem;border-top:1px solid #e5e7eb;
    color:#2D5A27;font-size:0.62rem;text-decoration:none;background:#F0F7EF;
    &:hover{text-decoration:underline;}
`
const ReferenceWarning = styled.div`
    padding:0.7rem 0.8rem;border-top:1px solid #fde68a;background:#fffbeb;
    color:#92400e;font-size:0.62rem;line-height:1.4;
`

// ── 상수 ──────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  '자재비': '#3b82f6',
  '시공비': '#fb923c',
  '종자비': '#22c55e',
}

const SAFETY_LABEL: Record<SafetyStatus, { en: string; ko: string }> = {
  GREEN:  { en: 'Structurally safe', ko: '구조 안전' },
  YELLOW: { en: 'Caution — wire reinforcement recommended', ko: '주의 — 와이어 보강 권장' },
  RED:    { en: 'Danger — reinforce wire immediately', ko: '위험 — 와이어 즉시 보강 필요' },
}

const REFERENCE_MATERIAL_KO: Record<string, { name: string; specification: string }> = {
  POLE_STEEL_60_2T_6M: { name: '아연도금 강관 지주', specification: '6 m 아연도금 강관; 카탈로그 유효 높이 5.1 m' },
  ANCHOR_SCREW_600: { name: '나사말뚝 앵커', specification: '600 mm 나사식 지중 앵커' },
  WIRE_32MM: { name: '고장력 스틸와이어', specification: '3.2 mm 카탈로그 와이어; 표기 인장강도 24.8 kN' },
  POLE_US_WOOD_22FT: { name: '북미형 목재 지주', specification: '길이 22 ft × 상단 지름 5 in; 약 4 ft 매립, 18 ft 노출' },
  ANCHOR_US_HELIX_48IN: { name: '베이스 플레이트형 지중 앵커', specification: '5/8 in 축 × 길이 48 in × 베이스 플레이트 6 in' },
  WIRE_US_MAIN_5_16_7X19: { name: '아연도금 메인 케이블', specification: '지름 5/16 in, 7×19 스트랜드' },
  WIRE_US_SUPPORT_3_16_7X7: { name: '아연도금 유인 지지 케이블', specification: '지름 3/16 in, 7×7 스트랜드' },
  HARDWARE_US_TURNBUCKLE_1_2X12: { name: '케이블 턴버클', specification: '1/2 in × 12 in' },
  TWINE_US_COIR_21FT: { name: '코이어 유인끈', specification: '21 ft 코이어 끈' },
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export function EstimatePanel() {
  const { locale, text, number, currency } = useLocale()
  const { profileId, inputs, estimate, quantities, loads, isCalculating, discountMemo } = useDesignStore()
  const activeProfile = getRegionalProfile(profileId)
  const money = (value: number) => currency(value, activeProfile.currency)
  const referenceQuantity = (role: MaterialRole) => {
    if (!quantities) return ''
    if (role === 'pole') return text(`${number(quantities.totalPoleCount)} each`, `${number(quantities.totalPoleCount)}개`)
    if (role === 'anchor' || role === 'hardware') return text(`${number(quantities.anchorCount)} each`, `${number(quantities.anchorCount)}개`)
    if (role === 'twine') {
      const count = quantities.plantCount * (inputs.trainingType === 'V' ? 2 : 1)
      return text(`${number(count)} strings`, `${number(count)}줄`)
    }
    return text(`part of ${number(quantities.totalWireM)} m system`, `${number(quantities.totalWireM)} m 시스템에 포함`)
  }
  const profileName = activeProfile.id === 'US_HIGH_TRELLIS'
    ? text('North America 18 ft V-trellis', '북미형 18 ft V자 트렐리스')
    : text('Korea galvanized steel V-trellis', '한국형 아연도금 강관 V자 트렐리스')
  const profileDescription = activeProfile.id === 'US_HIGH_TRELLIS'
    ? text('Quarter-acre high-trellis reference configuration based on Nebraska Extension EC3026.', 'Nebraska Extension EC3026에 기반한 1/4 acre 고식 트렐리스 참고 구성입니다.')
    : text('Current HopEden steel-pole system for preliminary Korean hopyard planning.', '한국 홉 농장 예비 설계를 위한 현재 HopEden 강관 지주 시스템입니다.')

  return (
    <PanelWrapper>
      <PanelHeader>
        <PanelTitle>{activeProfile.pricing.status === 'reference-only' ? text('Reference BOM', '참고 자재 명세') : text('Live estimate', '실시간 견적')}</PanelTitle>
        {isCalculating && <CalcText>{text('Calculating…', '계산 중…')}</CalcText>}
      </PanelHeader>

      <ScrollArea>
        {/* 수량 요약 */}
        {quantities && (
          <SummaryBox>
            <SummaryLabel>{text('Quantity summary', '수량 요약')}</SummaryLabel>
            <SummaryRow><SummaryKey>{text('Total poles', '총 폴 수량')}</SummaryKey><SummaryVal>{text(`${number(quantities.totalPoleCount)} each`, `${number(quantities.totalPoleCount)}개`)}</SummaryVal></SummaryRow>
            <SummaryRow><SummaryKey>{text('Wire length', '와이어 길이')}</SummaryKey><SummaryVal>{number(quantities.totalWireM)} m</SummaryVal></SummaryRow>
            <SummaryRow><SummaryKey>{text('Anchors', '앵커 수량')}</SummaryKey><SummaryVal>{text(`${number(quantities.anchorCount)} each`, `${number(quantities.anchorCount)}개`)}</SummaryVal></SummaryRow>
            <SummaryRow><SummaryKey>{text('Plants', '재식 주수')}</SummaryKey><SummaryVal>{text(`${number(quantities.plantCount)} plants`, `${number(quantities.plantCount)}주`)}</SummaryVal></SummaryRow>
            <SummaryRow><SummaryKey>{text('Rhizomes required', '종근 소요량')}</SummaryKey><SummaryVal>{text(`${number(quantities.rhizomeCount)} plants (10% reserve)`, `${number(quantities.rhizomeCount)}주 (예비 10%)`)}</SummaryVal></SummaryRow>
          </SummaryBox>
        )}

        {/* 하중 분석 */}
        {loads && (
          <LoadCard>
            <LoadCardHeader>
              <LoadCardTitle>{text('Structural load analysis', '구조 하중 분석')}</LoadCardTitle>
            </LoadCardHeader>
            <LoadCardBody>
              <LoadRow>
                <LoadLabel>{text('Hop biomass load', '홉 생체중 하중')}</LoadLabel>
                <LoadValue>{number(loads.hopLoadKN)} kN</LoadValue>
              </LoadRow>
              <LoadRow>
                <div>
                  <LoadLabel>{text('Wind load', '풍압 하중')}</LoadLabel>
                  <LoadSub>{text('Design wind speed', '설계풍속')} {number(loads.windSpeedMs)} m/s</LoadSub>
                </div>
                <LoadValue>{number(loads.windLoadKN)} kN</LoadValue>
              </LoadRow>
              <LoadRow>
                <LoadLabel $bold>{text('Total design load', '총 설계 하중')}</LoadLabel>
                <LoadValue $bold>{number(loads.totalLoadKN)} kN</LoadValue>
              </LoadRow>
              <LoadRow>
                <LoadLabel $bold>{text('Design tension (×1.5)', '설계 인장력 (×1.5)')}</LoadLabel>
                <LoadValue $bold>{number(loads.designTensionKN)} kN</LoadValue>
              </LoadRow>
              <WireDivider>
                <WireLabel>{text('Recommended wire', '권장 와이어')}</WireLabel>
                <WireValue>Φ{number(loads.recommendedWireDiameterMM)} mm {text('or larger', '이상')}</WireValue>
              </WireDivider>
            </LoadCardBody>
            <SafetyBarWrapper $status={loads.safetyStatus}>
              {loads.safetyStatus === 'GREEN' && <ShieldCheck size={16} weight="fill" />}
              {loads.safetyStatus === 'YELLOW' && <WarningCircle size={16} weight="fill" />}
              {loads.safetyStatus === 'RED' && <ShieldWarning size={16} weight="fill" />}
              {text(SAFETY_LABEL[loads.safetyStatus].en, SAFETY_LABEL[loads.safetyStatus].ko)}
            </SafetyBarWrapper>
          </LoadCard>
        )}

        {/* 견적 */}
        {estimate ? (
          <>
            {/* 비용 구성 비율 */}
            {(() => {
              const total = estimate.materialCost + estimate.laborCost + estimate.seedCost
              if (total === 0) return null
              const toP = (v: number) => `${((v / total) * 100).toFixed(1)}%`
              return (
                <RatioWrapper>
                  <RatioLabel>{text('Cost breakdown', '비용 구성 비율')}</RatioLabel>
                  <RatioBar>
                    {estimate.materialCost > 0 && <RatioFill $color="#3b82f6" $width={toP(estimate.materialCost)} />}
                    {estimate.laborCost > 0    && <RatioFill $color="#fb923c" $width={toP(estimate.laborCost)} />}
                    {estimate.seedCost > 0     && <RatioFill $color="#22c55e" $width={toP(estimate.seedCost)} />}
                  </RatioBar>
                  <RatioLegend>
                    {[
                      { category: '자재비', color: '#3b82f6', value: estimate.materialCost },
                      { category: '시공비', color: '#fb923c', value: estimate.laborCost },
                      { category: '종자비', color: '#22c55e', value: estimate.seedCost },
                    ].filter(i => i.value > 0).map((item) => (
                      <LegendItem key={item.category}>
                        <LegendDot $color={item.color} />
                        <LegendText>{getEstimateCategoryLabel(item.category, locale)} {number(Math.round((item.value / total) * 1000) / 10)}%</LegendText>
                      </LegendItem>
                    ))}
                  </RatioLegend>
                </RatioWrapper>
              )
            })()}

            {/* 항목별 명세 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {(['자재비', '시공비', '종자비'] as const).map((cat) => {
                const items = estimate.breakdown.filter((i) => i.category === cat)
                if (items.length === 0) return null
                const catTotal = items.reduce((s, i) => s + i.totalPrice, 0)
                return (
                  <CatDetails key={cat}>
                    <CatSummary>
                      <CatLeft>
                        <CatDot $color={CAT_COLORS[cat]} />
                        <CatName>{getEstimateCategoryLabel(cat, locale)}</CatName>
                      </CatLeft>
                      <CatRight>
                        <CatTotal>{money(catTotal)}</CatTotal>
                        <CatArrow>▼</CatArrow>
                      </CatRight>
                    </CatSummary>
                    <CatBody>
                      {items.map((item) => (
                        <LineItem key={item.code}>
                          <LineLeft>
                            <LineName>{getEstimateItemLabel(item.code, item.name, locale)}</LineName>
                            <LineMeta>{number(item.quantity)} {getUnitLabel(item.unit, locale)} × {money(item.unitPrice)}</LineMeta>
                          </LineLeft>
                          <LineTotal>{money(item.totalPrice)}</LineTotal>
                        </LineItem>
                      ))}
                    </CatBody>
                  </CatDetails>
                )
              })}
            </div>

            {/* 합계 */}
            <TotalBox>
              <TotalRow><TotalLabel>{getEstimateCategoryLabel('자재비', locale)}</TotalLabel><TotalValue>{money(estimate.materialCost)}</TotalValue></TotalRow>
              <TotalRow><TotalLabel>{getEstimateCategoryLabel('시공비', locale)}</TotalLabel><TotalValue>{money(estimate.laborCost)}</TotalValue></TotalRow>
              <TotalRow><TotalLabel>{getEstimateCategoryLabel('종자비', locale)}</TotalLabel><TotalValue>{money(estimate.seedCost)}</TotalValue></TotalRow>
              {(estimate.discount ?? 0) > 0 && (
                <TotalRow>
                  <TotalLabel style={{color:'#dc2626'}}>
                    🏷️ {text('Discount', '할인')}
                    {discountMemo && <span style={{fontSize:'0.65rem',color:'#9ca3af',marginLeft:'0.3rem'}}>({discountMemo})</span>}
                  </TotalLabel>
                  <TotalValue style={{color:'#dc2626'}}>−{money(estimate.discount)}</TotalValue>
                </TotalRow>
              )}
              <TotalDivider>
                <TotalRow><TotalLabel>{text('Subtotal', '소계')}</TotalLabel><TotalValue>{money(estimate.subtotal)}</TotalValue></TotalRow>
                {estimate.vat > 0 && (
                  <TotalRow>
                    <TotalLabel>{text('VAT (10%)', '부가세 (10%)')} <span style={{fontSize:'0.65rem',color:'#9ca3af'}}>{text('rhizomes exempt', '종근 면세')}</span></TotalLabel>
                    <TotalValue>{money(estimate.vat)}</TotalValue>
                  </TotalRow>
                )}
                <GrandTotal>
                  <GrandLabel>{text('Final total', '최종 합계')}</GrandLabel>
                  <GrandValue>{money(estimate.total)}</GrandValue>
                </GrandTotal>
                <PerSqm>
                  {money(Math.round(estimate.total / (useDesignStore.getState().inputs.widthM * useDesignStore.getState().inputs.heightM)))}{text(' per ㎡', '/㎡')}
                </PerSqm>
              </TotalDivider>
            </TotalBox>

          </>
        ) : activeProfile.pricing.status === 'reference-only' && quantities ? (
          <ReferenceCard>
            <ReferenceHeader>
              <ReferenceTitle>{profileName}</ReferenceTitle>
              <ReferenceSub>{profileDescription}</ReferenceSub>
            </ReferenceHeader>
            <ReferenceList>
              {activeProfile.materials.map((material) => (
                <ReferenceItem key={material.code}>
                  <ReferenceItemTop>
                    <ReferenceName>{locale === 'ko' ? REFERENCE_MATERIAL_KO[material.code]?.name ?? material.name : getEstimateItemLabel(material.code, material.name, locale)}</ReferenceName>
                    <ReferenceQty>{referenceQuantity(material.role)}</ReferenceQty>
                  </ReferenceItemTop>
                  <ReferenceSpec>{locale === 'ko' ? REFERENCE_MATERIAL_KO[material.code]?.specification ?? material.specification : material.specification}</ReferenceSpec>
                </ReferenceItem>
              ))}
            </ReferenceList>
            {activeProfile.sources.map((source) => (
              <ReferenceSource key={source.url} href={source.url} target="_blank" rel="noreferrer">
                {text('Source', '출처')}: {source.label} ↗
              </ReferenceSource>
            ))}
            <ReferenceWarning>
              {activeProfile.id === 'US_HIGH_TRELLIS'
                ? text(
                    'Reference layout for planning and comparison only; local loads, soil, codes, and engineering review govern construction.',
                    '계획 및 비교용 참고 배치입니다. 실제 시공은 현지 하중, 토질, 법규 및 구조기술 검토를 따라야 합니다.',
                  )
                : text(
                    'Preliminary planning estimate; requires review by a qualified local engineer.',
                    '예비 계획 견적이며, 자격을 갖춘 현지 기술자의 검토가 필요합니다.',
                  )}
            </ReferenceWarning>
          </ReferenceCard>
        ) : (
          <EmptyState>
            <EmptyIcon>💰</EmptyIcon>
            <EmptyText>{text('Enter design information to calculate', '설계 정보를 입력하면')}<br />{text('a live estimate.', '실시간으로 견적이 계산됩니다')}</EmptyText>
          </EmptyState>
        )}
      </ScrollArea>
    </PanelWrapper>
  )
}
