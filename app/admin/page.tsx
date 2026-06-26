// app/admin/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import styled from 'styled-components'

// ── 타입 ──────────────────────────────────────────────
interface Material {
  id: string; code: string; name: string; spec: string | null
  unit: string; unitPrice: number; isActive: boolean; metadata: unknown
}
interface MaterialCategory {
  id: number; code: string; name: string; materials: Material[]
}
interface HopVariety {
  id: string; code: string; name: string; characteristics: string | null
  unitPrice: number; isActive: boolean; isOwnBrand: boolean
}

const KRW = (n: number) => `₩${n.toLocaleString('ko-KR')}`
const CAT_ICON: Record<string, string> = {
  POLE: '🏗️', WIRE: '🔗', CLIP: '🔩', ANCHOR: '⚓', LABOR: '👷',
}

// ── 스타일 ──────────────────────────────────────────
const PageWrapper = styled.div`min-height: 100vh; background: #F5F3EE;`

const PageHeader = styled.header`
    background: #1A2E18;
    color: white;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
`

const HeaderLeft = styled.div`display: flex; align-items: center; gap: 1rem;`

const HeaderLogo = styled(Link)`
    display: flex; align-items: center; gap: 0.5rem;
    text-decoration: none; opacity: 0.8; transition: opacity 0.15s;
    &:hover { opacity: 1; }
`

const HeaderDivider = styled.div`width: 1px; height: 1.25rem; background: rgba(255,255,255,0.2);`
const HeaderLabel = styled.span`color: #8BA888; font-size: 0.875rem;`

const HeaderRight = styled.div`display: flex; align-items: center; gap: 0.75rem;`

const HeaderLink = styled(Link)`
    font-size: 0.875rem; color: #8BA888; border: 1px solid rgba(255,255,255,0.2);
    padding: 0.375rem 0.75rem; border-radius: 0.5rem; text-decoration: none;
    transition: color 0.15s;
    &:hover { color: white; }
`

const AdminBadge = styled.div`
    font-size: 0.75rem; color: #8BA888; background: rgba(255,255,255,0.1);
    padding: 0.375rem 0.75rem; border-radius: 0.5rem;
`

const Content = styled.div`max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem;`

const StatsGrid = styled.div`
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;
    @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
`

const StatCard = styled.div`
    background: white; border-radius: 1rem; padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #E8E4DC;
`
const StatTop = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;`
const StatIcon = styled.span`font-size: 1.5rem;`
const StatValue = styled.span<{ $color: string }>`font-size: 1.5rem; font-weight: 700; color: ${({ $color }) => $color};`
const StatLabel = styled.p`font-size: 0.875rem; color: #6b7280;`

const Toolbar = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;`

const Tabs = styled.div`
    display: flex; align-items: center; gap: 0.25rem;
    background: white; border-radius: 0.75rem; padding: 0.25rem;
    border: 1px solid #E8E4DC; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`

const Tab = styled.button<{ $active: boolean }>`
    padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500;
    border-radius: 0.5rem; border: none; cursor: pointer; transition: all 0.15s;
    background: ${({ $active }) => ($active ? '#2D5A27' : 'transparent')};
    color: ${({ $active }) => ($active ? 'white' : '#6b7280')};
    box-shadow: ${({ $active }) => ($active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none')};
`

const SearchWrapper = styled.div`position: relative;`

const SearchIcon = styled.span`
    position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
    font-size: 0.875rem; color: #9ca3af;
`

const SearchInput = styled.input`
    padding: 0.5rem 1rem 0.5rem 2.25rem; font-size: 0.875rem;
    border: 1px solid #E8E4DC; border-radius: 0.75rem; outline: none;
    background: white; width: 224px; transition: border-color 0.15s;
    &:focus { border-color: #2D5A27; }
`

// 자재 테이블
const CategoryBlock = styled.div`
    background: white; border-radius: 1rem; border: 1px solid #E8E4DC;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; margin-bottom: 1rem;
`

const CatToggle = styled.button`
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.25rem; background: #F8FAF7; border: none; border-bottom: 1px solid #E8E4DC;
    cursor: pointer; transition: background 0.15s; text-align: left;
    &:hover { background: #F0F7EF; }
`

const CatInfo = styled.div`display: flex; align-items: center; gap: 0.75rem;`
const CatIcon = styled.span`font-size: 1.25rem;`
const CatName = styled.span`font-weight: 700; color: #1A2E18;`
const CatCount = styled.span`font-size: 0.75rem; color: #9ca3af; margin-left: 0.5rem;`
const CatArrow = styled.span`color: #9ca3af; font-size: 0.875rem;`

const Table = styled.table`width: 100%; border-collapse: collapse;`
const Thead = styled.thead``
const Tbody = styled.tbody``

const Th = styled.th<{ $align?: string }>`
    padding: 0.75rem 1rem; font-size: 0.75rem; color: #6b7280; font-weight: 500;
    border-bottom: 1px solid #E8E4DC;
    text-align: ${({ $align }) => $align ?? 'left'};
`

const Tr = styled.tr<{ $odd?: boolean }>`
    background: ${({ $odd }) => ($odd ? '#FAFAF8' : 'white')};
    border-bottom: 1px solid #E8E4DC;
    transition: background 0.1s;
    &:last-child { border-bottom: none; }
    &:hover { background: #F8FAF7; }
`

const Td = styled.td<{ $align?: string }>`
    padding: 0.875rem 1rem;
    text-align: ${({ $align }) => $align ?? 'left'};
`

const ItemName = styled.span`font-size: 0.875rem; font-weight: 600; color: #1A2E18;`
const ItemSpec = styled.span`font-size: 0.75rem; color: #6b7280;`
const CodeBadge = styled.code`font-size: 0.625rem; background: #f3f4f6; color: #4b5563; padding: 0.125rem 0.375rem; border-radius: 0.25rem;`
const UnitText = styled.span`font-size: 0.875rem; color: #4b5563;`
const PriceText = styled.span`font-size: 0.875rem; font-weight: 700; color: #2D5A27;`

const ActiveBadge = styled.span<{ $active: boolean }>`
    font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; font-weight: 500;
    background: ${({ $active }) => ($active ? '#dcfce7' : '#f3f4f6')};
    color: ${({ $active }) => ($active ? '#15803d' : '#6b7280')};
`

const EditButton = styled.button`
    font-size: 0.75rem; background: #2D5A27; color: white;
    padding: 0.375rem 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer;
    font-weight: 500; transition: background 0.15s;
    &:hover { background: #234820; }
`

// 품종 테이블 (공유)
const TableCard = styled.div`
    background: white; border-radius: 1rem; border: 1px solid #E8E4DC;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden;
`

const OwnBrandBadge = styled.span`
    font-size: 0.625rem; background: #2D5A27; color: white;
    padding: 0.125rem 0.375rem; border-radius: 9999px;
`

// 모달
const Overlay = styled.div`
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
`

const Modal = styled.div`width: 440px; background: white; border-radius: 1rem; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden;`

const ModalHeader = styled.div`
    background: #1A2E18; padding: 1.25rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
`

const ModalTitle = styled.h3`color: white; font-weight: 700; margin: 0;`
const ModalSubtitle = styled.p`color: #8BA888; font-size: 0.875rem; margin: 0.25rem 0 0;`
const ModalCloseBtn = styled.button`
    color: #8BA888; background: none; border: none; cursor: pointer;
    font-size: 1.25rem; width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center;
    &:hover { color: white; }
`

const ModalBody = styled.div`padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;`

const CurrentPriceBox = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    background: #F5F3EE; border-radius: 0.75rem; padding: 0.75rem 1rem;
`

const CurrentPriceLabel = styled.span`font-size: 0.875rem; color: #6b7280;`
const CurrentPriceValue = styled.span`font-size: 1.125rem; font-weight: 700; color: #1A2E18;`

const FieldLabel = styled.label`display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;`

const PriceInputRow = styled.div`display: flex; align-items: center; gap: 0.5rem;`

const StepBtn = styled.button`
    width: 2.25rem; height: 3rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;
    background: white; color: #6b7280; cursor: pointer; font-weight: 700; font-size: 1.125rem;
    display: flex; align-items: center; justify-content: center; transition: background 0.1s;
    &:hover { background: #f9fafb; }
`

const PriceInput = styled.input`
    flex: 1; text-align: center; font-size: 1.25rem; font-weight: 700;
    border: 1px solid #e5e7eb; border-radius: 0.75rem; height: 3rem; outline: none;
    transition: border-color 0.15s;
    &:focus { border-color: #2D5A27; }
`

const QuickBtns = styled.div`display: flex; gap: 0.5rem; margin-top: 0.5rem;`

const QuickBtn = styled.button<{ $negative: boolean }>`
    flex: 1; font-size: 0.75rem; padding: 0.375rem; border-radius: 0.5rem; cursor: pointer;
    font-weight: 500; transition: background 0.1s;
    border: 1px solid ${({ $negative }) => ($negative ? '#fecaca' : '#bfdbfe')};
    color: ${({ $negative }) => ($negative ? '#dc2626' : '#2563eb')};
    background: white;
    &:hover { background: ${({ $negative }) => ($negative ? '#fef2f2' : '#eff6ff')}; }
`

const DiffBox = styled.div<{ $positive: boolean }>`
    display: flex; align-items: center; justify-content: space-between;
    border-radius: 0.75rem; padding: 0.75rem 1rem;
    background: ${({ $positive }) => ($positive ? '#fef2f2' : '#eff6ff')};
    border: 1px solid ${({ $positive }) => ($positive ? '#fecaca' : '#bfdbfe')};
`

const DiffLabel = styled.span`font-size: 0.875rem; font-weight: 500; color: #374151;`
const DiffValue = styled.span<{ $positive: boolean }>`
    font-size: 0.875rem; font-weight: 700;
    color: ${({ $positive }) => ($positive ? '#dc2626' : '#2563eb')};
`

const Textarea = styled.textarea`
    width: 100%; padding: 0.625rem 0.75rem; font-size: 0.875rem;
    border: 1px solid #e5e7eb; border-radius: 0.75rem; outline: none; resize: none;
    box-sizing: border-box; font-family: inherit;
    transition: border-color 0.15s;
    &:focus { border-color: #2D5A27; }
`

const HintText = styled.p`font-size: 0.75rem; color: #9ca3af; margin: 0.25rem 0 0;`

const ModalFooter = styled.div`display: flex; gap: 0.75rem;`

const CancelBtn = styled.button`
    flex: 1; padding: 0.75rem; border: 1px solid #e5e7eb; color: #4b5563;
    border-radius: 0.75rem; background: white; font-weight: 500; font-size: 0.875rem;
    cursor: pointer; transition: background 0.15s;
    &:hover { background: #f9fafb; }
`

const SaveBtn = styled.button`
    flex: 2; padding: 0.75rem 1.5rem; background: #2D5A27; color: white;
    border-radius: 0.75rem; border: none; font-weight: 700; font-size: 0.875rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    transition: background 0.15s;
    &:hover:not(:disabled) { background: #234820; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const AddBtn = styled.button`
    padding:0.5rem 1rem;background:#2D5A27;color:white;border:none;border-radius:0.625rem;
    font-size:0.875rem;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;
    &:hover{background:#234820;}
`

const Toast = styled.div<{ $ok: boolean }>`
    position: fixed; bottom: 1.5rem; right: 1.5rem;
    padding: 0.75rem 1.25rem; border-radius: 0.75rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    color: white; font-size: 0.875rem; font-weight: 500; z-index: 60;
    background: ${({ $ok }) => ($ok ? '#2D5A27' : '#dc2626')};
`

const Skeleton = styled.div`
    background: white; border-radius: 1rem; border: 1px solid #E8E4DC;
    height: 12rem; margin-bottom: 1rem;
    animation: pulse 1.5s infinite;
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`

const EmptyBox = styled.div`
    background: white; border-radius: 1rem; border: 1px solid #E8E4DC; padding: 4rem 1.5rem; text-align: center;
`

// ── 서브 컴포넌트 ─────────────────────────────────────

function MaterialsTable({ categories, onEdit }: {
  categories: MaterialCategory[]
  onEdit: (m: Material) => void
}) {
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(categories.map((c) => c.code)))

  if (categories.length === 0) return <EmptyBox><p style={{ color: '#6b7280' }}>🔍 검색 결과가 없습니다</p></EmptyBox>

  return (
    <div>
      {categories.map((cat) => (
        <CategoryBlock key={cat.code}>
          <CatToggle onClick={() => setOpenCats((prev) => {
            const next = new Set(prev)
            next.has(cat.code) ? next.delete(cat.code) : next.add(cat.code)
            return next
          })}>
            <CatInfo>
              <CatIcon>{CAT_ICON[cat.code] ?? '📦'}</CatIcon>
              <span>
                <CatName>{cat.name}</CatName>
                <CatCount>{cat.materials.length}개 항목</CatCount>
              </span>
            </CatInfo>
            <CatArrow>{openCats.has(cat.code) ? '▲' : '▼'}</CatArrow>
          </CatToggle>

          {openCats.has(cat.code) && (
            <Table>
              <Thead>
                <tr>
                  <Th>품명</Th>
                  <Th>규격</Th>
                  <Th>코드</Th>
                  <Th $align="center">단위</Th>
                  <Th $align="right">현재 단가</Th>
                  <Th $align="center">상태</Th>
                  <Th $align="center">수정</Th>
                </tr>
              </Thead>
              <Tbody>
                {cat.materials.map((m, i) => (
                  <Tr key={m.id} $odd={i % 2 !== 0}>
                    <Td><ItemName>{m.name}</ItemName></Td>
                    <Td><ItemSpec>{m.spec ?? '—'}</ItemSpec></Td>
                    <Td><CodeBadge>{m.code}</CodeBadge></Td>
                    <Td $align="center"><UnitText>{m.unit}</UnitText></Td>
                    <Td $align="right"><PriceText>{KRW(m.unitPrice)}</PriceText></Td>
                    <Td $align="center"><ActiveBadge $active={m.isActive}>{m.isActive ? '활성' : '비활성'}</ActiveBadge></Td>
                    <Td $align="center"><EditButton onClick={() => onEdit(m)}>수정</EditButton></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CategoryBlock>
      ))}
    </div>
  )
}

function VarietiesTable({ varieties, onEdit }: {
  varieties: HopVariety[]
  onEdit: (v: HopVariety) => void
}) {
  if (varieties.length === 0) return <EmptyBox><p style={{ color: '#6b7280' }}>🔍 검색 결과가 없습니다</p></EmptyBox>

  return (
    <TableCard>
      <Table>
        <Thead>
          <tr style={{ background: '#F8FAF7' }}>
            <Th>품종명</Th>
            <Th>특성</Th>
            <Th>코드</Th>
            <Th $align="center">홉이든 자체</Th>
            <Th $align="right">현재 단가</Th>
            <Th $align="center">수정</Th>
          </tr>
        </Thead>
        <Tbody>
          {varieties.map((v, i) => (
            <Tr key={v.id} $odd={i % 2 !== 0}>
              <Td>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ItemName>{v.name}</ItemName>
                  {v.isOwnBrand && <OwnBrandBadge>홉이든</OwnBrandBadge>}
                </span>
              </Td>
              <Td><ItemSpec style={{ maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.characteristics ?? '—'}</ItemSpec></Td>
              <Td><CodeBadge>{v.code}</CodeBadge></Td>
              <Td $align="center">{v.isOwnBrand ? '⭐' : <span style={{ color: '#d1d5db' }}>—</span>}</Td>
              <Td $align="right">
                <PriceText>{KRW(v.unitPrice)}</PriceText>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '0.25rem' }}>/주</span>
              </Td>
              <Td $align="center"><EditButton onClick={() => onEdit(v)}>수정</EditButton></Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableCard>
  )
}

function EditMaterialModal({ data, onSave, onClose }: {
  data: Material
  onSave: (id: string, fields: Partial<Material>, reason: string) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ name: data.name, spec: data.spec ?? '', unit: data.unit, unitPrice: data.unitPrice })
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const diff = form.unitPrice - data.unitPrice
  const diffPct = data.unitPrice > 0 ? ((diff / data.unitPrice) * 100).toFixed(1) : '0'
  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: k === 'unitPrice' ? Math.max(1, Number(e.target.value)||1) : e.target.value }))

  const handleSave = async () => {
    if (!reason.trim()) return
    setIsSaving(true)
    await onSave(data.id, form, reason)
    setIsSaving(false)
  }

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <ModalHeader>
          <div><ModalTitle>자재 수정</ModalTitle><ModalSubtitle>{data.code}</ModalSubtitle></div>
          <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        </ModalHeader>
        <ModalBody>
          {[
            { key: 'name', label: '품명', type: 'text' },
            { key: 'spec', label: '규격', type: 'text' },
            { key: 'unit', label: '단위', type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key} style={{ marginBottom: '0.75rem' }}>
              <FieldLabel>{label}</FieldLabel>
              <PriceInput type={type} value={(form as Record<string,unknown>)[key] as string}
                          onChange={upd(key)} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
          ))}
          <FieldLabel>단가 (원)</FieldLabel>
          <PriceInputRow>
            <StepBtn onClick={() => setForm(f => ({ ...f, unitPrice: Math.max(1, f.unitPrice - 100) }))}>−</StepBtn>
            <PriceInput type="number" value={form.unitPrice} min={1}
                        onChange={upd('unitPrice')} />
            <StepBtn onClick={() => setForm(f => ({ ...f, unitPrice: f.unitPrice + 100 }))}>+</StepBtn>
          </PriceInputRow>
          <QuickBtns>
            {[-10, -5, +5, +10].map((pct) => (
              <QuickBtn key={pct} $negative={pct < 0}
                        onClick={() => setForm(f => ({ ...f, unitPrice: Math.round(data.unitPrice * (1 + pct / 100)) }))}>
                {pct > 0 ? '+' : ''}{pct}%
              </QuickBtn>
            ))}
          </QuickBtns>
          {diff !== 0 && (
            <DiffBox $positive={diff > 0}>
              <DiffLabel>단가 변동</DiffLabel>
              <div>
                <DiffValue $positive={diff > 0}>{diff > 0 ? '+' : ''}{KRW(diff)}</DiffValue>
                <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: diff > 0 ? '#ef4444' : '#3b82f6' }}>
                  ({diff > 0 ? '+' : ''}{diffPct}%)
                </span>
              </div>
            </DiffBox>
          )}
          <div style={{ marginTop: '0.75rem' }}>
            <FieldLabel>변경 사유 <span style={{ color: '#ef4444' }}>*</span></FieldLabel>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="예: 2026년 시세 반영" rows={2} />
            <HintText>변경 이력에 기록됩니다</HintText>
          </div>
          <ModalFooter>
            <CancelBtn onClick={onClose}>취소</CancelBtn>
            <SaveBtn onClick={handleSave} disabled={isSaving || !reason.trim()}>
              {isSaving ? '⌛ 저장 중…' : '저장'}
            </SaveBtn>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </Overlay>
  )
}

function EditVarietyModal({ data, onSave, onClose }: {
  data: HopVariety
  onSave: (id: string, fields: Partial<HopVariety>, reason: string) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ name: data.name, characteristics: data.characteristics ?? '', unitPrice: data.unitPrice, isOwnBrand: data.isOwnBrand })
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const diff = form.unitPrice - data.unitPrice
  const diffPct = data.unitPrice > 0 ? ((diff / data.unitPrice) * 100).toFixed(1) : '0'
  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: k === 'unitPrice' ? Math.max(1, Number(e.target.value)||1) : k === 'isOwnBrand' ? e.target.checked : e.target.value }))

  const handleSave = async () => {
    if (!reason.trim()) return
    setIsSaving(true)
    await onSave(data.id, form, reason)
    setIsSaving(false)
  }

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <ModalHeader>
          <div><ModalTitle>홉 품종 수정</ModalTitle><ModalSubtitle>{data.code}</ModalSubtitle></div>
          <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        </ModalHeader>
        <ModalBody>
          {[
            { key: 'name', label: '품종명', type: 'text' },
            { key: 'characteristics', label: '특성 설명', type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key} style={{ marginBottom: '0.75rem' }}>
              <FieldLabel>{label}</FieldLabel>
              <PriceInput type={type} value={(form as Record<string,unknown>)[key] as string}
                          onChange={upd(key)} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
          ))}
          <FieldLabel>단가/주 (원)</FieldLabel>
          <PriceInputRow>
            <StepBtn onClick={() => setForm(f => ({ ...f, unitPrice: Math.max(1, f.unitPrice - 100) }))}>−</StepBtn>
            <PriceInput type="number" value={form.unitPrice} min={1} onChange={upd('unitPrice')} />
            <StepBtn onClick={() => setForm(f => ({ ...f, unitPrice: f.unitPrice + 100 }))}>+</StepBtn>
          </PriceInputRow>
          <QuickBtns>
            {[-10, -5, +5, +10].map((pct) => (
              <QuickBtn key={pct} $negative={pct < 0}
                        onClick={() => setForm(f => ({ ...f, unitPrice: Math.round(data.unitPrice * (1 + pct / 100)) }))}>
                {pct > 0 ? '+' : ''}{pct}%
              </QuickBtn>
            ))}
          </QuickBtns>
          {diff !== 0 && (
            <DiffBox $positive={diff > 0}>
              <DiffLabel>단가 변동</DiffLabel>
              <div>
                <DiffValue $positive={diff > 0}>{diff > 0 ? '+' : ''}{KRW(diff)}</DiffValue>
                <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: diff > 0 ? '#ef4444' : '#3b82f6' }}>
                  ({diff > 0 ? '+' : ''}{diffPct}%)
                </span>
              </div>
            </DiffBox>
          )}
          <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="isOwnBrand" checked={form.isOwnBrand} onChange={upd('isOwnBrand')} />
            <label htmlFor="isOwnBrand" style={{ fontSize: '0.875rem', color: '#374151' }}>홉이든 자체 육종</label>
          </div>
          <div>
            <FieldLabel>변경 사유 <span style={{ color: '#ef4444' }}>*</span></FieldLabel>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="예: 2026년 시세 반영" rows={2} />
            <HintText>변경 이력에 기록됩니다</HintText>
          </div>
          <ModalFooter>
            <CancelBtn onClick={onClose}>취소</CancelBtn>
            <SaveBtn onClick={handleSave} disabled={isSaving || !reason.trim()}>
              {isSaving ? '⌛ 저장 중…' : '저장'}
            </SaveBtn>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </Overlay>
  )
}

function AddMaterialModal({ categories, onSave, onClose }: {
  categories: MaterialCategory[]
  onSave: (form: Record<string,unknown>) => void
  onClose: () => void
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0)
  const [form, setForm] = useState({ code: '', name: '', spec: '', unit: '개', unitPrice: 0 })
  const [saving, setSaving] = useState(false)
  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: k === 'unitPrice' ? Number(e.target.value) : e.target.value }))

  return (
    <Overlay onClick={e => e.target === e.currentTarget && onClose()}>
      <Modal>
        <ModalHeader>
          <div><ModalTitle>자재 등록</ModalTitle><ModalSubtitle>새 자재를 추가합니다</ModalSubtitle></div>
          <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        </ModalHeader>
        <ModalBody>
          <div style={{ marginBottom: '0.75rem' }}>
            <FieldLabel>카테고리</FieldLabel>
            <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))}
                    style={{ width:'100%', padding:'0.625rem', border:'1px solid #e5e7eb', borderRadius:'0.5rem', fontSize:'0.875rem' }}>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          {([
            { key: 'code', label: '코드 (예: POLE_STEEL_60_2T_6M)' },
            { key: 'name', label: '품명' },
            { key: 'spec', label: '규격 (선택)' },
            { key: 'unit', label: '단위' },
            { key: 'unitPrice', label: '단가 (원)', type: 'number' },
          ] as { key: string; label: string; type?: string }[]).map(({ key, label, type }) => (
            <div key={key} style={{ marginBottom: '0.75rem' }}>
              <FieldLabel>{label}</FieldLabel>
              <PriceInput type={type ?? 'text'} value={(form as Record<string,unknown>)[key] as string}
                          onChange={upd(key)} style={{ width:'100%', boxSizing:'border-box' }} />
            </div>
          ))}
          <ModalFooter>
            <CancelBtn onClick={onClose}>취소</CancelBtn>
            <SaveBtn disabled={saving || !form.code || !form.name || form.unitPrice < 1}
                     onClick={async () => { setSaving(true); await onSave({ ...form, categoryId }); setSaving(false) }}>
              {saving ? '등록 중…' : '등록하기'}
            </SaveBtn>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </Overlay>
  )
}

function AddVarietyModal({ onSave, onClose }: {
  onSave: (form: Record<string,unknown>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ code: '', name: '', characteristics: '', unitPrice: 0, recommendedSpacingM: 1.2, isOwnBrand: false })
  const [saving, setSaving] = useState(false)
  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: k === 'unitPrice' || k === 'recommendedSpacingM' ? Number(e.target.value) : k === 'isOwnBrand' ? e.target.checked : e.target.value }))

  return (
    <Overlay onClick={e => e.target === e.currentTarget && onClose()}>
      <Modal>
        <ModalHeader>
          <div><ModalTitle>홉 품종 등록</ModalTitle><ModalSubtitle>새 품종을 추가합니다</ModalSubtitle></div>
          <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        </ModalHeader>
        <ModalBody>
          {([
            { key: 'code', label: '코드 (예: HOP_CASCADE)' },
            { key: 'name', label: '품종명' },
            { key: 'characteristics', label: '특성 설명' },
            { key: 'unitPrice', label: '단가/주 (원)', type: 'number' },
            { key: 'recommendedSpacingM', label: '권장 주간 (m)', type: 'number' },
          ] as { key: string; label: string; type?: string }[]).map(({ key, label, type }) => (
            <div key={key} style={{ marginBottom: '0.75rem' }}>
              <FieldLabel>{label}</FieldLabel>
              <PriceInput type={type ?? 'text'} value={(form as Record<string,unknown>)[key] as string}
                          onChange={upd(key)} style={{ width:'100%', boxSizing:'border-box' }} />
            </div>
          ))}
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" id="isOwnBrand2" checked={form.isOwnBrand} onChange={upd('isOwnBrand')} />
            <label htmlFor="isOwnBrand2" style={{ fontSize: '0.875rem', color: '#374151' }}>홉이든 자체 육종</label>
          </div>
          <ModalFooter>
            <CancelBtn onClick={onClose}>취소</CancelBtn>
            <SaveBtn disabled={saving || !form.code || !form.name || form.unitPrice < 1}
                     onClick={async () => { setSaving(true); await onSave(form); setSaving(false) }}>
              {saving ? '등록 중…' : '등록하기'}
            </SaveBtn>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </Overlay>
  )
}

// ── 메인 ─────────────────────────────────────────────
export default function AdminPage() {
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [varieties, setVarieties] = useState<HopVariety[]>([])
  const [activeTab, setActiveTab] = useState<'materials' | 'varieties'>('materials')
  const [isLoading, setIsLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<{ type: 'material'; data: Material } | { type: 'variety'; data: HopVariety } | null>(null)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [showAddVariety, setShowAddVariety] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [matRes, varRes] = await Promise.all([
        fetch('/api/admin/materials'),
        fetch('/api/admin/varieties'),
      ])
      const matData = await matRes.json()
      const varData = await varRes.json()
      setCategories(matData.data ?? [])
      setVarieties(varData.data ?? [])
    } catch {
      showToast('데이터 로드 실패', false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddMaterial = async (form: Record<string,unknown>) => {
    try {
      const res = await fetch('/api/admin/materials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) { showToast('자재가 등록되었습니다'); setShowAddMaterial(false); fetchData() }
      else showToast('등록 실패: ' + (data.error ?? '오류'), false)
    } catch { showToast('네트워크 오류', false) }
  }

  const handleAddVariety = async (form: Record<string,unknown>) => {
    try {
      const res = await fetch('/api/admin/varieties', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) { showToast('품종이 등록되었습니다'); setShowAddVariety(false); fetchData() }
      else showToast('등록 실패: ' + (data.error ?? '오류'), false)
    } catch { showToast('네트워크 오류', false) }
  }

  const handleMaterialUpdate = async (id: string, fields: Record<string,unknown>, reason: string) => {
    try {
      const res = await fetch(`/api/admin/materials/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, unitPrice: fields.unitPrice, reason }),
      })
      const data = await res.json()
      if (data.success) { showToast('자재가 수정되었습니다 ✓'); setEditTarget(null); fetchData() }
      else showToast('수정 실패: ' + (data.error ?? '오류'), false)
    } catch { showToast('네트워크 오류', false) }
  }

  const handleVarietyUpdate = async (id: string, fields: Record<string,unknown>, reason: string) => {
    try {
      const res = await fetch(`/api/admin/varieties/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, reason }),
      })
      const data = await res.json()
      if (data.success) { showToast('품종이 수정되었습니다 ✓'); setEditTarget(null); fetchData() }
      else showToast('수정 실패: ' + (data.error ?? '오류'), false)
    } catch { showToast('네트워크 오류', false) }
  }

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    materials: cat.materials.filter((m) => !search || m.name.includes(search) || m.code.includes(search)),
  })).filter((cat) => cat.materials.length > 0)

  const filteredVarieties = varieties.filter((v) => !search || v.name.includes(search) || v.code.includes(search))

  return (
    <PageWrapper>
      <PageHeader>
        <HeaderLeft>
          <HeaderLogo href="/">
            <span style={{ fontSize: '1.25rem' }}>🌿</span>
            <span style={{ fontWeight: 700 }}>HopEden</span>
          </HeaderLogo>
          <HeaderDivider />
          <HeaderLabel>관리자 — 자재 단가 관리</HeaderLabel>
        </HeaderLeft>
        <HeaderRight>
          <HeaderLink href="/design">← 설계 페이지</HeaderLink>
          <AdminBadge>🔒 관리자 전용</AdminBadge>
        </HeaderRight>
      </PageHeader>

      <Content>
        <StatsGrid>
          {[
            { label: '총 자재 항목', value: categories.reduce((s, c) => s + c.materials.length, 0), icon: '📦', color: '#2563eb' },
            { label: '자재 카테고리', value: categories.length, icon: '📂', color: '#9333ea' },
            { label: '홉 품종', value: varieties.length, icon: '🌱', color: '#16a34a' },
            { label: '자체 육종', value: varieties.filter((v) => v.isOwnBrand).length, icon: '⭐', color: '#ca8a04' },
          ].map((stat) => (
            <StatCard key={stat.label}>
              <StatTop>
                <StatIcon>{stat.icon}</StatIcon>
                <StatValue $color={stat.color}>{stat.value}</StatValue>
              </StatTop>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsGrid>

        <Toolbar>
          <Tabs>
            <Tab $active={activeTab === 'materials'} onClick={() => setActiveTab('materials')}>📦 자재 단가</Tab>
            <Tab $active={activeTab === 'varieties'} onClick={() => setActiveTab('varieties')}>🌱 홉 품종 단가</Tab>
          </Tabs>
          <AddBtn onClick={() => activeTab === 'materials' ? setShowAddMaterial(true) : setShowAddVariety(true)}>+ {activeTab === 'materials' ? '자재 등록' : '품종 등록'}</AddBtn>
          <SearchWrapper>
            <SearchIcon>🔍</SearchIcon>
            <SearchInput
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="품명 또는 코드 검색…"
            />
          </SearchWrapper>
        </Toolbar>

        {isLoading ? (
          <div>{[1,2,3].map((i) => <Skeleton key={i} />)}</div>
        ) : activeTab === 'materials' ? (
          <MaterialsTable
            categories={filteredCategories}
            onEdit={(m) => setEditTarget({ type: 'material', data: m })}
          />
        ) : (
          <VarietiesTable
            varieties={filteredVarieties}
            onEdit={(v) => setEditTarget({ type: 'variety', data: v })}
          />
        )}
      </Content>

      {editTarget && editTarget.type === 'material' && (
        <EditMaterialModal data={editTarget.data} onSave={handleMaterialUpdate} onClose={() => setEditTarget(null)} />
      )}
      {editTarget && editTarget.type === 'variety' && (
        <EditVarietyModal data={editTarget.data} onSave={handleVarietyUpdate} onClose={() => setEditTarget(null)} />
      )}

      {showAddMaterial && <AddMaterialModal categories={categories} onSave={handleAddMaterial} onClose={() => setShowAddMaterial(false)} />}
      {showAddVariety && <AddVarietyModal onSave={handleAddVariety} onClose={() => setShowAddVariety(false)} />}
      {toast && <Toast $ok={toast.ok}>{toast.msg}</Toast>}
    </PageWrapper>
  )
}
