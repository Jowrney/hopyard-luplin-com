// components/design/SafetyBadge.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import styled, { keyframes, css } from 'styled-components'
import type { SafetyStatus } from '@/types'
import { useDesignStore } from '@/stores/designStore'
import { WIRE_DIAMETER_TO_CODE } from '@/lib/calculations/loads'

const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.4}`

const Wrapper = styled.div`position:relative;`

const Badge = styled.button<{ $status: SafetyStatus }>`
    display:flex;align-items:center;gap:0.375rem;padding:0.375rem 0.75rem;
    border-radius:9999px;border:1px solid;font-size:0.75rem;font-weight:500;
    cursor:pointer;transition:all 0.15s;background:none;
    ${({$status})=>$status==='GREEN'  && `border-color:#bbf7d0;color:#15803d;background:#f0fdf4;&:hover{background:#dcfce7;}`}
    ${({$status})=>$status==='YELLOW' && `border-color:#fde68a;color:#b45309;background:#fffbeb;&:hover{background:#fef3c7;}`}
    ${({$status})=>$status==='RED'    && `border-color:#fecaca;color:#dc2626;background:#fef2f2;&:hover{background:#fee2e2;}`}
`

const Dot = styled.span<{ $status: SafetyStatus }>`
    width:0.375rem;height:0.375rem;border-radius:50%;flex-shrink:0;
    ${({$status})=>$status==='GREEN'  && `background:#22c55e;`}
    ${({$status})=>$status==='YELLOW' && `background:#f59e0b;`}
    ${({$status})=>$status==='RED'    && css`background:#ef4444;animation:${pulse} 1s infinite;`}
`

const HintIcon = styled.span`font-size:0.625rem;opacity:0.6;margin-left:0.125rem;`

const Popover = styled.div`
    position:absolute;top:calc(100% + 0.5rem);left:0;background:white;
    border:1px solid #E8E4DC;border-radius:0.75rem;
    box-shadow:0 8px 24px rgba(0,0,0,0.12);width:300px;z-index:100;overflow:hidden;
`
const PopHeader = styled.div<{$status:SafetyStatus}>`
    padding:0.75rem 1rem;
    ${({$status})=>$status==='GREEN'  && `background:#f0fdf4;border-bottom:1px solid #bbf7d0;`}
    ${({$status})=>$status==='YELLOW' && `background:#fffbeb;border-bottom:1px solid #fde68a;`}
    ${({$status})=>$status==='RED'    && `background:#fef2f2;border-bottom:1px solid #fecaca;`}
`
const PopTitle = styled.p<{$status:SafetyStatus}>`
    font-size:0.875rem;font-weight:700;margin:0;
    ${({$status})=>$status==='GREEN'  && `color:#15803d;`}
    ${({$status})=>$status==='YELLOW' && `color:#b45309;`}
    ${({$status})=>$status==='RED'    && `color:#dc2626;`}
`
const PopBody = styled.div`padding:0.75rem 1rem;display:flex;flex-direction:column;gap:0.5rem;`
const Row = styled.div`display:flex;align-items:center;justify-content:space-between;`
const Label = styled.span`font-size:0.75rem;color:#6b7280;`
const Value = styled.span<{$bold?:boolean;$color?:string}>`
    font-size:0.75rem;font-weight:${({$bold})=>$bold?'700':'500'};
    color:${({$color})=>$color??'#1A2E18'};
`
const Divider = styled.div`border-top:1px solid #f3f4f6;margin:0.25rem 0;`
const BarWrapper = styled.div`margin-top:0.25rem;`
const BarLabel = styled.div`display:flex;justify-content:space-between;margin-bottom:0.25rem;`
const BarTrack = styled.div`height:6px;background:#f3f4f6;border-radius:9999px;overflow:hidden;`
const BarFill = styled.div<{$pct:number;$status:SafetyStatus}>`
    height:100%;border-radius:9999px;width:${({$pct})=>Math.min($pct,100)}%;transition:width 0.4s;
    ${({$status})=>$status==='GREEN'  && `background:#22c55e;`}
    ${({$status})=>$status==='YELLOW' && `background:#f59e0b;`}
    ${({$status})=>$status==='RED'    && `background:#ef4444;`}
`
const UpgradeBtn = styled.button`
    width:100%;padding:0.625rem 1rem;background:#2D5A27;color:white;border:none;
    border-radius:0.5rem;font-size:0.8125rem;font-weight:700;cursor:pointer;
    transition:background 0.15s;display:flex;align-items:center;justify-content:center;gap:0.5rem;
    &:hover{background:#234820;}
`
const PopFooter = styled.div<{$status:SafetyStatus}>`
    padding:0.625rem 1rem;font-size:0.75rem;border-top:1px solid #f3f4f6;
    ${({$status})=>$status==='GREEN'  && `color:#15803d;background:#f0fdf4;`}
    ${({$status})=>$status==='YELLOW' && `color:#b45309;background:#fffbeb;`}
    ${({$status})=>$status==='RED'    && `color:#dc2626;background:#fef2f2;`}
`

const STATUS_LABEL: Record<SafetyStatus,string> = {
  GREEN:'구조 안전', YELLOW:'주의 필요', RED:'위험 — 와이어 보강 필요',
}

// props 없이 스토어 직접 구독 — 와이어 교체 즉시 반영
export function SafetyBadge() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭시 닫기
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])
  const loads            = useDesignStore((s) => s.loads)
  const selectedWireCode = useDesignStore((s) => s.selectedWireCode)
  const setSelectedWire  = useDesignStore((s) => s.setSelectedWire)

  if (!loads) return null

  const { safetyStatus, designTensionKN, currentAllowableTensionKN,
    hopLoadKN, windLoadKN, recommendedWireDiameterMM } = loads

  const usagePct = (designTensionKN / currentAllowableTensionKN) * 100
  const shortage = designTensionKN > currentAllowableTensionKN
    ? designTensionKN - currentAllowableTensionKN : null

  const recommendedCode = WIRE_DIAMETER_TO_CODE[recommendedWireDiameterMM]
  const canUpgrade = recommendedCode && recommendedCode !== selectedWireCode
    && (safetyStatus === 'RED' || safetyStatus === 'YELLOW')

  const handleUpgrade = () => { setSelectedWire(recommendedCode); setOpen(false) }

  return (
    <Wrapper ref={wrapperRef}>
      <Badge $status={safetyStatus} onClick={()=>setOpen(v=>!v)}>
        <Dot $status={safetyStatus}/>
        {STATUS_LABEL[safetyStatus]}
        <HintIcon>ⓘ</HintIcon>
      </Badge>

      {open && (
        <Popover>
          <PopHeader $status={safetyStatus}>
            <PopTitle $status={safetyStatus}>{STATUS_LABEL[safetyStatus]}</PopTitle>
          </PopHeader>
          <PopBody>
            <Row><Label>홉 생체중 하중</Label><Value>{hopLoadKN.toFixed(2)} kN</Value></Row>
            <Row><Label>풍압 하중</Label><Value>{windLoadKN.toFixed(2)} kN</Value></Row>
            <Divider/>
            <Row><Label>설계 인장력 (×1.5)</Label><Value $bold>{designTensionKN.toFixed(2)} kN</Value></Row>
            <Row><Label>현재 와이어 허용 인장력</Label><Value>{currentAllowableTensionKN.toFixed(2)} kN</Value></Row>
            <BarWrapper>
              <BarLabel>
                <Label>하중 사용률</Label>
                <Value $bold $color={usagePct>=100?'#dc2626':usagePct>=90?'#b45309':'#15803d'}>
                  {usagePct.toFixed(1)}%
                </Value>
              </BarLabel>
              <BarTrack><BarFill $pct={Math.min(usagePct,100)} $status={safetyStatus}/></BarTrack>
            </BarWrapper>
            {shortage !== null && (
              <Row>
                <Label>⚠️ 인장력 부족량</Label>
                <Value $bold $color="#dc2626">+{shortage.toFixed(2)} kN 초과</Value>
              </Row>
            )}
            <Row>
              <Label>권장 와이어</Label>
              <Value $bold $color="#2D5A27">Φ{recommendedWireDiameterMM}mm 이상</Value>
            </Row>
            {canUpgrade && (
              <>
                <Divider/>
                <UpgradeBtn onClick={handleUpgrade}>
                  ⚡ Φ{recommendedWireDiameterMM}mm으로 즉시 교체
                </UpgradeBtn>
              </>
            )}
          </PopBody>
          <PopFooter $status={safetyStatus}>
            {safetyStatus==='GREEN'  && '✅ 설계 하중이 허용 범위 이내입니다.'}
            {safetyStatus==='YELLOW' && '⚠️ 와이어 보강을 권장합니다.'}
            {safetyStatus==='RED'    && '🚨 현재 와이어로는 하중을 버티지 못합니다.'}
          </PopFooter>
        </Popover>
      )}
    </Wrapper>
  )
}
