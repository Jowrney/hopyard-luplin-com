'use client'

import styled from 'styled-components'
import type { DesignCandidate } from '@/lib/design/candidate-workspace'
import { useCandidateStore } from '@/stores/candidateStore'

const Tray = styled.section`
  position:absolute;left:1rem;right:1rem;bottom:1rem;z-index:20;
  background:rgba(255,255,255,0.96);backdrop-filter:blur(12px);
  border:1px solid #dbe7d8;border-radius:1rem;box-shadow:0 18px 45px rgba(26,46,24,0.18);
  padding:0.85rem;
`
const Header = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:0.65rem;`
const Title = styled.strong`font-size:0.8rem;color:#1A2E18;`
const Hint = styled.span`font-size:0.68rem;color:#6b7280;`
const Cards = styled.div`display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.6rem;`
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
`
const ReviewText = styled.div`font-size:0.68rem;color:#4b5563;min-width:0;`
const ReviewActions = styled.div`display:flex;gap:0.4rem;flex-shrink:0;`
const ActionButton = styled.button<{ $primary?: boolean }>`
  border:1px solid ${({ $primary }) => $primary ? '#2D5A27' : '#d1d5db'};
  background:${({ $primary }) => $primary ? '#2D5A27' : 'white'};
  color:${({ $primary }) => $primary ? 'white' : '#4b5563'};
  border-radius:0.5rem;padding:0.4rem 0.65rem;font-size:0.68rem;font-weight:700;cursor:pointer;
`

function formatCost(candidate: DesignCandidate): string {
  const total = candidate.simulation.estimate?.total
  if (total === null || total === undefined) return 'Pricing needed'
  return `₩${total.toLocaleString('ko-KR')}`
}

export function CandidateTray() {
  const visibleCandidates = useCandidateStore((state) => state.visibleCandidates)
  const previewCandidate = useCandidateStore((state) => state.previewCandidate)
  const preview = useCandidateStore((state) => state.preview)
  const applyPreview = useCandidateStore((state) => state.applyPreview)
  const discardPreview = useCandidateStore((state) => state.discardPreview)

  if (visibleCandidates.length === 0) return null

  return (
    <Tray aria-label="Agent design candidates">
      <Header>
        <Title>Agent design alternatives</Title>
        <Hint>Preview changes are not saved until you approve them.</Hint>
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
                <Metric><MetricLabel>Plants</MetricLabel><MetricValue>{simulation.quantities.plantCount.toLocaleString()}</MetricValue></Metric>
                <Metric><MetricLabel>Safety</MetricLabel><MetricValue>{simulation.loads?.safetyStatus ?? 'Review'}</MetricValue></Metric>
                <Metric><MetricLabel>Estimate</MetricLabel><MetricValue>{formatCost(candidate)}</MetricValue></Metric>
              </Metrics>
              <PreviewButton $active={active} onClick={() => preview(simulation.candidateId)}>
                {active ? 'Previewing' : 'Preview in canvas'}
              </PreviewButton>
            </Card>
          )
        })}
      </Cards>
      {previewCandidate && (
        <ReviewBar>
          <ReviewText>
            <strong>{previewCandidate.label}</strong> is an uncommitted preview. Review the 2D/3D canvas and calculated quantities before applying.
          </ReviewText>
          <ReviewActions>
            <ActionButton onClick={discardPreview}>Discard</ActionButton>
            <ActionButton $primary onClick={applyPreview}>Apply design</ActionButton>
          </ReviewActions>
        </ReviewBar>
      )}
    </Tray>
  )
}
