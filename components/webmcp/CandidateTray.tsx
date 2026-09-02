'use client'

import styled from 'styled-components'
import type { DesignCandidate } from '@/lib/design/candidate-workspace'
import { useCandidateStore } from '@/stores/candidateStore'
import { useLocale } from '@/components/i18n/LocaleProvider'

const Tray = styled.section`
  position:absolute;left:1rem;right:1rem;bottom:1rem;z-index:20;
  background:rgba(255,255,255,0.96);backdrop-filter:blur(12px);
  border:1px solid #dbe7d8;border-radius:1rem;box-shadow:0 18px 45px rgba(26,46,24,0.18);
  padding:0.85rem;
  @media(max-width:640px){left:0.45rem;right:0.45rem;bottom:0.45rem;max-height:72%;overflow-y:auto;padding:0.65rem;}
`
const Header = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:0.65rem;gap:0.5rem;@media(max-width:640px){align-items:flex-start;flex-direction:column;}`
const Title = styled.strong`font-size:0.8rem;color:#1A2E18;`
const Hint = styled.span`font-size:0.68rem;color:#6b7280;`
const Cards = styled.div`display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.6rem;@media(max-width:640px){grid-template-columns:1fr;}`
const Card = styled.article<{ $active: boolean }>`
  min-width:0;padding:0.7rem;border-radius:0.75rem;
  border:1.5px solid ${({ $active }) => $active ? '#2D5A27' : '#e5e7eb'};
  background:${({ $active }) => $active ? '#F0F7EF' : 'white'};
`
const CardTop = styled.div`display:flex;align-items:flex-start;justify-content:space-between;gap:0.4rem;`
const Label = styled.strong`font-size:0.78rem;color:#1A2E18;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`
const Market = styled.span`font-size:0.58rem;font-weight:700;background:#eef2ff;color:#4338ca;padding:0.12rem 0.3rem;border-radius:999px;white-space:nowrap;`
const Rationale = styled.p`font-size:0.65rem;line-height:1.35;color:#6b7280;margin:0.3rem 0 0.55rem;min-height:1.8em;`
const Metrics = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:0.3rem;margin-bottom:0.55rem;`
const Metric = styled.div`background:#f9fafb;border-radius:0.45rem;padding:0.3rem;text-align:center;`
const MetricLabel = styled.div`font-size:0.55rem;color:#9ca3af;`
const MetricValue = styled.div`font-size:0.66rem;font-weight:700;color:#374151;margin-top:0.12rem;`
const PreviewButton = styled.button<{ $active: boolean }>`
  width:100%;border:0;border-radius:0.5rem;padding:0.42rem;cursor:pointer;font-size:0.68rem;font-weight:700;
  color:${({ $active }) => $active ? '#166534' : 'white'};
  background:${({ $active }) => $active ? '#dcfce7' : '#2D5A27'};
`
const ReviewBar = styled.div`
  margin-top:0.65rem;padding-top:0.65rem;border-top:1px solid #e5e7eb;
  display:flex;align-items:center;justify-content:space-between;gap:0.75rem;
  @media(max-width:640px){align-items:stretch;flex-direction:column;}
`
const ReviewText = styled.div`font-size:0.68rem;color:#4b5563;min-width:0;`
const ReviewActions = styled.div`display:flex;gap:0.4rem;flex-shrink:0;@media(max-width:640px){& > button{flex:1;}}`
const ActionButton = styled.button<{ $primary?: boolean }>`
  border:1px solid ${({ $primary }) => $primary ? '#2D5A27' : '#d1d5db'};
  background:${({ $primary }) => $primary ? '#2D5A27' : 'white'};
  color:${({ $primary }) => $primary ? 'white' : '#4b5563'};
  border-radius:0.5rem;padding:0.4rem 0.65rem;font-size:0.68rem;font-weight:700;cursor:pointer;
`

export function CandidateTray() {
  const visibleCandidates = useCandidateStore((state) => state.visibleCandidates)
  const previewCandidate = useCandidateStore((state) => state.previewCandidate)
  const preview = useCandidateStore((state) => state.preview)
  const applyPreview = useCandidateStore((state) => state.applyPreview)
  const discardPreview = useCandidateStore((state) => state.discardPreview)
  const {text,number,currency}=useLocale()

  const formatCost = (candidate:DesignCandidate):string => {
    const total = candidate.simulation.estimate?.total
    if (total === null || total === undefined) return text('Pricing needed', '가격 정보 필요')
    return currency(total,'KRW')
  }

  const formatSafety = (status:string|undefined):string => {
    if (status === 'GREEN') return text('Safe', '안전')
    if (status === 'YELLOW') return text('Caution', '주의')
    if (status === 'RED') return text('Risk', '위험')
    return text('Review', '검토 필요')
  }

  if (visibleCandidates.length === 0) return null

  return (
    <Tray aria-label={text('Agent design candidates', '에이전트 설계 후보')}>
      <Header>
        <Title>{text('Agent design alternatives', '에이전트 설계 대안')}</Title>
        <Hint>{text('Preview changes are not saved until you approve them.', '미리보기 변경 사항은 승인할 때까지 저장되지 않습니다.')}</Hint>
      </Header>
      <Cards>
        {visibleCandidates.map((candidate) => {
          const simulation = candidate.simulation
          const active = previewCandidate?.simulation.candidateId === simulation.candidateId
          return (
            <Card key={simulation.candidateId} $active={active}>
              <CardTop>
                <Label title={candidate.label}>{candidate.label}</Label>
                <Market>{simulation.profile.market}</Market>
              </CardTop>
              <Rationale>{candidate.rationale || simulation.profile.name}</Rationale>
              <Metrics>
                <Metric><MetricLabel>{text('Plants', '식재 수')}</MetricLabel><MetricValue>{number(simulation.quantities.plantCount)}</MetricValue></Metric>
                <Metric><MetricLabel>{text('Safety', '안전성')}</MetricLabel><MetricValue>{formatSafety(simulation.loads?.safetyStatus)}</MetricValue></Metric>
                <Metric><MetricLabel>{text('Estimate', '예상 비용')}</MetricLabel><MetricValue>{formatCost(candidate)}</MetricValue></Metric>
              </Metrics>
              <PreviewButton $active={active} onClick={() => preview(simulation.candidateId)}>
                {active ? text('Previewing', '미리보기 중') : text('Preview in canvas', '캔버스에서 미리보기')}
              </PreviewButton>
            </Card>
          )
        })}
      </Cards>
      {previewCandidate && (
        <ReviewBar>
          <ReviewText>
            <strong>{previewCandidate.label}</strong>{' '}
            {text(
              'is an uncommitted preview. Review the 2D/3D canvas and calculated quantities before applying.',
              '은(는) 아직 적용되지 않은 미리보기입니다. 적용하기 전에 2D/3D 캔버스와 계산 수량을 확인하세요.',
            )}
          </ReviewText>
          <ReviewActions>
            <ActionButton onClick={discardPreview}>{text('Discard', '취소')}</ActionButton>
            <ActionButton $primary onClick={applyPreview}>{text('Apply design', '설계 적용')}</ActionButton>
          </ReviewActions>
        </ReviewBar>
      )}
    </Tray>
  )
}
