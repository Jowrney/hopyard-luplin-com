'use client'

import { useState, useRef } from 'react'
import { useDesignStore } from '@/stores/designStore'

const REGION_LABEL: Record<string, string> = {
  INLAND: '내륙 일반', SEOUL: '서울/경기',
  GANGWON: '강원 산간', COASTAL: '부산/경남 해안', JEJU: '제주',
}
const KRW = (n: number) => `\u20a9${n.toLocaleString('ko-KR')}`
const NUM = (n: number) => n.toLocaleString('ko-KR')

export function PDFExportModal({ onClose }: { onClose: () => void }) {
  const { inputs, quantities, loads, estimate } = useDesignStore()
  const [farmerName, setFarmerName] = useState('')
  const [farmLocation, setFarmLocation] = useState('')
  const [designName, setDesignName] = useState('새 설계안')
  const [isGenerating, setIsGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const canGenerate = !!quantities && !!loads && !!estimate
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const validDate = new Date(); validDate.setDate(validDate.getDate() + 30)
  const validStr = validDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const safetyConfig = {
    GREEN:  { label: '구조 안전', bg: '#16A34A' },
    YELLOW: { label: '주의 - 와이어 보강 권장', bg: '#D97706' },
    RED:    { label: '위험 - 와이어 즉시 보강 필요', bg: '#DC2626' },
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
        }
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = 210
      const pdfH = 297
      const imgH = (canvas.height * pdfW) / canvas.width

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

      pdf.save(`HopEden_견적서_${designName}_${new Date().toISOString().slice(0,10)}.pdf`)
      setDone(true)
      setTimeout(onClose, 1500)
    } catch (e) {
      console.error('PDF 생성 오류:', e)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl flex overflow-hidden"
           style={{ width: '92vw', maxWidth: 1120, maxHeight: '92vh' }}>

        {/* 왼쪽 설정 */}
        <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="bg-[#1A2E18] px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold">견적서 PDF 출력</h2>
                <p className="text-[#8BA888] text-xs mt-0.5">농가 정보 입력 후 다운로드</p>
              </div>
              <button onClick={onClose} className="text-[#8BA888] hover:text-white text-xl w-7 h-7 flex items-center justify-center">x</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[
              { label: '농가명 (선택)', ph: '예: 홍길동 농장', val: farmerName, set: setFarmerName },
              { label: '농장 위치 (선택)', ph: '예: 경북 안동시', val: farmLocation, set: setFarmLocation },
              { label: '설계안 이름', ph: '예: A안 - 강관 3m', val: designName, set: setDesignName },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                       className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D5A27]" />
              </div>
            ))}

            {estimate && (
              <div className="bg-[#F0F7EF] rounded-xl p-3 space-y-1.5 mt-2">
                <p className="text-xs font-bold text-[#2D5A27]">견적 요약</p>
                {[['자재비', estimate.materialCost], ['시공비', estimate.laborCost], ['종자비', estimate.seedCost],
                  ...(estimate.vat > 0 ? [['부가세', estimate.vat]] : [])
                ].map(([l, v]) => (
                  <div key={String(l)} className="flex justify-between">
                    <span className="text-xs text-gray-500">{l}</span>
                    <span className="text-xs font-semibold">{KRW(Number(v))}</span>
                  </div>
                ))}
                <div className="border-t border-[#2D5A27]/20 pt-1.5 flex justify-between">
                  <span className="text-sm font-bold text-[#1A2E18]">합계</span>
                  <span className="text-sm font-bold text-[#2D5A27]">{KRW(estimate.total)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
            {done ? (
              <div className="text-center py-3">
                <div className="text-2xl mb-1">✅</div>
                <p className="text-sm font-semibold text-[#2D5A27]">저장 완료!</p>
              </div>
            ) : (
              <button onClick={handleGenerate} disabled={!canGenerate || isGenerating}
                      className="w-full py-3 bg-[#2D5A27] text-white rounded-xl font-bold text-sm hover:bg-[#234820] disabled:opacity-50 flex items-center justify-center gap-2">
                {isGenerating ? <><span className="animate-spin">⌛</span>생성 중...</> : '📥 PDF 다운로드'}
              </button>
            )}
          </div>
        </div>

        {/* 오른쪽 미리보기 */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <p className="text-xs text-gray-400 text-center mb-4">미리보기 (실제 PDF와 동일)</p>

          {/* A4 문서 */}
          <div ref={previewRef} data-pdf-root="true"
               style={{ width: 794, margin: '0 auto', background: '#fff', fontFamily: "'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>

            {/* 헤더 */}
            <div style={{ background: '#1A2E18', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>HopEden Designer</div>
                <div style={{ color: '#8BA888', fontSize: 11 }}>홉 시설설계 &amp; 비용산출 플랫폼 | 농업회사법인 홉이든</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 4 }}>시설설계 견적서</div>
                <div style={{ color: '#8BA888', fontSize: 10 }}>발행일: {today}</div>
                <div style={{ color: '#8BA888', fontSize: 10 }}>유효기간: {validStr}까지</div>
              </div>
            </div>

            <div style={{ padding: '24px 32px' }}>

              {/* 농가 정보 */}
              <div style={{ background: '#F0F7EF', border: '1px solid #2D5A27', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ color: '#2D5A27', fontWeight: 'bold', fontSize: 11, marginBottom: 8, borderBottom: '1px solid #a3c9a0', paddingBottom: 6 }}>농가 정보</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 24px' }}>
                  {[['농가명', farmerName||'(미입력)'], ['설계안명', designName], ['농장 위치', farmLocation||'(미입력)'], ['재배 면적', `${NUM(inputs.widthM*inputs.heightM)} ㎡ (${inputs.widthM}×${inputs.heightM}m)`]].map(([l,v]) => (
                    <div key={l} style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                      <span style={{ color: '#64748B', width: 58, flexShrink: 0 }}>{l}</span>
                      <span style={{ fontWeight: 'bold' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 최종 금액 */}
              {estimate && (
                <div style={{ background: '#1A2E18', borderRadius: 8, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#8BA888', fontSize: 11, marginBottom: 3 }}>최종 견적 금액</div>
                    <div style={{ color: '#8BA888', fontSize: 9 }}>자재비 {KRW(estimate.materialCost)} + 시공비 {KRW(estimate.laborCost)} + 종자비 {KRW(estimate.seedCost)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{KRW(estimate.total)}</div>
                    <div style={{ color: '#8BA888', fontSize: 9 }}>{estimate.vat > 0 ? `부가세 ${KRW(estimate.vat)} 포함` : '부가세 별도'}</div>
                  </div>
                </div>
              )}

              {/* 수량 카드 */}
              {quantities && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    { l: '총 폴 수량', v: `${NUM(quantities.totalPoleCount)}개`, s: `내부${quantities.innerPoleCount}+앵커${quantities.outerPoleCount}` },
                    { l: '와이어 길이', v: `${NUM(quantities.totalWireM)}m`, s: `${inputs.wireRows}단, 여유5%` },
                    { l: '재식 주수', v: `${NUM(quantities.plantCount)}주`, s: `종근 ${NUM(quantities.rhizomeCount)}주` },
                    { l: '앵커 수량', v: `${NUM(quantities.anchorCount)}개`, s: '외곽 기준' },
                  ].map((c) => (
                    <div key={c.l} style={{ background: '#F0F7EF', border: '1px solid #2D5A27', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ color: '#64748B', fontSize: 9, marginBottom: 3 }}>{c.l}</div>
                      <div style={{ color: '#1A2E18', fontSize: 15, fontWeight: 'bold', marginBottom: 2 }}>{c.v}</div>
                      <div style={{ color: '#94A3B8', fontSize: 8 }}>{c.s}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 안전 배지 */}
              {loads && (
                <div style={{ background: sc.bg, borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>{sc.label}</span>
                  <span style={{ color: '#fff', fontSize: 10, opacity: 0.9 }}>설계 인장력 {loads.designTensionKN.toFixed(2)} kN | 권장 Φ{loads.recommendedWireDiameterMM}mm 이상</span>
                </div>
              )}

              {/* 설계 파라미터 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6, paddingBottom: 4, borderBottom: '2px solid #2D5A27' }}>설계 파라미터</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <tbody>
                  {[
                    ['재배 면적', `${NUM(inputs.widthM*inputs.heightM)} ㎡`, '행간', `${inputs.rowSpacingM} m`],
                    ['농장 가로', `${inputs.widthM} m`, '주간', `${inputs.plantSpacingM} m`],
                    ['농장 세로', `${inputs.heightM} m`, '폴 간격', `${inputs.poleSpacingM} m`],
                    ['폴 유효높이', `${inputs.poleEffectiveHeightM} m`, '와이어 단수', `${inputs.wireRows}단`],
                    ['지역(풍하중)', REGION_LABEL[inputs.region]??inputs.region, '설계 풍속', loads?`${loads.windSpeedMs.toFixed(1)} m/s`:'-'],
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i%2===0?'#fff':'#F8FAFC' }}>
                      <td style={{ padding:'6px 8px', color:'#64748B', width:'18%' }}>{row[0]}</td>
                      <td style={{ padding:'6px 8px', fontWeight:'bold', width:'32%' }}>{row[1]}</td>
                      <td style={{ padding:'6px 8px', color:'#64748B', width:'18%' }}>{row[2]}</td>
                      <td style={{ padding:'6px 8px', fontWeight:'bold', width:'32%' }}>{row[3]}</td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* 상세 견적 명세 */}
              {estimate && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight:'bold', fontSize:12, marginBottom:6, paddingBottom:4, borderBottom:'2px solid #2D5A27' }}>상세 견적 명세</div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
                    <thead>
                    <tr style={{ background:'#1A2E18', color:'#fff' }}>
                      {['구분','품명','수량','단위','단가','금액'].map((h,i) => (
                        <th key={h} style={{ padding:'7px 8px', textAlign: i>=2?'right':'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                    </thead>
                    <tbody>
                    {(() => {
                      const cc: Record<string,string> = {'자재비':'#2563EB','시공비':'#EA580C','종자비':'#16A34A'}
                      let prev = ''
                      return estimate.breakdown.map((item, i) => {
                        const show = item.category !== prev
                        if (show) prev = item.category
                        return (
                          <tr key={i} style={{ background:i%2===0?'#fff':'#F8FAFC' }}>
                            <td style={{ padding:'5px 8px', color:cc[item.category]??'#000', fontWeight:show?'bold':'normal', fontSize:9, whiteSpace:'nowrap' }}>{show?item.category:''}</td>
                            <td style={{ padding:'5px 8px' }}>{item.name}</td>
                            <td style={{ padding:'5px 8px', textAlign:'right' }}>{NUM(item.quantity)}</td>
                            <td style={{ padding:'5px 8px', textAlign:'right', color:'#64748B' }}>{item.unit}</td>
                            <td style={{ padding:'5px 8px', textAlign:'right' }}>{KRW(item.unitPrice)}</td>
                            <td style={{ padding:'5px 8px', textAlign:'right', fontWeight:'bold' }}>{KRW(item.totalPrice)}</td>
                          </tr>
                        )
                      })
                    })()}
                    </tbody>
                  </table>
                  {/* 합계 */}
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                    <table style={{ fontSize:10, minWidth:280 }}>
                      <tbody>
                      {[
                        {l:'자재비',v:estimate.materialCost,bold:false},
                        {l:'시공비',v:estimate.laborCost,bold:false},
                        {l:'종자비',v:estimate.seedCost,bold:false},
                        {l:'공급가액',v:estimate.subtotal,bold:true},
                        ...(estimate.vat>0?[{l:'부가가치세(10%)',v:estimate.vat,bold:false}]:[]),
                      ].map((r) => (
                        <tr key={r.l} style={{ background:r.bold?'#F0F7EF':'#fff' }}>
                          <td style={{ padding:'5px 10px', color:'#64748B', whiteSpace:'nowrap' }}>{r.l}</td>
                          <td style={{ padding:'5px 10px', textAlign:'right', fontWeight:r.bold?'bold':'normal' }}>{KRW(r.v)}</td>
                        </tr>
                      ))}
                      <tr style={{ background:'#1A2E18' }}>
                        <td style={{ padding:'8px 10px', color:'#8BA888', fontWeight:'bold', whiteSpace:'nowrap' }}>최종 합계</td>
                        <td style={{ padding:'8px 10px', textAlign:'right', color:'#fff', fontWeight:'bold', fontSize:14 }}>{KRW(estimate.total)}</td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 하중 분석 */}
              {loads && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight:'bold', fontSize:12, marginBottom:6, paddingBottom:4, borderBottom:'2px solid #2D5A27' }}>구조 하중 분석 (KBC 기준)</div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10 }}>
                    <tbody>
                    {[
                      ['홉 생체중 하중', `${loads.hopLoadKN.toFixed(3)} kN`, '단위중량 1.8 kg/m 기준'],
                      ['풍압 하중', `${loads.windLoadKN.toFixed(3)} kN`, `설계풍속 ${loads.windSpeedMs.toFixed(1)} m/s`],
                      ['총 설계 하중', `${loads.totalLoadKN.toFixed(3)} kN`, '홉 하중 + 풍압 하중'],
                      ['설계 인장력', `${loads.designTensionKN.toFixed(3)} kN`, '총 하중 × 안전율 1.5'],
                      ['권장 와이어', `Φ${loads.recommendedWireDiameterMM}mm 이상`, '허용 인장력 기준'],
                    ].map((row,i) => (
                      <tr key={i} style={{ background:i%2===0?'#fff':'#F8FAFC' }}>
                        <td style={{ padding:'6px 8px', color:'#64748B', width:'35%' }}>{row[0]}</td>
                        <td style={{ padding:'6px 8px', fontWeight:'bold', width:'20%', color:i===3?sc.bg:'#1A2E18' }}>{row[1]}</td>
                        <td style={{ padding:'6px 8px', color:'#94A3B8' }}>{row[2]}</td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 특기사항 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight:'bold', fontSize:12, marginBottom:6, paddingBottom:4, borderBottom:'2px solid #2D5A27' }}>특기사항 및 안내</div>
                {['본 견적서는 입력된 설계 파라미터를 기준으로 자동 산출된 것으로, 현장 조건에 따라 변동될 수 있습니다.',
                  '자재 단가는 견적 발행일 기준이며, 철강·목재 시세 변동에 따라 달라질 수 있습니다.',
                  '시공비는 표준 작업 기준이며, 접근 난이도·지형 조건에 따라 추가 비용이 발생할 수 있습니다.',
                  '구조 안전성 판정은 KBC 간이 계산법 기준이며, 정밀 구조 검토가 필요한 경우 별도 문의 바랍니다.',
                  '본 견적의 유효기간은 발행일로부터 30일입니다.',
                ].map((note, i) => (
                  <div key={i} style={{ fontSize:9.5, color:'#64748B', marginBottom:5, paddingLeft:12 }}>{i+1}. {note}</div>
                ))}
              </div>

              {/* 푸터 */}
              <div style={{ background:'#1A2E18', borderRadius:8, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ color:'#fff', fontWeight:'bold', fontSize:12 }}>농업회사법인 홉이든</div>
                  <div style={{ color:'#8BA888', fontSize:10, marginTop:2 }}>hopeden.kr</div>
                </div>
                <div style={{ color:'#8BA888', fontSize:9, textAlign:'right' }}>
                  <div>이 견적서를 첨부하여 문의해 주시면 빠르게 안내드립니다.</div>
                  <div style={{ color:'#4ADE80', fontWeight:'bold', marginTop:2 }}>HopEden Designer - 한국 홉 농업의 디지털 표준</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
