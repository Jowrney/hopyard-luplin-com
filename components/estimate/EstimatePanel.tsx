'use client'

import styled from 'styled-components'
import { useDesignStore } from '@/stores/designStore'
import { formatKRW } from '@/lib/calculations/estimate'
import type { EstimateLineItem, SafetyStatus } from '@/types'

// ── 스타일 ──────────────────────────────────────────
const PanelWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`

const PanelHeader = styled.div`
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #E8E4DC;
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
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
    flex: 1;
    overflow-y: auto;
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

// 하단 버튼
const OutlineBtn = styled.button`
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #2D5A27;
    color: #2D5A27;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #F0F7EF; }
`

const PrimaryBtn = styled.button`
    width: 100%;
    padding: 0.75rem;
    background: #2D5A27;
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #234820; }
`

// 빈 상태
const EmptyState = styled.div`
    text-align: center;
    padding: 3rem 1rem;
    color: #9ca3af;
`

const EmptyIcon = styled.p`font-size: 2.5rem; margin-bottom: 0.75rem;`
const EmptyText = styled.p`font-size: 0.875rem; line-height: 1.5;`

// ── 상수 ──────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  '자재비': '#3b82f6',
  '시공비': '#fb923c',
  '종자비': '#22c55e',
}

const SAFETY_LABEL: Record<SafetyStatus, string> = {
  GREEN:  '✅ 구조 안전',
  YELLOW: '⚠️ 주의 — 와이어 보강 권장',
  RED:    '🚨 위험 — 와이어 즉시 보강 필요',
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export function EstimatePanel({ onPDFClick }: { onPDFClick?: () => void }) {
  const { estimate, quantities, loads, isCalculating, discountMemo } = useDesignStore()

  return (
    <PanelWrapper>
      <PanelHeader>
        <PanelTitle>실시간 견적</PanelTitle>
        {isCalculating && <CalcText>계산 중…</CalcText>}
      </PanelHeader>

      <ScrollArea>
        {/* 수량 요약 */}
        {quantities && (
          <SummaryBox>
            <SummaryLabel>수량 요약</SummaryLabel>
            <SummaryRow><SummaryKey>총 폴 수량</SummaryKey><SummaryVal>{quantities.totalPoleCount.toLocaleString('ko-KR')}개</SummaryVal></SummaryRow>
            <SummaryRow><SummaryKey>와이어 길이</SummaryKey><SummaryVal>{quantities.totalWireM.toLocaleString('ko-KR')} m</SummaryVal></SummaryRow>
            <SummaryRow><SummaryKey>앵커 수량</SummaryKey><SummaryVal>{quantities.anchorCount.toLocaleString('ko-KR')}개</SummaryVal></SummaryRow>
            <SummaryRow><SummaryKey>재식 주수</SummaryKey><SummaryVal>{quantities.plantCount.toLocaleString('ko-KR')}주</SummaryVal></SummaryRow>
            <SummaryRow><SummaryKey>종근 소요량</SummaryKey><SummaryVal>{quantities.rhizomeCount.toLocaleString('ko-KR')}주 (예비 10%)</SummaryVal></SummaryRow>
          </SummaryBox>
        )}

        {/* 하중 분석 */}
        {loads && (
          <LoadCard>
            <LoadCardHeader>
              <LoadCardTitle>구조 하중 분석</LoadCardTitle>
            </LoadCardHeader>
            <LoadCardBody>
              <LoadRow>
                <LoadLabel>홉 생체중 하중</LoadLabel>
                <LoadValue>{loads.hopLoadKN.toFixed(2)} kN</LoadValue>
              </LoadRow>
              <LoadRow>
                <div>
                  <LoadLabel>풍압 하중</LoadLabel>
                  <LoadSub>설계풍속 {loads.windSpeedMs.toFixed(1)} m/s</LoadSub>
                </div>
                <LoadValue>{loads.windLoadKN.toFixed(2)} kN</LoadValue>
              </LoadRow>
              <LoadRow>
                <LoadLabel $bold>총 설계 하중</LoadLabel>
                <LoadValue $bold>{loads.totalLoadKN.toFixed(2)} kN</LoadValue>
              </LoadRow>
              <LoadRow>
                <LoadLabel $bold>설계 인장력 (×1.5)</LoadLabel>
                <LoadValue $bold>{loads.designTensionKN.toFixed(2)} kN</LoadValue>
              </LoadRow>
              <WireDivider>
                <WireLabel>권장 와이어</WireLabel>
                <WireValue>Φ{loads.recommendedWireDiameterMM}mm 이상</WireValue>
              </WireDivider>
            </LoadCardBody>
            <SafetyBarWrapper $status={loads.safetyStatus}>
              {SAFETY_LABEL[loads.safetyStatus]}
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
                  <RatioLabel>비용 구성 비율</RatioLabel>
                  <RatioBar>
                    {estimate.materialCost > 0 && <RatioFill $color="#3b82f6" $width={toP(estimate.materialCost)} />}
                    {estimate.laborCost > 0    && <RatioFill $color="#fb923c" $width={toP(estimate.laborCost)} />}
                    {estimate.seedCost > 0     && <RatioFill $color="#22c55e" $width={toP(estimate.seedCost)} />}
                  </RatioBar>
                  <RatioLegend>
                    {[
                      { label: '자재비', color: '#3b82f6', value: estimate.materialCost },
                      { label: '시공비', color: '#fb923c', value: estimate.laborCost },
                      { label: '종자비', color: '#22c55e', value: estimate.seedCost },
                    ].filter(i => i.value > 0).map((item) => (
                      <LegendItem key={item.label}>
                        <LegendDot $color={item.color} />
                        <LegendText>{item.label} {((item.value / total) * 100).toFixed(1)}%</LegendText>
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
                        <CatName>{cat}</CatName>
                      </CatLeft>
                      <CatRight>
                        <CatTotal>{formatKRW(catTotal)}</CatTotal>
                        <CatArrow>▼</CatArrow>
                      </CatRight>
                    </CatSummary>
                    <CatBody>
                      {items.map((item) => (
                        <LineItem key={item.code}>
                          <LineLeft>
                            <LineName>{item.name}</LineName>
                            <LineMeta>{item.quantity.toLocaleString('ko-KR')} {item.unit} × {formatKRW(item.unitPrice)}</LineMeta>
                          </LineLeft>
                          <LineTotal>{formatKRW(item.totalPrice)}</LineTotal>
                        </LineItem>
                      ))}
                    </CatBody>
                  </CatDetails>
                )
              })}
            </div>

            {/* 합계 */}
            <TotalBox>
              <TotalRow><TotalLabel>자재비</TotalLabel><TotalValue>{formatKRW(estimate.materialCost)}</TotalValue></TotalRow>
              <TotalRow><TotalLabel>시공비</TotalLabel><TotalValue>{formatKRW(estimate.laborCost)}</TotalValue></TotalRow>
              <TotalRow><TotalLabel>종자비</TotalLabel><TotalValue>{formatKRW(estimate.seedCost)}</TotalValue></TotalRow>
              {(estimate.discount ?? 0) > 0 && (
                <TotalRow>
                  <TotalLabel style={{color:'#dc2626'}}>
                    🏷️ 할인
                    {discountMemo && <span style={{fontSize:'0.65rem',color:'#9ca3af',marginLeft:'0.3rem'}}>({discountMemo})</span>}
                  </TotalLabel>
                  <TotalValue style={{color:'#dc2626'}}>−{formatKRW(estimate.discount)}</TotalValue>
                </TotalRow>
              )}
              <TotalDivider>
                <TotalRow><TotalLabel>소계</TotalLabel><TotalValue>{formatKRW(estimate.subtotal)}</TotalValue></TotalRow>
                {estimate.vat > 0 && (
                  <TotalRow>
                    <TotalLabel>부가세 (10%) <span style={{fontSize:'0.65rem',color:'#9ca3af'}}>종근 면세</span></TotalLabel>
                    <TotalValue>{formatKRW(estimate.vat)}</TotalValue>
                  </TotalRow>
                )}
                <GrandTotal>
                  <GrandLabel>최종 합계</GrandLabel>
                  <GrandValue>{formatKRW(estimate.total)}</GrandValue>
                </GrandTotal>
                <PerSqm>
                  ㎡당 {formatKRW(Math.round(estimate.total / (useDesignStore.getState().inputs.widthM * useDesignStore.getState().inputs.heightM)))}
                </PerSqm>
              </TotalDivider>
            </TotalBox>

            <OutlineBtn onClick={onPDFClick}>📄 견적서 PDF 출력</OutlineBtn>
          </>
        ) : (
          <EmptyState>
            <EmptyIcon>💰</EmptyIcon>
            <EmptyText>설계 정보를 입력하면<br />실시간으로 견적이 계산됩니다</EmptyText>
          </EmptyState>
        )}
      </ScrollArea>
    </PanelWrapper>
  )
}
