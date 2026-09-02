'use client'

import { useRef, useState } from 'react'
import { useLocale } from '@/components/i18n/LocaleProvider'
import {
  getEstimateCategoryLabel,
  getEstimateItemLabel,
  getRegionLabel,
  getUnitLabel,
  localeTag,
} from '@/lib/i18n'
import { useDesignStore } from '@/stores/designStore'

const safeFilePart = (value: string) => value.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_')

export function PDFExportModal({ onClose }: { onClose: () => void }) {
  const { inputs, quantities, loads, estimate } = useDesignStore()
  const { locale, text, number, currency, date } = useLocale()
  const [farmerName, setFarmerName] = useState('')
  const [farmLocation, setFarmLocation] = useState('')
  const [designName, setDesignName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const canGenerate = !!quantities && !!loads && !!estimate
  const resolvedDesignName = designName.trim() || text('New Design', '새 설계안')
  const issueDate = new Date()
  const validDate = new Date(issueDate)
  validDate.setDate(validDate.getDate() + 30)
  const today = date(issueDate)
  const validStr = date(validDate)
  const money = (value: number) => {
    const formatted = currency(value, 'KRW')
    return locale === 'en' ? formatted.replace('₩', 'KRW ') : formatted
  }
  const decimal = (value: number, digits: number) => new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

  const safetyConfig = {
    GREEN: {
      label: text('Structurally safe', '구조 안전'),
      bg: '#16A34A',
    },
    YELLOW: {
      label: text('Caution - wire reinforcement recommended', '주의 - 와이어 보강 권장'),
      bg: '#D97706',
    },
    RED: {
      label: text('Danger - reinforce wire immediately', '위험 - 와이어 즉시 보강 필요'),
      bg: '#DC2626',
    },
  }
  const sc = loads ? safetyConfig[loads.safetyStatus] : safetyConfig.GREEN

  const handleGenerate = async () => {
    if (!previewRef.current || !canGenerate) return
    setIsGenerating(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const el = previewRef.current
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
        scrollY: 0,
        onclone: (doc) => {
          const clonedEl = doc.querySelector('[data-pdf-root]') as HTMLElement
          if (clonedEl) {
            clonedEl.style.maxHeight = 'none'
            clonedEl.style.overflow = 'visible'
          }
        },
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = 210
      const pdfH = 297
      let srcY = 0
      let pageIdx = 0

      while (srcY < canvas.height) {
        const pageH = Math.min(pdfH, (canvas.height - srcY) * pdfW / canvas.width)
        const srcH = Math.min(canvas.height - srcY, (pdfH * canvas.width) / pdfW)
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = srcH
        const ctx = pageCanvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

        if (pageIdx > 0) pdf.addPage()
        pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pdfW, pageH)
        srcY += srcH
        pageIdx++
      }

      const documentLabel = text('Estimate', '견적서')
      pdf.save(`HopEden_${documentLabel}_${safeFilePart(resolvedDesignName)}_${new Date().toISOString().slice(0, 10)}.pdf`)
      setDone(true)
      setTimeout(onClose, 1500)
    } catch (error) {
      console.error(text('PDF generation error:', 'PDF 생성 오류:'), error)
    } finally {
      setIsGenerating(false)
    }
  }

  const fields = [
    { label: text('Farm name (optional)', '농가명 (선택)'), placeholder: text('e.g. Green Valley Farm', '예: 홍길동 농장'), value: farmerName, set: setFarmerName },
    { label: text('Farm location (optional)', '농장 위치 (선택)'), placeholder: text('e.g. Andong, Gyeongbuk', '예: 경북 안동시'), value: farmLocation, set: setFarmLocation },
    { label: text('Design name', '설계안 이름'), placeholder: text('e.g. Plan A - 3 m steel poles', '예: A안 - 강관 3m'), value: designName, set: setDesignName },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
         onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl flex overflow-hidden"
           style={{ width: '92vw', maxWidth: 1120, maxHeight: '92vh' }}>
        <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="bg-[#1A2E18] px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold">{text('Export Estimate PDF', '견적서 PDF 출력')}</h2>
                <p className="text-[#8BA888] text-xs mt-0.5">{text('Enter farm details, then download', '농가 정보 입력 후 다운로드')}</p>
              </div>
              <button onClick={onClose} aria-label={text('Close', '닫기')} className="text-[#8BA888] hover:text-white text-xl w-7 h-7 flex items-center justify-center">x</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {fields.map((field) => (
              <div key={field.label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input value={field.value} onChange={(event) => field.set(event.target.value)} placeholder={field.placeholder}
                       className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D5A27]" />
              </div>
            ))}

            {estimate && (
              <div className="bg-[#F0F7EF] rounded-xl p-3 space-y-1.5 mt-2">
                <p className="text-xs font-bold text-[#2D5A27]">{text('Estimate Summary', '견적 요약')}</p>
                {[
                  [text('Materials', '자재비'), estimate.materialCost],
                  [text('Installation', '시공비'), estimate.laborCost],
                  [text('Rhizomes', '종자비'), estimate.seedCost],
                  ...(estimate.discount > 0 ? [[text('Discount', '할인'), -estimate.discount]] : []),
                  ...(estimate.vat > 0 ? [[text('VAT', '부가세'), estimate.vat]] : []),
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-semibold">{money(Number(value))}</span>
                  </div>
                ))}
                <div className="border-t border-[#2D5A27]/20 pt-1.5 flex justify-between">
                  <span className="text-sm font-bold text-[#1A2E18]">{text('Total', '합계')}</span>
                  <span className="text-sm font-bold text-[#2D5A27]">{money(estimate.total)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
            {done ? (
              <div className="text-center py-3">
                <div className="text-2xl mb-1">✅</div>
                <p className="text-sm font-semibold text-[#2D5A27]">{text('Saved!', '저장 완료!')}</p>
              </div>
            ) : (
              <button onClick={handleGenerate} disabled={!canGenerate || isGenerating}
                      className="w-full py-3 bg-[#2D5A27] text-white rounded-xl font-bold text-sm hover:bg-[#234820] disabled:opacity-50 flex items-center justify-center gap-2">
                {isGenerating
                  ? <><span className="animate-spin">⌛</span>{text('Generating...', '생성 중...')}</>
                  : text('📥 Download PDF', '📥 PDF 다운로드')}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <p className="text-xs text-gray-400 text-center mb-4">{text('Preview (matches the downloaded PDF)', '미리보기 (실제 PDF와 동일)')}</p>

          <div ref={previewRef} data-pdf-root="true"
               lang={locale}
               style={{
                 width: 794,
                 margin: '0 auto',
                 background: '#fff',
                 fontFamily: locale === 'ko'
                   ? "'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Noto Sans KR',sans-serif"
                   : "Arial, Helvetica, 'Liberation Sans', sans-serif",
               }}>
            <div style={{ background: '#1A2E18', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>HopEden Designer</div>
                <div style={{ color: '#8BA888', fontSize: 11 }}>{text('Hop trellis design & cost estimation platform | HopEden Agricultural Corporation', '홉 시설설계 & 비용산출 플랫폼 | 농업회사법인 홉이든')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 4 }}>{text('FACILITY DESIGN ESTIMATE', '시설설계 견적서')}</div>
                <div style={{ color: '#8BA888', fontSize: 10 }}>{text('Issue date', '발행일')}: {today}</div>
                <div style={{ color: '#8BA888', fontSize: 10 }}>{text('Valid through', '유효기간')}: {validStr}{locale === 'ko' ? '까지' : ''}</div>
              </div>
            </div>

            <div style={{ padding: '24px 32px' }}>
              <div style={{ background: '#F0F7EF', border: '1px solid #2D5A27', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ color: '#2D5A27', fontWeight: 'bold', fontSize: 11, marginBottom: 8, borderBottom: '1px solid #a3c9a0', paddingBottom: 6 }}>{text('Farm Information', '농가 정보')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 24px' }}>
                  {[
                    [text('Farm name', '농가명'), farmerName || text('(not provided)', '(미입력)')],
                    [text('Design name', '설계안명'), resolvedDesignName],
                    [text('Farm location', '농장 위치'), farmLocation || text('(not provided)', '(미입력)')],
                    [text('Growing area', '재배 면적'), locale === 'ko'
                      ? `${number(inputs.widthM * inputs.heightM)} ㎡ (${number(inputs.widthM)}×${number(inputs.heightM)}m)`
                      : `${number(inputs.widthM * inputs.heightM)} sq. m (${number(inputs.widthM)} x ${number(inputs.heightM)} m)`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                      <span style={{ color: '#64748B', width: locale === 'ko' ? 58 : 76, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 'bold' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {estimate && (
                <div style={{ background: '#1A2E18', borderRadius: 8, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#8BA888', fontSize: 11, marginBottom: 3 }}>{text('Final Estimated Total', '최종 견적 금액')}</div>
                    <div style={{ color: '#8BA888', fontSize: 9 }}>
                      {text('Materials', '자재비')} {money(estimate.materialCost)} + {text('Installation', '시공비')} {money(estimate.laborCost)} + {text('Rhizomes', '종자비')} {money(estimate.seedCost)}{estimate.discount > 0 ? ` - ${text('Discount', '할인')} ${money(estimate.discount)}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{money(estimate.total)}</div>
                    <div style={{ color: '#8BA888', fontSize: 9 }}>
                      {estimate.vat > 0
                        ? text(`Includes VAT of ${money(estimate.vat)}`, `부가세 ${money(estimate.vat)} 포함`)
                        : text('VAT excluded', '부가세 별도')}
                    </div>
                  </div>
                </div>
              )}

              {quantities && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: text('Total poles', '총 폴 수량'), value: text(`${number(quantities.totalPoleCount)} pcs`, `${number(quantities.totalPoleCount)}개`), sub: text(`Inner ${number(quantities.innerPoleCount)} + anchor ${number(quantities.outerPoleCount)}`, `내부 ${number(quantities.innerPoleCount)} + 앵커 ${number(quantities.outerPoleCount)}`) },
                    { label: text('Wire length', '와이어 길이'), value: `${number(quantities.totalWireM)} m`, sub: text(`${number(inputs.wireRows)} levels, 5% allowance`, `${number(inputs.wireRows)}단, 여유 5%`) },
                    { label: text('Plant count', '재식 주수'), value: text(`${number(quantities.plantCount)} plants`, `${number(quantities.plantCount)}주`), sub: text(`${number(quantities.rhizomeCount)} rhizomes`, `종근 ${number(quantities.rhizomeCount)}주`) },
                    { label: text('Anchors', '앵커 수량'), value: text(`${number(quantities.anchorCount)} pcs`, `${number(quantities.anchorCount)}개`), sub: text('Based on perimeter poles', '외곽 기준') },
                  ].map((card) => (
                    <div key={card.label} style={{ background: '#F0F7EF', border: '1px solid #2D5A27', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: 9, marginBottom: 3 }}>{card.label}</div>
                      <div style={{ color: '#1A2E18', fontSize: 15, fontWeight: 'bold', marginBottom: 2 }}>{card.value}</div>
                      <div style={{ color: '#94A3B8', fontSize: 8 }}>{card.sub}</div>
                    </div>
                  ))}
                </div>
              )}

              {loads && (
                <div style={{ background: sc.bg, borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>{sc.label}</span>
                  <span style={{ color: '#fff', fontSize: 10, opacity: 0.9 }}>
                    {text('Design tension', '설계 인장력')} {decimal(loads.designTensionKN, 2)} kN | {text('Recommended', '권장')} {locale === 'ko' ? `Φ${number(loads.recommendedWireDiameterMM)}mm 이상` : `${number(loads.recommendedWireDiameterMM)} mm dia. or greater`}
                  </span>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #2D5A27' }}>{text('Design Parameters', '설계 파라미터')}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <tbody>
                  {[
                    [text('Growing area', '재배 면적'), locale === 'ko' ? `${number(inputs.widthM * inputs.heightM)} ㎡` : `${number(inputs.widthM * inputs.heightM)} sq. m`, text('Row spacing', '행간'), `${number(inputs.rowSpacingM)} m`],
                    [text('Farm width', '농장 가로'), `${number(inputs.widthM)} m`, text('Plant spacing', '주간'), `${number(inputs.plantSpacingM)} m`],
                    [text('Farm length', '농장 세로'), `${number(inputs.heightM)} m`, text('Pole spacing', '폴 간격'), `${number(inputs.poleSpacingM)} m`],
                    [text('Effective pole height', '폴 유효높이'), `${number(inputs.poleEffectiveHeightM)} m`, text('Wire levels', '와이어 단수'), text(`${number(inputs.wireRows)} levels`, `${number(inputs.wireRows)}단`)],
                    [text('Region (wind load)', '지역(풍하중)'), getRegionLabel(inputs.region, locale), text('Design wind speed', '설계 풍속'), loads ? `${decimal(loads.windSpeedMs, 1)} m/s` : '-'],
                  ].map((row, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                      <td style={{ padding: '6px 8px', color: '#64748B', width: '20%' }}>{row[0]}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 'bold', width: '30%' }}>{row[1]}</td>
                      <td style={{ padding: '6px 8px', color: '#64748B', width: '20%' }}>{row[2]}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 'bold', width: '30%' }}>{row[3]}</td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {estimate && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #2D5A27' }}>{text('Detailed Cost Breakdown', '상세 견적 명세')}</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                    <tr style={{ background: '#1A2E18', color: '#fff' }}>
                      {[text('Category', '구분'), text('Item', '품명'), text('Quantity', '수량'), text('Unit', '단위'), text('Unit price', '단가'), text('Amount', '금액')].map((heading, index) => (
                        <th key={heading} style={{ padding: '7px 8px', textAlign: index >= 2 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{heading}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody>
                    {(() => {
                      const categoryColors: Record<string, string> = { '자재비': '#2563EB', '시공비': '#EA580C', '종자비': '#16A34A' }
                      let previousCategory = ''
                      return estimate.breakdown.map((item, index) => {
                        const showCategory = item.category !== previousCategory
                        if (showCategory) previousCategory = item.category
                        return (
                          <tr key={`${item.code}-${index}`} style={{ background: index % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                            <td style={{ padding: '5px 8px', color: categoryColors[item.category] ?? '#000', fontWeight: showCategory ? 'bold' : 'normal', fontSize: 9, whiteSpace: 'nowrap' }}>{showCategory ? getEstimateCategoryLabel(item.category, locale) : ''}</td>
                            <td style={{ padding: '5px 8px' }}>{getEstimateItemLabel(item.code, item.name, locale)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>{number(item.quantity)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', color: '#64748B' }}>{getUnitLabel(item.unit, locale)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>{money(item.unitPrice)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{money(item.totalPrice)}</td>
                          </tr>
                        )
                      })
                    })()}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <table style={{ fontSize: 10, minWidth: 280 }}>
                      <tbody>
                      {[
                        { label: text('Materials', '자재비'), value: estimate.materialCost, bold: false },
                        { label: text('Installation', '시공비'), value: estimate.laborCost, bold: false },
                        { label: text('Rhizomes', '종자비'), value: estimate.seedCost, bold: false },
                        { label: text('Subtotal', '공급가액'), value: estimate.subtotal, bold: true },
                        ...(estimate.discount > 0 ? [{ label: text('Discount', '할인'), value: -estimate.discount, bold: false }] : []),
                        ...(estimate.vat > 0 ? [{ label: text('VAT (10%)', '부가가치세(10%)'), value: estimate.vat, bold: false }] : []),
                      ].map((row) => (
                        <tr key={row.label} style={{ background: row.bold ? '#F0F7EF' : '#fff' }}>
                          <td style={{ padding: '5px 10px', color: '#64748B', whiteSpace: 'nowrap' }}>{row.label}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: row.bold ? 'bold' : 'normal' }}>{money(row.value)}</td>
                        </tr>
                      ))}
                      <tr style={{ background: '#1A2E18' }}>
                        <td style={{ padding: '8px 10px', color: '#8BA888', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{text('Final Total', '최종 합계')}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{money(estimate.total)}</td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {loads && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #2D5A27' }}>{text('Structural Load Analysis (KBC)', '구조 하중 분석 (KBC 기준)')}</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <tbody>
                    {[
                      [text('Mature hop load', '홉 생체중 하중'), `${decimal(loads.hopLoadKN, 3)} kN`, text('Based on 1.8 kg/m unit weight', '단위중량 1.8 kg/m 기준')],
                      [text('Wind load', '풍압 하중'), `${decimal(loads.windLoadKN, 3)} kN`, text(`Design wind speed ${decimal(loads.windSpeedMs, 1)} m/s`, `설계풍속 ${decimal(loads.windSpeedMs, 1)} m/s`)],
                      [text('Total design load', '총 설계 하중'), `${decimal(loads.totalLoadKN, 3)} kN`, text('Hop load + wind load', '홉 하중 + 풍압 하중')],
                      [text('Design tension', '설계 인장력'), `${decimal(loads.designTensionKN, 3)} kN`, text('Total load x safety factor 1.5', '총 하중 × 안전율 1.5')],
                      [text('Recommended wire', '권장 와이어'), locale === 'ko' ? `Φ${number(loads.recommendedWireDiameterMM)}mm 이상` : `${number(loads.recommendedWireDiameterMM)} mm dia. or greater`, text('Based on allowable tension', '허용 인장력 기준')],
                    ].map((row, index) => (
                      <tr key={index} style={{ background: index % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                        <td style={{ padding: '6px 8px', color: '#64748B', width: '35%' }}>{row[0]}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', width: '20%', color: index === 3 ? sc.bg : '#1A2E18' }}>{row[1]}</td>
                        <td style={{ padding: '6px 8px', color: '#94A3B8' }}>{row[2]}</td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #2D5A27' }}>{text('Notes & Information', '특기사항 및 안내')}</div>
                {[
                  text('This estimate is calculated automatically from the supplied design parameters and may vary with site conditions.', '본 견적서는 입력된 설계 파라미터를 기준으로 자동 산출된 것으로, 현장 조건에 따라 변동될 수 있습니다.'),
                  text('Material prices are current as of the issue date and may change with steel and timber markets.', '자재 단가는 견적 발행일 기준이며, 철강·목재 시세 변동에 따라 달라질 수 있습니다.'),
                  text('Installation costs assume standard working conditions; difficult access or terrain may incur additional charges.', '시공비는 표준 작업 기준이며, 접근 난이도·지형 조건에 따라 추가 비용이 발생할 수 있습니다.'),
                  text('The structural safety result uses a simplified KBC calculation. Contact us if a detailed structural review is required.', '구조 안전성 판정은 KBC 간이 계산법 기준이며, 정밀 구조 검토가 필요한 경우 별도 문의 바랍니다.'),
                  text('This estimate is valid for 30 days from the issue date.', '본 견적의 유효기간은 발행일로부터 30일입니다.'),
                ].map((note, index) => (
                  <div key={index} style={{ fontSize: 9.5, color: '#64748B', marginBottom: 5, paddingLeft: 12 }}>{index + 1}. {note}</div>
                ))}
              </div>

              <div style={{ background: '#1A2E18', borderRadius: 8, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{text('HopEden Agricultural Corporation', '농업회사법인 홉이든')}</div>
                  <div style={{ color: '#8BA888', fontSize: 10, marginTop: 2 }}>hopeden.kr</div>
                </div>
                <div style={{ color: '#8BA888', fontSize: 9, textAlign: 'right' }}>
                  <div>{text('Attach this estimate to your inquiry for a faster response.', '이 견적서를 첨부하여 문의해 주시면 빠르게 안내드립니다.')}</div>
                  <div style={{ color: '#4ADE80', fontWeight: 'bold', marginTop: 2 }}>{text("HopEden Designer - Korea's digital standard for hop farming", 'HopEden Designer - 한국 홉 농업의 디지털 표준')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
