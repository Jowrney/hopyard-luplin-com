// jsPDF-based estimate PDF generation with English/Korean localization.

import {
  DEFAULT_LOCALE,
  formatCurrency,
  formatDate,
  formatNumber,
  getEstimateCategoryLabel,
  getEstimateItemLabel,
  getRegionLabel,
  getUnitLabel,
  localeTag,
  localize,
  type Locale,
} from '@/lib/i18n'
import type { DesignInputs, EstimateResult, LoadResult, QuantityResult } from '@/types'

export interface EstimatePDFOptions {
  farmerName?: string
  farmLocation?: string
  designName?: string
  poleCode?: string
  wireCode?: string
  locale?: Locale
  inputs: DesignInputs
  quantities: QuantityResult
  loads: LoadResult
  estimate: EstimateResult
}

type RGB = [number, number, number]
type FontStyle = 'normal' | 'bold'

const BRAND_GREEN: RGB = [45, 90, 39]
const LIGHT_GREEN: RGB = [240, 247, 239]
const DARK: RGB = [26, 46, 24]
const GRAY: RGB = [100, 116, 139]
const LIGHT_GRAY: RGB = [241, 245, 249]
const WHITE: RGB = [255, 255, 255]
const KOREAN_SYSTEM_FONT = "'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Noto Sans KR',sans-serif"

const safeFilePart = (value: string) => value.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_')

export async function generateEstimatePDF(opts: EstimatePDFOptions): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const locale = opts.locale ?? DEFAULT_LOCALE
  const t = (en: string, ko: string) => localize(locale, en, ko)
  const toNum = (value: number) => formatNumber(value, locale)
  const toMoney = (value: number) => {
    const formatted = formatCurrency(value, 'KRW', locale)
    return locale === 'en' ? formatted.replace('₩', 'KRW ') : formatted
  }
  const decimal = (value: number, digits: number) => new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210
  const PH = 297
  const ML = 20
  const MR = 20
  const CW = PW - ML - MR
  let y = 0
  let activeFont = { size: 10, style: 'normal' as FontStyle, color: DARK }

  const setFont = (size: number, style: FontStyle = 'normal', color: RGB = DARK) => {
    activeFont = { size, style, color }
    doc.setFontSize(size)
    // Built-in Helvetica is safe for the English/Latin path. Korean text is
    // rasterized below with the user's Korean system-font stack.
    doc.setFont('helvetica', style)
    doc.setTextColor(...color)
  }

  const fillRect = (x: number, yPos: number, width: number, height: number, color: RGB) => {
    doc.setFillColor(...color)
    doc.rect(x, yPos, width, height, 'F')
  }

  const line = (x1: number, y1: number, x2: number, y2: number, color: RGB = LIGHT_GRAY, width = 0.3) => {
    doc.setDrawColor(...color)
    doc.setLineWidth(width)
    doc.line(x1, y1, x2, y2)
  }

  const text = (value: string, x: number, yPos: number, options?: { align?: 'left' | 'center' | 'right' }) => {
    if (locale !== 'ko' || typeof document === 'undefined') {
      doc.text(value, x, yPos, options)
      return
    }

    // jsPDF's built-in fonts do not contain Hangul. Drawing localized text to
    // a transparent canvas preserves the available Korean system font without
    // adding a network/font-file dependency, then jsPDF embeds that raster.
    const renderScale = 3
    const pxPerMm = (96 / 25.4) * renderScale
    const fontPx = activeFont.size * (96 / 72) * renderScale
    const padding = Math.ceil(fontPx * 0.25)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) {
      doc.text(value, x, yPos, options)
      return
    }

    context.font = `${activeFont.style === 'bold' ? 700 : 400} ${fontPx}px ${KOREAN_SYSTEM_FONT}`
    const measuredWidth = Math.max(1, context.measureText(value).width)
    canvas.width = Math.ceil(measuredWidth + padding * 2)
    canvas.height = Math.ceil(fontPx * 1.45 + padding)

    const drawContext = canvas.getContext('2d')!
    drawContext.font = `${activeFont.style === 'bold' ? 700 : 400} ${fontPx}px ${KOREAN_SYSTEM_FONT}`
    drawContext.fillStyle = `rgb(${activeFont.color.join(',')})`
    drawContext.textBaseline = 'alphabetic'
    const baseline = padding + fontPx
    drawContext.fillText(value, padding, baseline)

    const widthMm = canvas.width / pxPerMm
    const heightMm = canvas.height / pxPerMm
    const contentWidthMm = measuredWidth / pxPerMm
    let left = x - padding / pxPerMm
    if (options?.align === 'right') left = x - contentWidthMm - padding / pxPerMm
    if (options?.align === 'center') left = x - contentWidthMm / 2 - padding / pxPerMm
    const top = yPos - baseline / pxPerMm
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', left, top, widthMm, heightMm, undefined, 'FAST')
  }

  const drawPageFooter = () => {
    const pageNum = doc.getNumberOfPages()
    fillRect(0, PH - 15, PW, 15, BRAND_GREEN)
    setFont(8, 'normal', WHITE)
    text(t('HopEden Agricultural Corporation | hopeden.kr | HopEden Designer', '농업회사법인 홉이든 | hopeden.kr | HopEden Designer'), ML, PH - 6)
    text(toNum(pageNum), PW - MR, PH - 6, { align: 'right' })
  }

  const newPage = () => {
    doc.addPage()
    y = 20
    drawPageFooter()
  }

  const checkPageBreak = (needed: number) => {
    if (y + needed > PH - 25) newPage()
  }

  fillRect(0, 0, PW, 55, BRAND_GREEN)
  setFont(22, 'bold', WHITE)
  text('HopEden Designer', ML, 22)
  setFont(10, 'normal', [180, 220, 170])
  text(t('Hop trellis design & cost estimation | HopEden Agricultural Corporation', '홉 시설설계 & 비용산출 플랫폼 | 농업회사법인 홉이든'), ML, 30)

  setFont(15, 'bold', WHITE)
  text(t('FACILITY DESIGN ESTIMATE', '시 설 설 계 견 적 서'), PW - MR, 20, { align: 'right' })
  setFont(9, 'normal', [180, 220, 170])
  const issueDate = new Date()
  const today = formatDate(issueDate, locale)
  text(`${t('Issue date', '발행일')}: ${today}`, PW - MR, 28, { align: 'right' })

  const validDate = new Date(issueDate)
  validDate.setDate(validDate.getDate() + 30)
  const validStr = formatDate(validDate, locale)
  text(locale === 'ko' ? `견적 유효기간: ${validStr}까지` : `Valid through: ${validStr}`, PW - MR, 35, { align: 'right' })
  y = 65

  fillRect(ML, y, CW, 38, LIGHT_GREEN)
  doc.setDrawColor(...BRAND_GREEN)
  doc.setLineWidth(0.5)
  doc.rect(ML, y, CW, 38, 'S')
  setFont(9, 'bold', BRAND_GREEN)
  text(t('Farm Information', '농가 정보'), ML + 5, y + 7)
  line(ML + 5, y + 9, ML + CW - 5, y + 9, BRAND_GREEN, 0.3)

  const defaultDesignName = t('New Design', '새 설계안')
  const notProvided = t('(not provided)', '(미입력)')
  const growingArea = locale === 'ko'
    ? `${toNum(opts.inputs.widthM * opts.inputs.heightM)} ㎡ (${toNum(opts.inputs.widthM)}m × ${toNum(opts.inputs.heightM)}m)`
    : `${toNum(opts.inputs.widthM * opts.inputs.heightM)} sq. m (${toNum(opts.inputs.widthM)} m x ${toNum(opts.inputs.heightM)} m)`
  const info = [
    [t('Farm name', '농가명'), opts.farmerName || notProvided],
    [t('Farm location', '농장 위치'), opts.farmLocation || notProvided],
    [t('Design name', '설계안명'), opts.designName || defaultDesignName],
    [t('Growing area', '재배 면적'), growingArea],
  ]

  info.forEach(([label, value], index) => {
    const col = index % 2 === 0 ? ML + 5 : ML + CW / 2
    const row = y + 16 + Math.floor(index / 2) * 9
    setFont(8, 'bold', GRAY)
    text(label, col, row)
    setFont(8, 'normal', DARK)
    text(value, col + (locale === 'ko' ? 22 : 27), row)
  })
  y += 48

  fillRect(ML, y, CW, 28, DARK)
  setFont(10, 'normal', [180, 220, 170])
  text(t('Final Estimated Total', '최종 견적 금액'), ML + 8, y + 10)
  setFont(20, 'bold', WHITE)
  text(toMoney(opts.estimate.total), PW - MR - 8, y + 12, { align: 'right' })
  setFont(8, 'normal', [140, 180, 140])
  const vatNote = opts.estimate.vat > 0
    ? t(`(includes VAT of ${toMoney(opts.estimate.vat)})`, `(부가세 ${toMoney(opts.estimate.vat)} 포함)`)
    : t('(VAT excluded)', '(부가세 별도)')
  text(vatNote, PW - MR - 8, y + 20, { align: 'right' })
  const discountSummary = opts.estimate.discount > 0
    ? ` - ${t('Discount', '할인')} ${toMoney(opts.estimate.discount)}`
    : ''
  text(`${t('Materials', '자재비')} ${toMoney(opts.estimate.materialCost)} + ${t('Installation', '시공비')} ${toMoney(opts.estimate.laborCost)} + ${t('Planting stock', '종자비')} ${toMoney(opts.estimate.seedCost)}${discountSummary}`, ML + 8, y + 22)
  y += 38

  const summaryItems = [
    {
      label: t('Total poles', '총 폴 수량'),
      value: t(`${toNum(opts.quantities.totalPoleCount)} ea`, `${toNum(opts.quantities.totalPoleCount)}개`),
      sub: t(`Inner ${toNum(opts.quantities.innerPoleCount)} + anchor ${toNum(opts.quantities.outerPoleCount)}`, `내부 ${toNum(opts.quantities.innerPoleCount)} + 앵커 ${toNum(opts.quantities.outerPoleCount)}`),
    },
    {
      label: t('Wire length', '와이어 길이'),
      value: `${toNum(opts.quantities.totalWireM)} m`,
      sub: t(`${toNum(opts.inputs.wireRows)} levels + 5%`, `${toNum(opts.inputs.wireRows)}단 × 여유율 5%`),
    },
    {
      label: t('Plant count', '재식 주수'),
      value: t(`${toNum(opts.quantities.plantCount)} plants`, `${toNum(opts.quantities.plantCount)}주`),
      sub: t(`${toNum(opts.quantities.rhizomeCount)} rhizomes (+10%)`, `종근 ${toNum(opts.quantities.rhizomeCount)}주 (예비 10%)`),
    },
    {
      label: t('Anchors', '앵커 수량'),
      value: t(`${toNum(opts.quantities.anchorCount)} ea`, `${toNum(opts.quantities.anchorCount)}개`),
      sub: t('Based on perimeter poles', '외곽 폴 기준'),
    },
  ]

  const boxW = (CW - 9) / 4
  summaryItems.forEach((item, index) => {
    const bx = ML + index * (boxW + 3)
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

  const safetyColor: Record<string, RGB> = {
    GREEN: [22, 163, 74],
    YELLOW: [217, 119, 6],
    RED: [220, 38, 38],
  }
  const safetyLabel: Record<string, string> = {
    GREEN: t('SAFE - design load is within limits', '구조 안전 - 설계 하중이 허용 범위 이내입니다'),
    YELLOW: t('CAUTION - wire reinforcement recommended', '주의 - 와이어 보강을 권장합니다'),
    RED: t('DANGER - reinforce wire immediately', '위험 - 와이어 즉시 보강이 필요합니다'),
  }
  fillRect(ML, y, CW, 14, safetyColor[opts.loads.safetyStatus])
  setFont(9, 'bold', WHITE)
  text(safetyLabel[opts.loads.safetyStatus], ML + 6, y + 9)
  setFont(8, 'normal', WHITE)
  const recommendedWire = locale === 'ko'
    ? `권장 와이어 Φ${toNum(opts.loads.recommendedWireDiameterMM)}mm 이상`
    : `Recommended wire: ${toNum(opts.loads.recommendedWireDiameterMM)} mm dia. or greater`
  text(`${t('Design tension', '설계 인장력')} ${decimal(opts.loads.designTensionKN, 2)} kN | ${recommendedWire}`, PW - MR - 6, y + 9, { align: 'right' })
  y += 24

  setFont(10, 'bold', DARK)
  text(t('Design Parameters', '설계 파라미터'), ML, y)
  y += 6
  line(ML, y, ML + CW, y, BRAND_GREEN, 0.5)
  y += 4

  const params = [
    [t('Growing area', '재배 면적'), locale === 'ko' ? `${toNum(opts.inputs.widthM * opts.inputs.heightM)} ㎡` : `${toNum(opts.inputs.widthM * opts.inputs.heightM)} sq. m`, t('Row spacing', '행간'), `${toNum(opts.inputs.rowSpacingM)} m`],
    [t('Farm width', '농장 가로'), `${toNum(opts.inputs.widthM)} m`, t('Plant spacing', '주간'), `${toNum(opts.inputs.plantSpacingM)} m`],
    [t('Farm length', '농장 세로'), `${toNum(opts.inputs.heightM)} m`, t('Pole spacing', '폴 간격'), `${toNum(opts.inputs.poleSpacingM)} m`],
    [t('Effective pole height', '폴 유효높이'), `${toNum(opts.inputs.poleEffectiveHeightM)} m`, t('Wire levels', '와이어 단수'), t(`${toNum(opts.inputs.wireRows)} levels`, `${toNum(opts.inputs.wireRows)}단`)],
    [t('Region (wind load)', '지역(풍하중)'), getRegionLabel(opts.inputs.region, locale), t('Design wind speed', '설계 풍속'), `${decimal(opts.loads.windSpeedMs, 1)} m/s`],
  ]

  params.forEach((row, index) => {
    fillRect(ML, y, CW, 8, index % 2 === 0 ? WHITE : LIGHT_GRAY)
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

  newPage()
  setFont(14, 'bold', DARK)
  text(t('Detailed Cost Breakdown', '상세 견적 명세'), ML, y)
  setFont(9, 'normal', GRAY)
  text(t('* Unit prices are current when the estimate is finalized and may vary with material markets.', '* 단가는 견적 확정 시점 기준이며, 자재 시세에 따라 변동될 수 있습니다.'), ML, y + 7)
  y += 16

  const cols = { cat: ML, name: ML + 25, qty: ML + 103, unit: ML + 120, up: ML + 136, total: ML + 159 }
  fillRect(ML, y, CW, 9, DARK)
  setFont(8, 'bold', WHITE)
  text(t('Category', '구분'), cols.cat + 2, y + 6)
  text(t('Item', '품명'), cols.name + 2, y + 6)
  text(t('Qty', '수량'), cols.qty + 8, y + 6, { align: 'right' })
  text(t('Unit', '단위'), cols.unit + 2, y + 6)
  text(t('Unit price', '단가'), cols.up + 18, y + 6, { align: 'right' })
  text(t('Amount', '금액'), cols.total + 28, y + 6, { align: 'right' })
  y += 10

  let currentCategory = ''
  let rowIndex = 0
  for (const item of opts.estimate.breakdown) {
    checkPageBreak(10)
    fillRect(ML, y, CW, 8, rowIndex % 2 === 0 ? WHITE : LIGHT_GRAY)

    if (item.category !== currentCategory) {
      const categoryColor: Record<string, RGB> = {
        '자재비': [37, 99, 235],
        '시공비': [234, 88, 12],
        '종자비': [22, 163, 74],
      }
      setFont(7.5, 'bold', categoryColor[item.category] ?? GRAY)
      text(getEstimateCategoryLabel(item.category, locale), cols.cat + 2, y + 5.5)
      currentCategory = item.category
    }

    setFont(8, 'normal', DARK)
    const localizedName = getEstimateItemLabel(item.code, item.name, locale)
    const maxNameLength = locale === 'ko' ? 20 : 34
    const shortName = localizedName.length > maxNameLength ? `${localizedName.slice(0, maxNameLength - 1)}...` : localizedName
    text(shortName, cols.name + 2, y + 5.5)
    text(toNum(item.quantity), cols.qty + 8, y + 5.5, { align: 'right' })
    text(getUnitLabel(item.unit, locale), cols.unit + 2, y + 5.5)
    text(toMoney(item.unitPrice), cols.up + 18, y + 5.5, { align: 'right' })
    setFont(8, 'bold', DARK)
    text(toMoney(item.totalPrice), cols.total + 28, y + 5.5, { align: 'right' })
    line(ML, y + 8, ML + CW, y + 8)
    y += 8
    rowIndex++
  }

  checkPageBreak(45)
  y += 4
  const totals = [
    { label: t('Materials subtotal', '자재비 소계'), value: opts.estimate.materialCost },
    { label: t('Installation subtotal', '시공비 소계'), value: opts.estimate.laborCost },
    { label: t('Planting stock subtotal', '종자비 소계'), value: opts.estimate.seedCost },
    { label: t('Subtotal', '공급가액 합계'), value: opts.estimate.subtotal, isSubtotal: true },
    ...(opts.estimate.discount > 0 ? [{ label: t('Discount', '할인'), value: -opts.estimate.discount }] : []),
    ...(opts.estimate.vat > 0 ? [{ label: t('VAT (10%)', '부가가치세 (10%)'), value: opts.estimate.vat }] : []),
  ]
  const TW = 90
  const TX = ML + CW - TW

  totals.forEach((total) => {
    const isSubtotal = total.isSubtotal === true
    if (isSubtotal) {
      line(TX, y, ML + CW, y, BRAND_GREEN, 0.5)
      y += 2
    }
    fillRect(TX, y, TW, 8, isSubtotal ? LIGHT_GREEN : WHITE)
    setFont(8, isSubtotal ? 'bold' : 'normal', isSubtotal ? DARK : GRAY)
    text(total.label, TX + 4, y + 5.5)
    setFont(8, isSubtotal ? 'bold' : 'normal', DARK)
    text(toMoney(total.value), ML + CW - 4, y + 5.5, { align: 'right' })
    y += 8
  })

  y += 2
  fillRect(TX, y, TW, 14, DARK)
  setFont(8, 'bold', [180, 220, 170])
  text(t('Final Total', '최종 합계'), TX + 4, y + 6)
  setFont(13, 'bold', WHITE)
  text(toMoney(opts.estimate.total), ML + CW - 4, y + 10, { align: 'right' })
  y += 20

  checkPageBreak(55)
  setFont(10, 'bold', DARK)
  text(t('Structural Load Analysis (KBC)', '구조 하중 분석 (KBC 기준)'), ML, y)
  y += 6
  line(ML, y, ML + CW, y, BRAND_GREEN, 0.5)
  y += 5

  const loadData = [
    [t('Mature hop load', '홉 생체중 하중 (성숙기)'), `${decimal(opts.loads.hopLoadKN, 3)} kN`, t('Based on 1.8 kg/m unit weight', '홉 단위중량 1.8 kg/m 기준')],
    [t('Wind load', '풍압 하중'), `${decimal(opts.loads.windLoadKN, 3)} kN`, t(`Design wind speed ${decimal(opts.loads.windSpeedMs, 1)} m/s (KBC)`, `설계풍속 ${decimal(opts.loads.windSpeedMs, 1)} m/s (KBC 기준)`)],
    [t('Total design load', '총 설계 하중'), `${decimal(opts.loads.totalLoadKN, 3)} kN`, t('Hop load + wind load', '홉 하중 + 풍압 하중')],
    [t('Design tension', '설계 인장력'), `${decimal(opts.loads.designTensionKN, 3)} kN`, t('Total load x safety factor 1.5', '총 하중 × 안전율 1.5')],
    [t('Recommended wire', '권장 와이어'), locale === 'ko' ? `Φ${toNum(opts.loads.recommendedWireDiameterMM)}mm 이상` : `${toNum(opts.loads.recommendedWireDiameterMM)} mm dia. or greater`, t('Based on allowable tension', '허용 인장력 기준')],
  ]

  loadData.forEach((row, index) => {
    fillRect(ML, y, CW, 9, index % 2 === 0 ? WHITE : LIGHT_GRAY)
    setFont(8, 'bold', GRAY)
    text(row[0], ML + 3, y + 6)
    setFont(9, 'bold', index === 3 ? safetyColor[opts.loads.safetyStatus] : DARK)
    text(row[1], ML + 80, y + 6)
    setFont(7.5, 'normal', GRAY)
    text(row[2], ML + 120, y + 6)
    y += 9
  })
  y += 10

  checkPageBreak(50)
  setFont(10, 'bold', DARK)
  text(t('Notes & Information', '특기사항 및 안내'), ML, y)
  y += 6
  line(ML, y, ML + CW, y, BRAND_GREEN, 0.5)
  y += 6

  const notes = [
    t('This estimate is calculated automatically from the supplied design parameters and may vary with site conditions.', '본 견적서는 입력된 설계 파라미터를 기준으로 자동 산출된 것으로, 현장 조건에 따라 변동될 수 있습니다.'),
    t('Material prices are current as of the issue date and may change with steel and timber markets.', '자재 단가는 견적 발행일 기준이며, 철강·목재 시세 변동에 따라 달라질 수 있습니다.'),
    t('Installation costs assume standard working conditions; difficult access or terrain may incur additional charges.', '시공비는 표준 작업 기준이며, 접근 난이도·지형 조건에 따라 추가 비용이 발생할 수 있습니다.'),
    t('Rhizome delivery timing may change depending on availability by variety.', '종근은 품종별 재고 상황에 따라 공급 시기가 조정될 수 있습니다.'),
    t('The safety result uses a simplified KBC calculation. Contact us if a detailed structural review is required.', '구조 안전성 판정은 KBC 간이 계산법 기준이며, 정밀 구조 검토가 필요한 경우 별도 문의해 주십시오.'),
    t('This estimate is valid for 30 days from the issue date.', '본 견적의 유효기간은 발행일로부터 30일입니다.'),
  ]

  notes.forEach((note, index) => {
    checkPageBreak(8)
    setFont(8, 'normal', GRAY)
    text(`${index + 1}. ${note}`, ML + 3, y)
    y += 7
  })
  y += 8

  checkPageBreak(30)
  fillRect(ML, y, CW, 28, LIGHT_GREEN)
  doc.setDrawColor(...BRAND_GREEN)
  doc.setLineWidth(0.5)
  doc.rect(ML, y, CW, 28, 'S')
  setFont(10, 'bold', DARK)
  text(t('Supply Inquiry', '공급 문의'), ML + 6, y + 9)
  setFont(8, 'normal', DARK)
  text(t('HopEden Agricultural Corporation', '농업회사법인 홉이든'), ML + 6, y + 17)
  text('hopeden.kr', ML + 6, y + 24)
  setFont(8, 'bold', BRAND_GREEN)
  text(t('Order directly from your HopEden Designer plan.', 'HopEden Designer로 설계한 내용을 그대로 발주하실 수 있습니다.'), ML + 50, y + 17)
  setFont(8, 'normal', GRAY)
  text(t('Attach this estimate to your inquiry for a faster response.', '이 견적서를 첨부하여 문의해 주시면 빠르게 안내드립니다.'), ML + 50, y + 24)
  drawPageFooter()

  const documentLabel = t('Estimate', '견적서')
  const designName = safeFilePart(opts.designName?.trim() || defaultDesignName)
  const fileName = `HopEden_${documentLabel}_${designName}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}
