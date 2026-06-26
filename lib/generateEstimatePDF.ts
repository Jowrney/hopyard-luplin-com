// lib/pdf/generateEstimatePDF.ts
// jsPDF 기반 견적서 PDF 생성 — 한국어 폰트 포함

import type { DesignInputs, EstimateResult, LoadResult, QuantityResult } from '@/types'

export interface EstimatePDFOptions {
  farmerName?: string
  farmLocation?: string
  designName?: string
  poleCode?: string
  wireCode?: string
  inputs: DesignInputs
  quantities: QuantityResult
  loads: LoadResult
  estimate: EstimateResult
}

type RGB = [number, number, number]

const BRAND_GREEN: RGB = [45, 90, 39]
const LIGHT_GREEN: RGB = [240, 247, 239]
const DARK: RGB        = [26, 46, 24]
const GRAY: RGB        = [100, 116, 139]
const LIGHT_GRAY: RGB  = [241, 245, 249]
const WHITE: RGB       = [255, 255, 255]

const toKRW = (n: number) => `₩${n.toLocaleString('ko-KR')}`
const toNum = (n: number) => n.toLocaleString('ko-KR')

export async function generateEstimatePDF(opts: EstimatePDFOptions): Promise<void> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const PW = 210
  const PH = 297
  const ML = 20
  const MR = 20
  const CW = PW - ML - MR
  let y = 0

  // ── 헬퍼 함수 ──────────────────────────────────────

  const setFont = (size: number, style: 'normal' | 'bold' = 'normal', color: RGB = DARK) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(...color)
  }

  const fillRect = (x: number, y: number, w: number, h: number, color: RGB) => {
    doc.setFillColor(...color)
    doc.rect(x, y, w, h, 'F')
  }

  const line = (x1: number, y1: number, x2: number, y2: number, color: RGB = LIGHT_GRAY, width = 0.3) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(width)
    doc.line(x1, y1, x2, y2)
  }

  const text = (str: string, x: number, yPos: number, opts?: { align?: 'left' | 'center' | 'right' }) => {
    doc.text(str, x, yPos, opts)
  }

  const newPage = () => {
    doc.addPage()
    y = 20
    drawPageFooter()
  }

  const checkPageBreak = (needed: number) => {
    if (y + needed > PH - 25) newPage()
  }

  // ── 푸터 ────────────────────────────────────────────
  const drawPageFooter = () => {
    const pageNum = doc.getNumberOfPages()
    fillRect(0, PH - 15, PW, 15, BRAND_GREEN)
    setFont(8, 'normal', WHITE)
    text('농업회사법인 홉이든  |  hopeden.kr  |  HopEden Designer', ML, PH - 6)
    text(`${pageNum}`, PW - MR, PH - 6, { align: 'right' })
  }

  // ════════════════════════════════════════════════════
  // 1페이지: 표지 & 요약
  // ════════════════════════════════════════════════════

  fillRect(0, 0, PW, 55, BRAND_GREEN)

  setFont(22, 'bold', WHITE)
  text('HopEden Designer', ML, 22)
  setFont(10, 'normal', [180, 220, 170])
  text('홉 시설설계 & 비용산출 플랫폼  |  농업회사법인 홉이든', ML, 30)

  setFont(15, 'bold', WHITE)
  text('시 설 설 계 견 적 서', PW - MR, 20, { align: 'right' })
  setFont(9, 'normal', [180, 220, 170])
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  text(`발행일: ${today}`, PW - MR, 28, { align: 'right' })

  const validDate = new Date()
  validDate.setDate(validDate.getDate() + 30)
  const validStr = validDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  text(`견적 유효기간: ${validStr}까지`, PW - MR, 35, { align: 'right' })

  y = 65

  // ── 농가 정보 박스 ──────────────────────────────────
  fillRect(ML, y, CW, 38, LIGHT_GREEN)
  doc.setDrawColor(...BRAND_GREEN)
  doc.setLineWidth(0.5)
  doc.rect(ML, y, CW, 38, 'S')

  setFont(9, 'bold', BRAND_GREEN)
  text('농가 정보', ML + 5, y + 7)
  line(ML + 5, y + 9, ML + CW - 5, y + 9, BRAND_GREEN, 0.3)

  const info = [
    ['농가명', opts.farmerName || '(미입력)'],
    ['농장 위치', opts.farmLocation || '(미입력)'],
    ['설계안명', opts.designName || '새 설계안'],
    ['재배 면적', `${(opts.inputs.widthM * opts.inputs.heightM).toLocaleString('ko-KR')} ㎡ (${opts.inputs.widthM}m × ${opts.inputs.heightM}m)`],
  ]

  info.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? ML + 5 : ML + CW / 2
    const row = y + 16 + Math.floor(i / 2) * 9
    setFont(8, 'bold', GRAY)
    text(label, col, row)
    setFont(8, 'normal', DARK)
    text(value, col + 22, row)
  })

  y += 48

  // ── 최종 견적 합계 (강조 박스) ──────────────────────
  fillRect(ML, y, CW, 28, DARK)

  setFont(10, 'normal', [180, 220, 170])
  text('최종 견적 금액', ML + 8, y + 10)

  setFont(20, 'bold', WHITE)
  text(toKRW(opts.estimate.total), PW - MR - 8, y + 12, { align: 'right' })

  setFont(8, 'normal', [140, 180, 140])
  const vatNote = opts.estimate.vat > 0 ? `(부가세 ${toKRW(opts.estimate.vat)} 포함)` : '(부가세 별도)'
  text(vatNote, PW - MR - 8, y + 20, { align: 'right' })
  text(`자재비 ${toKRW(opts.estimate.materialCost)}  +  시공비 ${toKRW(opts.estimate.laborCost)}  +  종자비 ${toKRW(opts.estimate.seedCost)}`, ML + 8, y + 22)

  y += 38

  // ── 수량 요약 4칸 ───────────────────────────────────
  const summaryItems = [
    { label: '총 폴 수량',  value: `${toNum(opts.quantities.totalPoleCount)}개`, sub: `내부 ${opts.quantities.innerPoleCount} + 앵커 ${opts.quantities.outerPoleCount}` },
    { label: '와이어 길이', value: `${toNum(opts.quantities.totalWireM)}m`,       sub: `${opts.inputs.wireRows}단 × 여유율 5%` },
    { label: '재식 주수',   value: `${toNum(opts.quantities.plantCount)}주`,      sub: `종근 ${toNum(opts.quantities.rhizomeCount)}주 (예비 10%)` },
    { label: '앵커 수량',   value: `${toNum(opts.quantities.anchorCount)}개`,     sub: '외곽 폴 기준' },
  ]

  const boxW = (CW - 9) / 4
  summaryItems.forEach((item, i) => {
    const bx = ML + i * (boxW + 3)
    fillRect(bx, y, boxW, 24, LIGHT_GREEN)
    doc.setDrawColor(...BRAND_GREEN)
    doc.setLineWidth(0.3)
    doc.rect(bx, y, boxW, 24, 'S')

    setFont(7, 'bold', GRAY)
    text(item.label, bx + boxW / 2, y + 7, { align: 'center' })
    setFont(11, 'bold', DARK)
    text(item.value, bx + boxW / 2, y + 15, { align: 'center' })
    setFont(6.5, 'normal', GRAY)
    text(item.sub, bx + boxW / 2, y + 21, { align: 'center' })
  })

  y += 34

  // ── 구조 안전성 ─────────────────────────────────────
  const safetyColor: Record<string, RGB> = {
    GREEN:  [22, 163, 74],
    YELLOW: [217, 119, 6],
    RED:    [220, 38, 38],
  }
  const safetyLabel: Record<string, string> = {
    GREEN:  '✓ 구조 안전 — 설계 하중이 허용 범위 이내입니다',
    YELLOW: '⚠ 주의 — 와이어 보강을 권장합니다',
    RED:    '✕ 위험 — 와이어 즉시 보강이 필요합니다',
  }
  fillRect(ML, y, CW, 14, safetyColor[opts.loads.safetyStatus])
  setFont(9, 'bold', WHITE)
  text(safetyLabel[opts.loads.safetyStatus], ML + 6, y + 9)
  setFont(8, 'normal', WHITE)
  text(`설계 인장력 ${opts.loads.designTensionKN.toFixed(2)} kN  |  권장 와이어 Φ${opts.loads.recommendedWireDiameterMM}mm 이상`, PW - MR - 6, y + 9, { align: 'right' })

  y += 24

  // ── 설계 파라미터 테이블 ────────────────────────────
  setFont(10, 'bold', DARK)
  text('설계 파라미터', ML, y)
  y += 6
  line(ML, y, ML + CW, y, BRAND_GREEN, 0.5)
  y += 4

  const params = [
    ['재배 면적',   `${(opts.inputs.widthM * opts.inputs.heightM).toLocaleString('ko-KR')} ㎡`, '행간(Row Spacing)',   `${opts.inputs.rowSpacingM} m`],
    ['농장 가로',   `${opts.inputs.widthM} m`,                                                   '주간(Plant Spacing)', `${opts.inputs.plantSpacingM} m`],
    ['농장 세로',   `${opts.inputs.heightM} m`,                                                  '폴 간격',             `${opts.inputs.poleSpacingM} m`],
    ['폴 유효높이', `${opts.inputs.poleEffectiveHeightM} m`,                                     '와이어 단수',         `${opts.inputs.wireRows}단`],
    ['지역(풍하중)', getRegionLabel(opts.inputs.region),                                         '설계 풍속',           `${opts.loads.windSpeedMs.toFixed(1)} m/s`],
  ]

  params.forEach((row, i) => {
    const bg: RGB = i % 2 === 0 ? WHITE : LIGHT_GRAY
    fillRect(ML, y, CW, 8, bg)
    setFont(8, 'bold', GRAY)
    text(row[0], ML + 3, y + 5.5)
    setFont(8, 'normal', DARK)
    text(row[1], ML + 40, y + 5.5)
    setFont(8, 'bold', GRAY)
    text(row[2], ML + CW / 2 + 3, y + 5.5)
    setFont(8, 'normal', DARK)
    text(row[3], ML + CW / 2 + 43, y + 5.5)
    y += 8
  })

  drawPageFooter()

  // ════════════════════════════════════════════════════
  // 2페이지: 상세 견적 명세
  // ════════════════════════════════════════════════════
  newPage()

  setFont(14, 'bold', DARK)
  text('상세 견적 명세', ML, y)
  setFont(9, 'normal', GRAY)
  text('* 단가는 견적 확정 시점 기준이며, 자재 시세에 따라 변동될 수 있습니다.', ML, y + 7)
  y += 16

  // 테이블 헤더
  const cols = { cat: ML, name: ML + 22, qty: ML + 100, unit: ML + 118, up: ML + 133, total: ML + 158 }
  fillRect(ML, y, CW, 9, DARK)
  setFont(8, 'bold', WHITE)
  text('구분',   cols.cat   + 2,  y + 6)
  text('품명',   cols.name  + 2,  y + 6)
  text('수량',   cols.qty   + 8,  y + 6, { align: 'right' })
  text('단위',   cols.unit  + 2,  y + 6)
  text('단가',   cols.up    + 18, y + 6, { align: 'right' })
  text('금액',   cols.total + 28, y + 6, { align: 'right' })
  y += 10

  let currentCat = ''
  let rowIdx = 0

  for (const item of opts.estimate.breakdown) {
    checkPageBreak(10)

    const bg: RGB = rowIdx % 2 === 0 ? WHITE : LIGHT_GRAY
    fillRect(ML, y, CW, 8, bg)

    if (item.category !== currentCat) {
      const catColor: Record<string, RGB> = {
        '자재비': [37, 99, 235],
        '시공비': [234, 88, 12],
        '종자비': [22, 163, 74],
      }
      setFont(7.5, 'bold', catColor[item.category] ?? GRAY)
      text(item.category, cols.cat + 2, y + 5.5)
      currentCat = item.category
    }

    setFont(8, 'normal', DARK)
    const shortName = item.name.length > 20 ? item.name.slice(0, 19) + '…' : item.name
    text(shortName,           cols.name  + 2,  y + 5.5)
    text(toNum(item.quantity), cols.qty  + 8,  y + 5.5, { align: 'right' })
    text(item.unit,            cols.unit + 2,  y + 5.5)
    text(toKRW(item.unitPrice), cols.up  + 18, y + 5.5, { align: 'right' })

    setFont(8, 'bold', DARK)
    text(toKRW(item.totalPrice), cols.total + 28, y + 5.5, { align: 'right' })

    line(ML, y + 8, ML + CW, y + 8)
    y += 8
    rowIdx++
  }

  // ── 소계 / 합계 ─────────────────────────────────────
  checkPageBreak(45)
  y += 4

  const totals = [
    { label: '자재비 소계',    value: opts.estimate.materialCost },
    { label: '시공비 소계',    value: opts.estimate.laborCost },
    { label: '종자비 소계',    value: opts.estimate.seedCost },
    { label: '공급가액 합계',  value: opts.estimate.subtotal },
    ...(opts.estimate.vat > 0 ? [{ label: '부가가치세 (10%)', value: opts.estimate.vat }] : []),
  ]

  const TW = 90
  const TX = ML + CW - TW

  totals.forEach((t) => {
    const isSubtotal = t.label === '공급가액 합계'
    if (isSubtotal) { line(TX, y, ML + CW, y, BRAND_GREEN, 0.5); y += 2 }
    fillRect(TX, y, TW, 8, isSubtotal ? LIGHT_GREEN : WHITE)
    setFont(8, isSubtotal ? 'bold' : 'normal', isSubtotal ? DARK : GRAY)
    text(t.label, TX + 4, y + 5.5)
    setFont(8, isSubtotal ? 'bold' : 'normal', DARK)
    text(toKRW(t.value), ML + CW - 4, y + 5.5, { align: 'right' })
    y += 8
  })

  y += 2
  fillRect(TX, y, TW, 14, DARK)
  setFont(8, 'bold', [180, 220, 170])
  text('최종 합계', TX + 4, y + 6)
  setFont(13, 'bold', WHITE)
  text(toKRW(opts.estimate.total), ML + CW - 4, y + 10, { align: 'right' })
  y += 20

  // ── 하중 분석 ────────────────────────────────────────
  checkPageBreak(55)
  setFont(10, 'bold', DARK)
  text('구조 하중 분석', ML, y)
  y += 6
  line(ML, y, ML + CW, y, BRAND_GREEN, 0.5)
  y += 5

  const loadData = [
    ['홉 생체중 하중 (성숙기)', `${opts.loads.hopLoadKN.toFixed(3)} kN`,       '홉 단위중량 1.8 kg/m 기준'],
    ['풍압 하중',               `${opts.loads.windLoadKN.toFixed(3)} kN`,       `설계풍속 ${opts.loads.windSpeedMs.toFixed(1)} m/s (KBC 기준)`],
    ['총 설계 하중',            `${opts.loads.totalLoadKN.toFixed(3)} kN`,      '홉 하중 + 풍압 하중'],
    ['설계 인장력',             `${opts.loads.designTensionKN.toFixed(3)} kN`,  '총 하중 × 안전율 1.5'],
    ['권장 와이어',             `Φ${opts.loads.recommendedWireDiameterMM}mm 이상`, '허용 인장력 기준'],
  ]

  loadData.forEach((row, i) => {
    const bg: RGB = i % 2 === 0 ? WHITE : LIGHT_GRAY
    fillRect(ML, y, CW, 9, bg)
    setFont(8, 'bold', GRAY)
    text(row[0], ML + 3, y + 6)
    setFont(9, 'bold', i === 3 ? safetyColor[opts.loads.safetyStatus] : DARK)
    text(row[1], ML + 80, y + 6)
    setFont(7.5, 'normal', GRAY)
    text(row[2], ML + 120, y + 6)
    y += 9
  })

  y += 10

  // ── 특기사항 & 안내 ──────────────────────────────────
  checkPageBreak(50)
  setFont(10, 'bold', DARK)
  text('특기사항 및 안내', ML, y)
  y += 6
  line(ML, y, ML + CW, y, BRAND_GREEN, 0.5)
  y += 6

  const notes = [
    '본 견적서는 입력된 설계 파라미터를 기준으로 자동 산출된 것으로, 현장 조건에 따라 변동될 수 있습니다.',
    '자재 단가는 견적 발행일 기준이며, 철강·목재 시세 변동에 따라 달라질 수 있습니다.',
    '시공비는 표준 작업 기준이며, 접근 난이도·지형 조건에 따라 추가 비용이 발생할 수 있습니다.',
    '종근은 품종별 재고 상황에 따라 공급 시기가 조정될 수 있습니다.',
    '구조 안전성 판정은 KBC 간이 계산법 기준이며, 정밀 구조 검토가 필요한 경우 별도 문의해 주십시오.',
    '본 견적의 유효기간은 발행일로부터 30일입니다.',
  ]

  notes.forEach((note, i) => {
    checkPageBreak(8)
    setFont(8, 'normal', GRAY)
    text(`${i + 1}.  ${note}`, ML + 3, y)
    y += 7
  })

  y += 8

  // ── 공급 문의 ────────────────────────────────────────
  checkPageBreak(30)
  fillRect(ML, y, CW, 28, LIGHT_GREEN)
  doc.setDrawColor(...BRAND_GREEN)
  doc.setLineWidth(0.5)
  doc.rect(ML, y, CW, 28, 'S')

  setFont(10, 'bold', DARK)
  text('공급 문의', ML + 6, y + 9)
  setFont(8, 'normal', DARK)
  text('농업회사법인 홉이든', ML + 6, y + 17)
  text('hopeden.kr', ML + 6, y + 24)
  setFont(8, 'bold', BRAND_GREEN)
  text('HopEden Designer로 설계한 내용을 그대로 발주하실 수 있습니다.', ML + 50, y + 17)
  setFont(8, 'normal', GRAY)
  text('이 견적서를 첨부하여 문의해 주시면 빠르게 안내드립니다.', ML + 50, y + 24)

  drawPageFooter()

  const fileName = `HopEden_견적서_${opts.designName ?? '새설계안'}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}

function getRegionLabel(region: string): string {
  const map: Record<string, string> = {
    INLAND:  '내륙 일반',
    SEOUL:   '서울/경기',
    GANGWON: '강원 산간',
    COASTAL: '부산/경남 해안',
    JEJU:    '제주',
  }
  return map[region] ?? region
}
