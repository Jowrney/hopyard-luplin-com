'use client'

import styled from 'styled-components'
import { useDesignStore } from '@/stores/designStore'
import { usePriceStore } from '@/stores/priceStore'
import { useQuery } from '@tanstack/react-query'
import type { WindRegion, TrainingType } from '@/types'
import type { LaborCosts } from '@/stores/designStore'
import { useState, useRef, useEffect } from 'react'
import { getRegionalProfile } from '@/lib/design/regional-profiles'
import { useLocale } from '@/components/i18n/LocaleProvider'
import {
  getEstimateItemLabel,
  getRegionLabel,
  getUnitLabel,
  getVarietyDescription,
  getVarietyName,
} from '@/lib/i18n'

// ── 지역/와이어 단수 옵션 ──────────────────────────────
const REGION_OPTIONS: { value: WindRegion; wind: string }[] = [
  { value: 'INLAND',  wind: '24 m/s' },
  { value: 'SEOUL',   wind: '26 m/s' },
  { value: 'GANGWON', wind: '30 m/s' },
  { value: 'COASTAL', wind: '35 m/s' },
  { value: 'JEJU',    wind: '40 m/s' },
]

const WIRE_ROWS_OPTIONS = [
  { value: 2, label: '2단' },
  { value: 3, label: '3단 (표준)' },
  { value: 4, label: '4단' },
  { value: 5, label: '5단' },
]

// ── 스타일 ──────────────────────────────────────────
const FormWrapper = styled.div`
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`

const FormHeader = styled.div``

const FormTitle = styled.h2`
    font-size: 0.9375rem;
    font-weight: 700;
    color: #1A2E18;
    margin: 0;
`

const FormDesc = styled.p`
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0.25rem 0 0;
`

const SectionWrapper = styled.div``

const SectionHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 0.75rem;
`

const SectionIcon = styled.span`font-size: 1rem;`

const SectionTitle = styled.h3`
    font-size: 0.875rem;
    font-weight: 600;
    color: #1A2E18;
    margin: 0;
`

const Grid2 = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
`

const InfoBox = styled.div`
    margin-top: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #F0F7EF;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #2D5A27;
`

const MaterialList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`

const MaterialCardBtn = styled.button<{ $selected: boolean }>`
    width: 100%;
    text-align: left;
    padding: 0.625rem 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid ${({ $selected }) => ($selected ? '#2D5A27' : '#e5e7eb')};
    background: ${({ $selected }) => ($selected ? '#F0F7EF' : 'white')};
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &:hover { border-color: ${({ $selected }) => ($selected ? '#2D5A27' : '#d1d5db')}; }
`

const MaterialInfo = styled.div``

const MaterialName = styled.p`
    font-size: 0.875rem;
    font-weight: 500;
    color: #1f2937;
    margin: 0;
`

const MaterialMeta = styled.p`
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0.125rem 0 0;
`

const MaterialPrice = styled.div`text-align: right; flex-shrink: 0; margin-left: 0.5rem;`

const MaterialPriceMain = styled.p`
    font-size: 0.875rem;
    font-weight: 700;
    color: #2D5A27;
    white-space: nowrap;
    margin: 0;
`

const MaterialPriceUnit = styled.p`
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0;
`

const WireRowsBtns = styled.div`
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
`

const WireRowBtn = styled.button<{ $selected: boolean }>`
    flex: 1;
    padding: 0.5rem;
    font-size: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid ${({ $selected }) => ($selected ? '#2D5A27' : '#e5e7eb')};
    background: ${({ $selected }) => ($selected ? '#2D5A27' : 'white')};
    color: ${({ $selected }) => ($selected ? 'white' : '#4b5563')};
    cursor: pointer;
    font-weight: 500;
    transition: all 0.15s;
`

const VarietyBtn = styled.button<{ $selected: boolean }>`
    width: 100%;
    text-align: left;
    padding: 0.625rem 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid ${({ $selected }) => ($selected ? '#2D5A27' : '#e5e7eb')};
    background: ${({ $selected }) => ($selected ? '#F0F7EF' : 'white')};
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &:hover { border-color: ${({ $selected }) => ($selected ? '#2D5A27' : '#d1d5db')}; }
`

const VarietyNameRow = styled.div`display: flex; align-items: center; gap: 0.5rem;`

const VarietyName = styled.span`font-size: 0.875rem; font-weight: 600; color: #1f2937;`

const OwnBrandBadge = styled.span`
    font-size: 0.625rem;
    background: #2D5A27;
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 9999px;
`

const VarietyDesc = styled.p`
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0.125rem 0 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 180px;
`

const TrainingTypeList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`
const TrainingBtn = styled.button<{$selected:boolean}>`
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    width: 100%;
    padding: 0.6rem 0.875rem;
    border-radius: 0.625rem;
    border: 1.5px solid ${({$selected})=>$selected?'#2D5A27':'#e5e7eb'};
    background: ${({$selected})=>$selected?'rgba(45,90,39,0.06)':'white'};
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    &:hover { border-color: #2D5A27; }
`
const TrainingLabel = styled.span`
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a2e18;
`
const TrainingDesc = styled.span`
    font-size: 0.72rem;
    color: #6b7280;
`

// ── 드롭다운 공통 ─────────────────────────────────────
const DropdownWrap = styled.div`position:relative;width:100%;`
const DropdownBtn = styled.button`
    width:100%;padding:0.6rem 0.875rem;border:1.5px solid #e5e7eb;border-radius:0.625rem;
    background:white;font-size:0.875rem;color:#111827;text-align:left;cursor:pointer;
    display:flex;align-items:center;justify-content:space-between;
    transition:border-color 0.15s;
    &:hover,&:focus{border-color:#2D5A27;outline:none;}
`
const DropdownArrow = styled.span<{$open:boolean}>`
    font-size:0.75rem;color:#9ca3af;transition:transform 0.15s;
    transform:${({$open})=>$open?'rotate(180deg)':'none'};
`
const DropdownMenu = styled.div`
    position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:100;
    background:white;border:1.5px solid #e5e7eb;border-radius:0.75rem;
    box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;
`
const DropdownItem = styled.button<{$selected:boolean}>`
    width:100%;padding:0.625rem 0.875rem;text-align:left;border:none;cursor:pointer;
    background:${({$selected})=>$selected?'#F0F7EF':'white'};
    font-size:0.825rem;color:#111827;
    display:flex;align-items:center;justify-content:space-between;gap:0.5rem;
    &:hover{background:#F0F7EF;}
    &:first-child{border-radius:0.625rem 0.625rem 0 0;}
    &:last-child{border-radius:0 0 0.625rem 0.625rem;}
`
const DropdownItemName = styled.span`font-weight:500;flex:1;min-width:0;`
const DropdownItemSub  = styled.span`font-size:0.72rem;color:#6b7280;flex-shrink:0;`
const DropdownCheck    = styled.span`color:#2D5A27;font-weight:700;font-size:0.875rem;flex-shrink:0;`
const MultiTag = styled.span`
    display:inline-flex;align-items:center;gap:0.25rem;
    background:#F0F7EF;border:1px solid #bbf7d0;border-radius:999px;
    padding:0.15rem 0.5rem;font-size:0.72rem;color:#166534;
`
const MultiTagX = styled.button`
    background:none;border:none;cursor:pointer;color:#166534;
    font-size:0.75rem;padding:0;line-height:1;
    &:hover{color:#dc2626;}
`
const TagsRow = styled.div`display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.4rem;`

const VarietyStatus = styled.div<{$status:'ok'|'over'|'under'}>`
    margin-top:0.5rem;padding:0.5rem 0.75rem;border-radius:0.625rem;font-size:0.78rem;font-weight:500;
    ${({$status})=>$status==='ok'   ? 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;' : ''}
    ${({$status})=>$status==='over' ? 'background:#fefce8;color:#ca8a04;border:1px solid #fde68a;' : ''}
    ${({$status})=>$status==='under'? 'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;' : ''}
    ${({$status})=>$status==='under'&&'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;'}
`

const VarietyQtyList = styled.div`
    margin-top:0.5rem;display:flex;flex-direction:column;gap:0.5rem;
`
const VarietyQtyRow = styled.div`
    background:#f9fafb;border-radius:0.75rem;padding:0.625rem 0.75rem;
    display:flex;flex-direction:column;gap:0.35rem;
`
const VarietyQtyName = styled.div`
    font-size:0.8rem;font-weight:600;color:#1A2E18;
    display:flex;align-items:center;justify-content:space-between;
`
const VarietyQtyPrice = styled.span`font-size:0.7rem;color:#6b7280;font-weight:400;`
const VarietyQtyCtrl = styled.div`
    display:flex;align-items:center;gap:0.3rem;
`
const QtyBtn = styled.button`
    width:1.75rem;height:1.75rem;border-radius:0.4rem;border:1.5px solid #e5e7eb;
    background:white;font-size:1rem;font-weight:700;color:#374151;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    &:hover{border-color:#2D5A27;color:#2D5A27;}
`
const QtyInput = styled.input`
    width:4rem;height:1.75rem;border:1.5px solid #e5e7eb;border-radius:0.4rem;
    text-align:center;font-size:0.825rem;color:#111827;outline:none;
    &:focus{border-color:#2D5A27;}
`
const QtyUnit = styled.span`font-size:0.75rem;color:#6b7280;`
const VarietyQtyTotal = styled.div`
    font-size:0.72rem;color:#2D5A27;font-weight:600;text-align:right;
`
const VarietyQtySummary = styled.div`
    display:flex;justify-content:space-between;
    padding:0.5rem 0.75rem;background:#F0F7EF;border-radius:0.625rem;
    font-size:0.8rem;font-weight:700;color:#1A2E18;
`

const DiscountSectionLabel = styled.div`
    font-size:0.75rem;font-weight:700;color:#6b7280;
    padding:0.5rem 0 0.25rem;
    border-top:1px solid #e5e7eb;
    margin-top:0.25rem;
    letter-spacing:0.02em;
    text-transform:uppercase;
`

const DiscountBox = styled.div`
    background:#f9fafb;border-radius:0.75rem;padding:0.75rem;
    display:flex;flex-direction:column;gap:0.5rem;
    border:1.5px solid #e5e7eb;
`
const DiscountRow = styled.div`display:flex;align-items:center;gap:0.5rem;`
const DiscountLabel = styled.span`font-size:0.825rem;font-weight:600;color:#374151;flex-shrink:0;`
const DiscountInputWrap = styled.div`
    flex:1;display:flex;align-items:center;border:1.5px solid #e5e7eb;border-radius:0.5rem;
    background:white;overflow:hidden;
    &:focus-within{border-color:#dc2626;}
`
const DiscountPrefix = styled.span`
    padding:0 0.4rem;font-size:0.8rem;color:#dc2626;font-weight:600;
    background:#fef2f2;border-right:1px solid #e5e7eb;line-height:2rem;
`
const DiscountInput = styled.input`
    flex:1;border:none;outline:none;padding:0 0.5rem;
    font-size:0.8rem;color:#dc2626;font-weight:600;height:2rem;background:transparent;
    &::placeholder{color:#d1d5db;font-weight:400;}
`
const DiscountMemoInput = styled.input`
    width:100%;padding:0.4rem 0.6rem;border:1.5px solid #e5e7eb;border-radius:0.5rem;
    font-size:0.75rem;color:#6b7280;outline:none;box-sizing:border-box;
    &:focus{border-color:#2D5A27;}
    &::placeholder{color:#d1d5db;}
`

const LaborInputGrid = styled.div`
    background: #f9fafb; border-radius: 0.75rem;
    padding: 0.75rem; margin-top: 0.5rem;
    display: flex; flex-direction: column; gap: 0.5rem;
`
const LaborInputItem = styled.div`display: flex; align-items: center; gap: 0.5rem;`
const LaborInputLabel = styled.span`
    font-size: 0.75rem; color: #374151; font-weight: 500;
    width: 3rem; flex-shrink: 0;
`
const LaborInputWrap = styled.div`
    flex: 1; display: flex; align-items: center;
    border: 1.5px solid #e5e7eb; border-radius: 0.5rem;
    background: white; overflow: hidden;
    &:focus-within { border-color: #2D5A27; }
`
const LaborInputPrefix = styled.span`
    padding: 0 0.4rem; font-size: 0.75rem; color: #9ca3af; background: #f9fafb;
    border-right: 1px solid #e5e7eb; line-height: 2rem;
`
const LaborInputField = styled.input`
    flex: 1; border: none; outline: none; padding: 0 0.5rem;
    font-size: 0.8rem; color: #111827; height: 2rem;
    background: transparent;
    &::placeholder { color: #d1d5db; }
`
const LaborTotal = styled.div`
    font-size: 0.78rem; font-weight: 700; color: #2D5A27;
    text-align: right; padding-top: 0.25rem;
    border-top: 1px solid #e5e7eb; margin-top: 0.25rem;
`

const RegionList = styled.div`display: flex; flex-direction: column; gap: 0.375rem;`

const RegionBtn = styled.button<{ $selected: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid ${({ $selected }) => ($selected ? '#2D5A27' : '#e5e7eb')};
    background: ${({ $selected }) => ($selected ? '#F0F7EF' : 'white')};
    color: ${({ $selected }) => ($selected ? '#2D5A27' : '#4b5563')};
    font-size: 0.875rem;
    font-weight: ${({ $selected }) => ($selected ? '500' : '400')};
    cursor: pointer;
    transition: all 0.15s;
`

const RegionWind = styled.span`font-size: 0.75rem; color: #9ca3af;`

const ToggleBtn = styled.button<{ $checked: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid ${({ $checked }) => ($checked ? '#2D5A27' : '#e5e7eb')};
    background: ${({ $checked }) => ($checked ? '#F0F7EF' : 'white')};
    cursor: pointer;
    transition: all 0.15s;
`

const ToggleLeft = styled.div`text-align: left;`
const ToggleLabel = styled.p`font-size: 0.875rem; font-weight: 500; color: #1f2937; margin: 0;`
const ToggleDesc = styled.p`font-size: 0.75rem; color: #9ca3af; margin: 0.125rem 0 0;`

const ToggleTrack = styled.div<{ $checked: boolean }>`
    width: 2.5rem;
    height: 1.25rem;
    border-radius: 9999px;
    background: ${({ $checked }) => ($checked ? '#2D5A27' : '#d1d5db')};
    display: flex;
    align-items: center;
    padding: 0 0.125rem;
    transition: background 0.2s;
    flex-shrink: 0;
`

const ToggleThumb = styled.div<{ $checked: boolean }>`
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transform: translateX(${({ $checked }) => ($checked ? '1.25rem' : '0')});
    transition: transform 0.2s;
`

const NumInputWrapper = styled.div<{ $className?: string }>`
    ${({ $className }) => $className}
`

const NumLabel = styled.label`
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: #4b5563;
    margin-bottom: 0.25rem;
`

const NumRow = styled.div`display: flex; align-items: center; gap: 0.25rem;`

const NumBtn = styled.button`
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    background: white;
    color: #6b7280;
    cursor: pointer;
    font-weight: 700;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s;
    flex-shrink: 0;

    &:hover { background: #f9fafb; }
`

const NumInput = styled.input`
    flex: 1;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 600;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    height: 2rem;
    outline: none;
    transition: border-color 0.15s;
    background: white;

    &:focus { border-color: #2D5A27; }
`

const SkeletonItem = styled.div`
  height: 3.5rem;
  background: #f3f4f6;
  border-radius: 0.75rem;
  animation: pulse 1.5s infinite;
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`

// ── 타입 ──────────────────────────────────────────────
interface Material {
  code: string; name: string; spec: string | null
  unit: string; unitPrice: number; metadata: unknown
}
interface Category { code: string; materials: Material[] }
interface Variety {
  code: string; name: string; nameKo: string | null
  characteristics: string | null; unitPrice: number; isOwnBrand: boolean
}

// ── 서브 컴포넌트 ─────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <SectionWrapper>
      <SectionHeader>
        <SectionIcon>{icon}</SectionIcon>
        <SectionTitle>{title}</SectionTitle>
      </SectionHeader>
      {children}
    </SectionWrapper>
  )
}

function NumberInput({ label, value, min, max, step, onChange, mt }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; mt?: string
}) {
  return (
    <div style={{ marginTop: mt }}>
      <NumLabel>{label}</NumLabel>
      <NumRow>
        <NumBtn onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}>−</NumBtn>
        <NumInput
          type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v) && v >= min && v <= max) onChange(v)
          }}
        />
        <NumBtn onClick={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))}>+</NumBtn>
      </NumRow>
    </div>
  )
}

function MatCard({ material, selected, onSelect, meta }: {
  material: Material; selected: boolean; onSelect: () => void; meta?: string
}) {
  const { locale, currency } = useLocale()
  return (
    <MaterialCardBtn $selected={selected} onClick={onSelect}>
      <MaterialInfo>
        <MaterialName>{getEstimateItemLabel(material.code, material.name, locale)}</MaterialName>
        {(meta || material.spec) && (
          <MaterialMeta>{meta ?? material.spec}</MaterialMeta>
        )}
      </MaterialInfo>
      <MaterialPrice>
        <MaterialPriceMain>{currency(material.unitPrice, 'KRW')}</MaterialPriceMain>
        <MaterialPriceUnit>/{getUnitLabel(material.unit, locale)}</MaterialPriceUnit>
      </MaterialPrice>
    </MaterialCardBtn>
  )
}

function ToggleOption({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <ToggleBtn $checked={checked} onClick={() => onChange(!checked)}>
      <ToggleLeft>
        <ToggleLabel>{label}</ToggleLabel>
        <ToggleDesc>{description}</ToggleDesc>
      </ToggleLeft>
      <ToggleTrack $checked={checked}>
        <ToggleThumb $checked={checked} />
      </ToggleTrack>
    </ToggleBtn>
  )
}

function SkeletonList() {
  return (
    <MaterialList>
      {[1,2,3].map(i => <SkeletonItem key={i} />)}
    </MaterialList>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export function DesignInputForm() {
  const { locale, text, number, currency } = useLocale()
  const {
    profileId, inputs, selectedPoleCode, selectedWireCode, selectedAnchorCode,
    selectedVarietyCode, includeLabor, includeVat, laborCosts, setLaborCosts,
    discountAmount, discountMemo, setDiscount,
    quantities,
    updateInputs, setSelectedPole, setSelectedWire, setSelectedAnchor,
    setSelectedVariety, setIncludeLabor, setIncludeVat, setVarietySeedInfo,
  } = useDesignStore()

  // 드롭다운 열림 상태
  const [poleOpen,    setPoleOpen]    = useState(false)
  const [anchorOpen,  setAnchorOpen]  = useState(false)
  const [wireOpen,    setWireOpen]    = useState(false)
  const [varietyOpen, setVarietyOpen] = useState(false)
  const [trainOpen,   setTrainOpen]   = useState(false)
  const [regionOpen,  setRegionOpen]  = useState(false)
  // 멀티 품종 선택 + 수량
  const [selectedVarieties, setSelectedVarieties] = useState<string[]>(
    selectedVarietyCode ? [selectedVarietyCode] : []
  )
  // 초기 수량: 기본 선택 품종에 plantCount 전량 배정
  const [varietyQty, setVarietyQty] = useState<Record<string,number>>(() => {
    if (selectedVarietyCode && (quantities?.plantCount ?? 0) > 0) {
      return { [selectedVarietyCode]: quantities!.plantCount }
    }
    return {}
  })

  // 설계 기준 필요 종근 수량
  const requiredQty = quantities?.plantCount ?? 0  // 설계 기준 실제 식재 수량

  // quantities 변경 시 — 품종 1개만 선택된 경우 수량 자동 동기화
  useEffect(() => {
    if (selectedVarieties.length === 1 && quantities?.plantCount) {
      setVarietyQty({ [selectedVarieties[0]]: quantities.plantCount })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantities?.plantCount])

  // 품종별 총 종자비 계산 (varieties 데이터 기반)
  const toggleVariety = (code: string, unitPrice: number) => {
    setSelectedVarieties(prev => {
      const isRemoving = prev.includes(code)
      const next = isRemoving ? prev.filter(c=>c!==code) : [...prev, code]
      if (next.length > 0) setSelectedVariety(next[0], unitPrice)

      // 균등 배분 재계산
      if (requiredQty > 0 && next.length > 0) {
        const base = Math.floor(requiredQty / next.length)
        const rem  = requiredQty % next.length
        const newQty: Record<string,number> = {}
        next.forEach((c, i) => { newQty[c] = base + (i === 0 ? rem : 0) })
        setVarietyQty(newQty)
      } else {
        setVarietyQty({})
      }
      return next
    })
  }
  const setQty = (code: string, qty: number) => {
    setVarietyQty(prev => ({ ...prev, [code]: Math.max(0, qty) }))
  }
  // 선택된 품종 총 수량 합계
  const totalVarietyQty = selectedVarieties.reduce((sum, code) => sum + (varietyQty[code] || 0), 0)
  const qtyDiff  = totalVarietyQty - requiredQty  // 양수: 초과, 음수: 부족
  const qtyOk    = requiredQty === 0 || totalVarietyQty === requiredQty

  // 드롭다운 바깥 클릭 닫기
  const poleRef    = useRef<HTMLDivElement>(null)
  const anchorRef   = useRef<HTMLDivElement>(null)
  const wireRef    = useRef<HTMLDivElement>(null)
  const varietyRef = useRef<HTMLDivElement>(null)
  const trainRef   = useRef<HTMLDivElement>(null)
  const regionRef  = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (poleRef.current    && !poleRef.current.contains(e.target as Node))    setPoleOpen(false)
      if (anchorRef.current  && !anchorRef.current.contains(e.target as Node))  setAnchorOpen(false)
      if (wireRef.current    && !wireRef.current.contains(e.target as Node))    setWireOpen(false)
      if (varietyRef.current && !varietyRef.current.contains(e.target as Node)) setVarietyOpen(false)
      if (trainRef.current   && !trainRef.current.contains(e.target as Node))   setTrainOpen(false)
      if (regionRef.current  && !regionRef.current.contains(e.target as Node))  setRegionOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: materialsData } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => (await fetch('/api/admin/materials')).json(),
  })

  const { data: varietiesData } = useQuery({
    queryKey: ['varieties'],
    queryFn: async () => (await fetch('/api/admin/varieties')).json(),
  })

  const categories: Category[] = materialsData?.data ?? []
  const varieties: Variety[] = varietiesData?.data ?? []

  const calcSeedTotal = (varQty: Record<string,number>, varList: Variety[]) =>
    Object.entries(varQty).reduce((sum, [code, qty]) => {
      const v = varList.find(vv => vv.code === code)
      return sum + (v ? v.unitPrice * qty : 0)
    }, 0)

  // 품종/수량이 바뀔 때 store에 종자비 정보 전달
  useEffect(() => {
    if (varieties.length === 0) return
    const totalQty = selectedVarieties.reduce((s,code) => s + (varietyQty[code]||0), 0)
    const totalAmt = calcSeedTotal(varietyQty, varieties)
    if (selectedVarieties.length > 0 && totalQty > 0) {
      const avgPrice = Math.round(totalAmt / totalQty)
      setSelectedVariety(selectedVarieties[0], avgPrice)
    }
    setVarietySeedInfo({ seedTotal: totalAmt, totalVarietyQty: totalQty })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(varietyQty), selectedVarieties.join(','), varieties.length])

  const poles   = categories.find((c) => c.code === 'POLE')?.materials ?? []
  const wires   = categories.find((c) => c.code === 'WIRE')?.materials ?? []
  const anchors = categories.find((c) => c.code === 'ANCHOR')?.materials ?? []
  const areaM2  = inputs.widthM * inputs.heightM
  const activeProfile = getRegionalProfile(profileId)
  const materialName = (code: string, fallback: string) => getEstimateItemLabel(code, fallback, locale)
  const profileMaterialName = (code: string) => {
    const material = activeProfile.materials.find(candidate => candidate.code === code)
    return material ? materialName(material.code, material.name) : undefined
  }
  const varietyName = (variety: Variety) => getVarietyName(
    variety.code,
    locale === 'ko' ? variety.nameKo ?? variety.name : variety.name,
    locale,
  )
  const price = (value: number) => currency(value, activeProfile.currency)

  return (
    <FormWrapper>
      <FormHeader>
        <FormTitle>{text('Hopyard design', '농장 설계 정보')}</FormTitle>
        <FormDesc>{text('The estimate updates as you change the inputs.', '입력값이 바뀌면 견적이 즉시 업데이트됩니다')}</FormDesc>
      </FormHeader>

      {/* 1. 농장 면적 */}
      <Section title={text('Hopyard area', '농장 면적')} icon="📐">
        <Grid2>
          <NumberInput label={text('Width (m)', '가로 (m)')} value={inputs.widthM} min={5} max={500} step={1}
                       onChange={(v) => updateInputs({ widthM: v })} />
          <NumberInput label={text('Length (m)', '세로 (m)')} value={inputs.heightM} min={5} max={500} step={1}
                       onChange={(v) => updateInputs({ heightM: v })} />
        </Grid2>
        <InfoBox>
          {text('Growing area', '재배 면적')} <strong>{number(areaM2)} ㎡</strong>
          {' '}({number(Math.round(areaM2 / 3.3058))} {text('pyeong', '평')})
        </InfoBox>
      </Section>

      {/* 2. 폴 선택 */}
      <Section title={text('Select poles', '폴(지주) 선택')} icon="🏗️">
        <DropdownWrap ref={poleRef}>
          <DropdownBtn onClick={() => setPoleOpen(v=>!v)}>
            <span>{poles.find(p=>p.code===selectedPoleCode)
              ? materialName(selectedPoleCode, poles.find(p=>p.code===selectedPoleCode)!.name)
              : profileMaterialName(selectedPoleCode) ?? text('Select a pole', '폴 선택')}</span>
            <DropdownArrow $open={poleOpen}>▼</DropdownArrow>
          </DropdownBtn>
          {poleOpen && (
            <DropdownMenu>
              {poles.length === 0 ? <DropdownItem $selected={false} disabled>{text('Loading…', '로딩 중…')}</DropdownItem>
                : poles.map(pole => (
                  <DropdownItem key={pole.code} $selected={selectedPoleCode===pole.code}
                                onClick={() => {
                                  const meta = pole.metadata as {effective_height_m?:number}|null
                                  setSelectedPole(pole.code, meta?.effective_height_m)
                                  setPoleOpen(false)
                                }}>
                    <DropdownItemName>{materialName(pole.code, pole.name)}</DropdownItemName>
                    <DropdownItemSub>{price(pole.unitPrice)}</DropdownItemSub>
                    {selectedPoleCode===pole.code && <DropdownCheck>✓</DropdownCheck>}
                  </DropdownItem>
                ))}
            </DropdownMenu>
          )}
        </DropdownWrap>
        <Grid2 style={{ marginTop: '0.75rem' }}>
          <NumberInput label={text('Row spacing (m)', '행간 (m)')} value={inputs.rowSpacingM} min={1} max={15} step={0.1}
                       onChange={(v) => updateInputs({ rowSpacingM: v })} />
          <NumberInput label={text('Pole spacing (m)', '폴 간격 (m)')} value={inputs.poleSpacingM} min={1} max={20} step={0.1}
                       onChange={(v) => updateInputs({ poleSpacingM: v })} />
        </Grid2>
      </Section>

      {/* 3. 와이어 선택 */}
      <Section title={text('Select wire', '와이어 선택')} icon="🔗">
        <DropdownWrap ref={wireRef}>
          <DropdownBtn onClick={() => setWireOpen(v=>!v)}>
            <span>{wires.find(w=>w.code===selectedWireCode)
              ? materialName(selectedWireCode, wires.find(w=>w.code===selectedWireCode)!.name)
              : profileMaterialName(selectedWireCode) ?? text('Select wire', '와이어 선택')}</span>
            <DropdownArrow $open={wireOpen}>▼</DropdownArrow>
          </DropdownBtn>
          {wireOpen && (
            <DropdownMenu>
              {wires.length === 0 ? <DropdownItem $selected={false} disabled>{text('Loading…', '로딩 중…')}</DropdownItem>
                : wires.map(wire => {
                  const tensile = (wire.metadata as {tensile_strength_kn?:number}|null)?.tensile_strength_kn
                  return (
                    <DropdownItem key={wire.code} $selected={selectedWireCode===wire.code}
                                  onClick={() => { setSelectedWire(wire.code); setWireOpen(false) }}>
                      <DropdownItemName>{materialName(wire.code, wire.name)}</DropdownItemName>
                      <DropdownItemSub>{tensile ? `${number(tensile)} kN · ` : ''}{price(wire.unitPrice)}/m</DropdownItemSub>
                      {selectedWireCode===wire.code && <DropdownCheck>✓</DropdownCheck>}
                    </DropdownItem>
                  )
                })}
            </DropdownMenu>
          )}
        </DropdownWrap>
      </Section>

      {/* 4. 앵커 선택 */}
      <Section title={text('Select anchors', '앵커(지박) 선택')} icon="⚓">
        <DropdownWrap ref={anchorRef}>
          <DropdownBtn onClick={() => setAnchorOpen(v=>!v)}>
            <span>{anchors.find(a=>a.code===selectedAnchorCode)
              ? materialName(selectedAnchorCode, anchors.find(a=>a.code===selectedAnchorCode)!.name)
              : profileMaterialName(selectedAnchorCode) ?? text('Select an anchor', '앵커 선택')}</span>
            <DropdownArrow $open={anchorOpen}>▼</DropdownArrow>
          </DropdownBtn>
          {anchorOpen && (
            <DropdownMenu>
              {anchors.length === 0 ? <DropdownItem $selected={false} disabled>{text('Loading…', '로딩 중…')}</DropdownItem>
                : anchors.map(anchor => (
                  <DropdownItem key={anchor.code} $selected={selectedAnchorCode===anchor.code}
                                onClick={() => { setSelectedAnchor(anchor.code); setAnchorOpen(false) }}>
                    <DropdownItemName>{materialName(anchor.code, anchor.name)}</DropdownItemName>
                    <DropdownItemSub>{price(anchor.unitPrice)}/{getUnitLabel('개', locale)}</DropdownItemSub>
                    {selectedAnchorCode===anchor.code && <DropdownCheck>✓</DropdownCheck>}
                  </DropdownItem>
                ))}
            </DropdownMenu>
          )}
        </DropdownWrap>
      </Section>

      {/* 5. 홉 품종 */}
      <Section title={text('Hop varieties (rhizomes)', '홉 품종(종근)')} icon="🌱">
        <DropdownWrap ref={varietyRef}>
          <DropdownBtn onClick={() => setVarietyOpen(v=>!v)}>
            <span>
              {selectedVarieties.length === 0
                ? text('Select varieties (multiple allowed)', '품종 선택 (복수 가능)')
                : text(`${number(selectedVarieties.length)} selected`, `${number(selectedVarieties.length)}개 선택됨`)}
            </span>
            <DropdownArrow $open={varietyOpen}>▼</DropdownArrow>
          </DropdownBtn>
          {varietyOpen && (
            <DropdownMenu>
              {varieties.length === 0 ? <DropdownItem $selected={false} disabled>{text('Loading…', '로딩 중…')}</DropdownItem>
                : varieties.map(v => (
                  <DropdownItem key={v.code} $selected={selectedVarieties.includes(v.code)}
                                onClick={() => toggleVariety(v.code, v.unitPrice)}>
                    <div style={{flex:1,minWidth:0}}>
                      <DropdownItemName>
                        {varietyName(v)}{v.isOwnBrand ? ' 🌿' : ''}
                      </DropdownItemName>
                      {(getVarietyDescription(v.code, locale) || v.characteristics) && (
                        <div style={{fontSize:'0.7rem',color:'#6b7280',marginTop:'0.1rem'}}>
                          {getVarietyDescription(v.code, locale) || (locale === 'ko' ? v.characteristics : v.code)}
                        </div>
                      )}
                    </div>
                    <DropdownItemSub>{price(v.unitPrice)}/{getUnitLabel('주', locale)}</DropdownItemSub>
                    {selectedVarieties.includes(v.code) && <DropdownCheck>✓</DropdownCheck>}
                  </DropdownItem>
                ))}
            </DropdownMenu>
          )}
        </DropdownWrap>
        {selectedVarieties.length > 0 && (
          <VarietyQtyList>
            {selectedVarieties.map(code => {
              const v = varieties.find(vv=>vv.code===code)
              if (!v) return null
              const qty = varietyQty[code] || 0
              return (
                <VarietyQtyRow key={code}>
                  <VarietyQtyName>
                    {varietyName(v)}{v.isOwnBrand ? ' 🌿' : ''}
                    <VarietyQtyPrice>{price(v.unitPrice)}/{getUnitLabel('주', locale)}</VarietyQtyPrice>
                  </VarietyQtyName>
                  <VarietyQtyCtrl>
                    <QtyBtn onClick={() => setQty(code, qty - 10)}>−</QtyBtn>
                    <QtyInput
                      type="number" min={0} value={qty || ''}
                      placeholder="0"
                      onChange={e => setQty(code, Number(e.target.value) || 0)}
                    />
                    <QtyUnit>{getUnitLabel('주', locale)}</QtyUnit>
                    <QtyBtn onClick={() => setQty(code, qty + 10)}>+</QtyBtn>
                    <MultiTagX onClick={() => toggleVariety(code, v.unitPrice)} style={{marginLeft:'0.25rem'}}>×</MultiTagX>
                  </VarietyQtyCtrl>
                  <VarietyQtyTotal>
                    {text('Subtotal', '소계')} {price(v.unitPrice * qty)}
                  </VarietyQtyTotal>
                </VarietyQtyRow>
              )
            })}
            <VarietyQtySummary>
              <span>{text(`Total ${number(totalVarietyQty)} plants`, `총 ${number(totalVarietyQty)}주`)}</span>
              <span>{price(selectedVarieties.reduce((s,code)=>{
                const v=varieties.find(vv=>vv.code===code)
                return s+(v ? v.unitPrice*(varietyQty[code]||0) : 0)
              },0))}</span>
            </VarietyQtySummary>
          </VarietyQtyList>
        )}
        {/* 수량 상태 표시 */}
        {requiredQty > 0 && (
          <VarietyStatus $status={qtyDiff > 0 ? 'over' : qtyDiff < 0 ? 'under' : 'ok'}>
            {totalVarietyQty === 0 && text(
              `📋 Design requirement: ${number(requiredQty)} plants (recommended with 5% reserve: ${number(Math.ceil(requiredQty * 1.05))})`,
              `📋 설계 기준 필요 수량: ${number(requiredQty)}주 (예비 5% 추가 권장: ${number(Math.ceil(requiredQty * 1.05))}주)`,
            )}
            {qtyDiff === 0 && totalVarietyQty > 0 && text(
              `✅ Quantity matches — ${number(Math.ceil(requiredQty * 1.05))} recommended with a 5% reserve`,
              `✅ 설계 수량 일치 — 예비 5% 추가 시 ${number(Math.ceil(requiredQty * 1.05))}주 권장`,
            )}
            {qtyDiff > 0 && text(`⚠️ ${number(qtyDiff)} plants over the design quantity`, `⚠️ 설계보다 ${number(qtyDiff)}주 초과`)}
            {qtyDiff < 0 && totalVarietyQty > 0 && text(`⚠️ ${number(Math.abs(qtyDiff))} plants below the design quantity`, `⚠️ 설계보다 ${number(Math.abs(qtyDiff))}주 부족`)}
          </VarietyStatus>
        )}
        <NumberInput label={text('Plant spacing (m)', '주간 (m)')} value={inputs.plantSpacingM} min={0.5} max={3} step={0.1}
                     onChange={(v) => updateInputs({ plantSpacingM: v })} mt="0.75rem" />
      </Section>

      {/* 6. 유인방식 */}
      <Section title={text('Training system', '유인방식')} icon="🌿">
        <DropdownWrap ref={trainRef}>
          <DropdownBtn onClick={() => setTrainOpen(v=>!v)}>
            <span>{inputs.trainingType === 'V'
              ? text('V-trellis — 2 training strings', 'V자형 — 유인줄 2줄')
              : text('I-trellis — 1 training string', 'I자형 — 유인줄 1줄')}</span>
            <DropdownArrow $open={trainOpen}>▼</DropdownArrow>
          </DropdownBtn>
          {trainOpen && (
            <DropdownMenu>
              {([
                { value: 'V' as TrainingType, label: text('V-trellis', 'V자형'), desc: text('Two strings per plant, supported by wires on both sides', '홉당 유인줄 2줄, 양쪽 와이어 거치') },
                { value: 'I' as TrainingType, label: text('I-trellis', 'I자형'), desc: text('One string per plant, supported by a center-row wire', '홉당 유인줄 1줄, 두둑 중앙 와이어 거치') },
              ] as const).map(opt => (
                <DropdownItem key={opt.value} $selected={inputs.trainingType===opt.value}
                              onClick={() => { updateInputs({ trainingType: opt.value }); setTrainOpen(false) }}>
                  <div>
                    <DropdownItemName>{opt.label}</DropdownItemName>
                    <div style={{fontSize:'0.7rem',color:'#6b7280',marginTop:'0.1rem'}}>{opt.desc}</div>
                  </div>
                  {inputs.trainingType===opt.value && <DropdownCheck>✓</DropdownCheck>}
                </DropdownItem>
              ))}
            </DropdownMenu>
          )}
        </DropdownWrap>
      </Section>

      {/* 7. 지역 */}
      <Section title={text('Region (wind-load basis)', '지역 설정 (풍하중 기준)')} icon="💨">
        {activeProfile.loadModel === 'local-engineering-required' ? (
          <InfoBox>
            {text(
              'The North America reference profile requires local structural review for regional wind loads, soil conditions, and applicable codes.',
              '북미 reference profile은 지역별 풍하중·토질·법규에 따른 현지 구조 검토가 필요합니다.',
            )}
          </InfoBox>
        ) : (
          <DropdownWrap ref={regionRef}>
            <DropdownBtn onClick={() => setRegionOpen(v=>!v)}>
              <span>
                {getRegionLabel(inputs.region, locale) || text('Select a region', '지역 선택')}
                {' '}
                <span style={{fontSize:'0.75rem',color:'#6b7280'}}>
                  {text('Basic wind speed', '기본풍속')} {REGION_OPTIONS.find(o=>o.value===inputs.region)?.wind}
                </span>
              </span>
              <DropdownArrow $open={regionOpen}>▼</DropdownArrow>
            </DropdownBtn>
            {regionOpen && (
              <DropdownMenu>
                {REGION_OPTIONS.map(opt => (
                  <DropdownItem key={opt.value} $selected={inputs.region===opt.value}
                                onClick={() => { updateInputs({ region: opt.value }); setRegionOpen(false) }}>
                    <DropdownItemName>{getRegionLabel(opt.value, locale)}</DropdownItemName>
                    <DropdownItemSub>{text('Basic wind speed', '기본풍속')} {opt.wind}</DropdownItemSub>
                    {inputs.region===opt.value && <DropdownCheck>✓</DropdownCheck>}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            )}
          </DropdownWrap>
        )}
      </Section>

      {/* 7. 견적 옵션 */}
      <Section title={text('Estimate options', '견적 옵션')} icon="💰">
        <MaterialList>
          <ToggleOption label={text('Include installation', '시공비 포함')} description={text('Enter labor, equipment, planting, and other costs', '인건비·장비대·식재비·기타 직접 입력')}
                        checked={includeLabor} onChange={setIncludeLabor} />
          {includeLabor && (
            <LaborInputGrid>
              {([
                { key: 'laborFee',     label: text('Labor', '인건비') },
                { key: 'equipmentFee', label: text('Equipment', '장비대') },
                { key: 'plantingFee',  label: text('Planting', '식재비') },
                { key: 'etcFee',       label: text('Other', '기타') },
              ] as { key: keyof LaborCosts; label: string }[]).map(({ key, label }) => (
                <LaborInputItem key={key}>
                  <LaborInputLabel>{label}</LaborInputLabel>
                  <LaborInputWrap>
                    <LaborInputPrefix>{activeProfile.currency === 'KRW' ? '₩' : '$'}</LaborInputPrefix>
                    <LaborInputField
                      type="number" min={0} step={10000}
                      value={laborCosts[key] || ''}
                      placeholder="0"
                      onChange={(e) => setLaborCosts({ [key]: Number(e.target.value) || 0 })}
                    />
                  </LaborInputWrap>
                </LaborInputItem>
              ))}
              <LaborTotal>
                {text('Total', '합계')}: {price(
                (laborCosts.laborFee || 0) +
                (laborCosts.equipmentFee || 0) +
                (laborCosts.plantingFee || 0) +
                (laborCosts.etcFee || 0)
              )}
              </LaborTotal>
            </LaborInputGrid>
          )}
          <ToggleOption label={text('Include VAT (10%)', '부가세 포함 (10%)')} description={text('Applied to materials and installation; rhizomes are exempt', '종근(면세) 제외, 자재+시공비에 적용')}
                        checked={includeVat} onChange={setIncludeVat} />

          {/* 할인 */}
          <DiscountSectionLabel>🏷️ {text('Discount / adjustment', '할인 / 조정')}</DiscountSectionLabel>
          <DiscountBox>
            <DiscountRow>
              <DiscountLabel>{text('Amount', '금액')}</DiscountLabel>
              <DiscountInputWrap>
                <DiscountPrefix>−{activeProfile.currency === 'KRW' ? '₩' : '$'}</DiscountPrefix>
                <DiscountInput
                  type="number" min={0} step={10000}
                  value={discountAmount || ''}
                  placeholder="0"
                  onChange={e => setDiscount(Number(e.target.value) || 0, discountMemo)}
                />
              </DiscountInputWrap>
            </DiscountRow>
            <DiscountMemoInput
              type="text"
              value={discountMemo}
              placeholder={text('Discount note (e.g. direct farm sale)', '할인 사유 메모 (예: 농가 직거래 할인)')}
              onChange={e => setDiscount(discountAmount, e.target.value)}
            />
          </DiscountBox>
        </MaterialList>
      </Section>
    </FormWrapper>
  )
}
