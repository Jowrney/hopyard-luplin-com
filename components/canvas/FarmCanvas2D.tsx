// components/canvas/FarmCanvas2D.tsx
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import styled from 'styled-components'
import { useDesignStore } from '@/stores/designStore'
import { useLocale } from '@/components/i18n/LocaleProvider'

const PADDING = 60

const Wrapper = styled.div`width:100%;height:100%;position:relative;user-select:none;`
const Canvas = styled.canvas<{$dragging:boolean}>`width:100%;height:100%;cursor:${({$dragging})=>$dragging?'grabbing':'grab'};`
const ZoomControls = styled.div`position:absolute;top:0.75rem;right:0.75rem;display:flex;flex-direction:column;gap:0.25rem;`
const ZoomBtn = styled.button`
    width:2rem;height:2rem;background:white;border:1px solid #e5e7eb;border-radius:0.5rem;
    box-shadow:0 1px 3px rgba(0,0,0,0.08);color:#4b5563;display:flex;align-items:center;
    justify-content:center;font-weight:700;font-size:1.125rem;cursor:pointer;transition:background 0.1s;
    &:hover{background:#f9fafb;}
`
const FitBtn = styled(ZoomBtn)`font-size:0.75rem;font-weight:400;color:#9ca3af;`
const Legend = styled.div`
    position:absolute;bottom:0.75rem;left:0.75rem;background:rgba(255,255,255,0.92);
    backdrop-filter:blur(4px);border:1px solid #e5e7eb;border-radius:0.75rem;
    padding:0.5rem 0.75rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);
    display:flex;flex-direction:column;gap:0.3rem;
`
const LRow = styled.div`display:flex;align-items:center;gap:0.5rem;font-size:0.7rem;color:#4b5563;`
const LDot = styled.div<{$color:string;$ring?:boolean}>`
    width:0.75rem;height:0.75rem;border-radius:50%;flex-shrink:0;
    background:${({$color})=>$color};
    ${({$ring})=>$ring?'box-shadow:0 0 0 2px white,0 0 0 3.5px #333;':''}
`
const LLine = styled.div<{$color:string;$dash?:boolean}>`
    width:1.5rem;height:2px;flex-shrink:0;
    ${({$dash,$color})=>$dash?`border-top:2px dashed ${$color};background:none;`:`background:${$color};`}
`
const ScaleLabel = styled.div`
    position:absolute;top:0.75rem;left:0.75rem;background:rgba(255,255,255,0.9);
    backdrop-filter:blur(4px);border:1px solid #e5e7eb;border-radius:0.5rem;
    padding:0.25rem 0.5rem;font-size:0.75rem;color:#6b7280;box-shadow:0 1px 3px rgba(0,0,0,0.08);
`
const EmptyState = styled.div`position:absolute;inset:0;display:flex;align-items:center;justify-content:center;`
const EmptyInner = styled.div`text-align:center;color:#9ca3af;`
const EmptyIcon = styled.div`font-size:2.5rem;margin-bottom:0.75rem;`
const EmptyText = styled.p`font-size:0.875rem;`

function drawMast(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,isOuter=false){
  // 그림자
  ctx.fillStyle='rgba(0,0,0,0.12)';ctx.beginPath();ctx.arc(x+1,y+1,r,0,Math.PI*2);ctx.fill()
  // 폴 본체 (검은 원)
  ctx.fillStyle='#111111';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()
  // 내부 흰 링 (Mast 심볼 — 외곽/내부 동일)
  ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=Math.max(1.2,r*0.3)
  ctx.beginPath();ctx.arc(x,y,r*0.5,0,Math.PI*2);ctx.stroke()
  // 외곽 마스트는 테두리 추가 (구분용)
  if(isOuter){
    ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()
  }
}

function drawAnchorPlate(ctx:CanvasRenderingContext2D,x:number,y:number,r:number){
  ctx.fillStyle='rgba(0,0,0,0.1)';ctx.beginPath();ctx.arc(x+1,y+1,r,0,Math.PI*2);ctx.fill()
  ctx.fillStyle='#CC0000';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()
  ctx.strokeStyle='#FF6666';ctx.lineWidth=1.2;ctx.stroke()
}

function drawOuterAnchor(ctx:CanvasRenderingContext2D,x:number,y:number,r:number){
  ctx.fillStyle='#CC0000';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()
  ctx.strokeStyle='#FF6666';ctx.lineWidth=1;ctx.stroke()
  ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=0.9
  ctx.beginPath();ctx.moveTo(x-r*0.6,y);ctx.lineTo(x+r*0.6,y);ctx.stroke()
  ctx.beginPath();ctx.moveTo(x,y-r*0.6);ctx.lineTo(x,y+r*0.6);ctx.stroke()
}

export function FarmCanvas2D() {
  const containerRef=useRef<HTMLDivElement>(null)
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [scale,setScale]=useState(1)
  const [offset,setOffset]=useState({x:0,y:0})
  const [isDragging,setIsDragging]=useState(false)
  const dragStart=useRef({x:0,y:0,ox:0,oy:0})
  const {inputs,quantities}=useDesignStore()
  const {text,number}=useLocale()

  const getAutoScale=useCallback(()=>{
    const el=containerRef.current;if(!el)return 1
    const RS=Math.max(1, Math.min(20, inputs.rowSpacingM))
    const MAST_SPAN=RS*3
    const PS=Math.max(2, Math.min(50, inputs.poleSpacingM))
    const lastMX=Math.floor(inputs.widthM/MAST_SPAN)*MAST_SPAN
    const lastMZ=Math.floor(inputs.heightM/PS)*PS
    const refW=lastMX>0?lastMX:inputs.widthM
    const refH=lastMZ>0?lastMZ:inputs.heightM
    return Math.min((el.clientWidth-PADDING*2)/refW,(el.clientHeight-PADDING*2)/refH,8)
  },[inputs.widthM,inputs.heightM,inputs.rowSpacingM,inputs.poleSpacingM])

  const fitToScreen=useCallback(()=>{ setScale(getAutoScale());setOffset({x:0,y:0}) },[getAutoScale])
  useEffect(()=>{ fitToScreen() },[fitToScreen])

  useEffect(()=>{
    const canvas=canvasRef.current,container=containerRef.current
    if(!canvas||!container)return
    canvas.width=container.clientWidth;canvas.height=container.clientHeight
    const ctx=canvas.getContext('2d');if(!ctx)return

    const CW=canvas.width,CH=canvas.height
    const W=inputs.widthM,H=inputs.heightM
    const RS=Math.max(1,Math.min(20,inputs.rowSpacingM))   // 두둑 간격
    const PS=Math.max(2,Math.min(50,inputs.poleSpacingM))  // 마스트 측면 간격
    const MAST_SPAN=RS*3                                    // 마스트 간격
    const IS_I_TYPE = inputs.trainingType === 'I'          // I자형 여부
    const HOP_OFFSET=0.5
    const HOP_INTERVAL=Math.max(0.5,Math.min(5,inputs.plantSpacingM))
    const WIRE_OFF=0.8              // 보조 와이어 좌우 80cm

    // 마스트 위치 (최대 50개 제한)
    const safeW=Math.max(10,Math.min(500,W)), safeH=Math.max(10,Math.min(500,H))
    const mastXs:number[]=[]; for(let x=0;x<=safeW+0.01&&mastXs.length<50;x+=MAST_SPAN) mastXs.push(Math.round(x*100)/100)
    const mastZs:number[]=[]; for(let z=0;z<=safeH+0.01&&mastZs.length<50;z+=PS) mastZs.push(Math.round(z*100)/100)
    // 두둑 위치 (최대 200개 제한)
    const ridgeXs:number[]=[]; for(let x=0;x<=safeW+0.01&&ridgeXs.length<200;x+=RS) ridgeXs.push(Math.round(x*100)/100)

    // 땅은 마스트 폴 위치 기준 (첫 마스트 ~ 마지막 마스트)
    const lastMastX=mastXs.length>0?mastXs[mastXs.length-1]:safeW
    const lastMastZ=mastZs.length>0?mastZs[mastZs.length-1]:safeH
    const farmW=lastMastX*scale,farmH=lastMastZ*scale
    const oX=(CW-farmW)/2+offset.x,oY=(CH-farmH)/2+offset.y

    ctx.clearRect(0,0,CW,CH)
    ctx.fillStyle='#F5F3EE';ctx.fillRect(0,0,CW,CH)

    // Ground
    ctx.fillStyle='#ECC97A';ctx.strokeStyle='#8B7355';ctx.lineWidth=2
    ctx.beginPath();ctx.roundRect(oX,oY,farmW,farmH,4);ctx.fill();ctx.stroke()

    // 두둑 (Ridge) — 세로 방향, 땅(farmW/farmH) 범위 안에서만
    for(const rx of ridgeXs){
      if(rx>lastMastX) break  // 마지막 마스트 x 넘으면 그리지 않음
      const px=oX+rx*scale,rw=RS*0.5*scale
      const isMastRow=mastXs.some(mx=>Math.abs(mx-rx)<0.01)
      ctx.fillStyle=isMastRow?'rgba(200,140,60,0.5)':'rgba(200,140,60,0.3)'
      ctx.fillRect(px-rw/2,oY,rw,farmH)
    }

    // 수로 (Ditch) — 가로 방향 파란 선
    ctx.strokeStyle='rgba(59,130,246,0.6)';ctx.lineWidth=Math.max(1.2,scale*0.3)
    for(const mz of mastZs){
      if(mz>H) break
      const py=oY+mz*scale
      ctx.beginPath();ctx.moveTo(oX,py);ctx.lineTo(oX+farmW,py);ctx.stroke()
    }

    // 메인 와이어 (마스트 연결)
    ctx.strokeStyle='rgba(10,10,10,0.75)';ctx.lineWidth=Math.max(0.8,scale*0.2)
    ctx.setLineDash([])
    for(const mz of mastZs){
      if(mz>H) break
      const py=oY+mz*scale
      ctx.beginPath();ctx.moveTo(oX,py);ctx.lineTo(oX+farmW,py);ctx.stroke()
    }
    for(const mx of mastXs){
      if(mx>W) break
      const px=oX+mx*scale
      ctx.beginPath();ctx.moveTo(px,oY);ctx.lineTo(px,oY+farmH);ctx.stroke()
    }

    // 보조 유인 와이어 — 모든 두둑 중심 기준 ±80cm 세로 방향
    // 마스트 두둑: 끝 마스트는 안쪽 하나만, 중간/일반 두둑은 양쪽
    ctx.strokeStyle='rgba(50,50,50,0.4)';ctx.lineWidth=Math.max(0.5,scale*0.12)
    for(const rx of ridgeXs){
      if(rx>lastMastX+0.01) break
      const isMast=mastXs.some(mx=>Math.abs(mx-rx)<0.01)
      const mastIdx=isMast?mastXs.findIndex(mx=>Math.abs(mx-rx)<0.01):-1
      const isFirst=mastIdx===0
      const isLast=isMast&&(mastIdx===mastXs.length-1||mastXs[mastIdx+1]>lastMastX+0.01)

      const offsets:number[]=[]
      if(IS_I_TYPE){
        // I자형: 두둑 중앙 1줄만
        offsets.push(0)
      } else {
        // wire enum V: 사용자에게는 Y자형 유인으로 표시
        if(isFirst)     offsets.push(0,+WIRE_OFF)
        else if(isLast) offsets.push(-WIRE_OFF,0)
        else            offsets.push(-WIRE_OFF,+WIRE_OFF)
      }

      for(const dx of offsets){
        const wx=rx+dx; if(wx<0||wx>lastMastX) continue
        const px=oX+wx*scale
        ctx.beginPath();ctx.moveTo(px,oY);ctx.lineTo(px,oY+farmH);ctx.stroke()
      }
    }

    // 앵커 와이어 (빨간 사선 — 외곽 마스트 → 바깥 앵커)
    const ancOff=MAST_SPAN*0.35*scale
    ctx.strokeStyle='rgba(204,0,0,0.7)';ctx.lineWidth=Math.max(0.8,scale*0.18)
    for(const mz of mastZs){
      if(mz>H) break
      const py=oY+mz*scale
      ctx.beginPath();ctx.moveTo(oX,py);ctx.lineTo(oX-ancOff,py);ctx.stroke()
      ctx.beginPath();ctx.moveTo(oX+farmW,py);ctx.lineTo(oX+farmW+ancOff,py);ctx.stroke()
    }
    for(const mx of mastXs){
      if(mx>W) break
      const px=oX+mx*scale
      ctx.beginPath();ctx.moveTo(px,oY);ctx.lineTo(px,oY-ancOff);ctx.stroke()
      ctx.beginPath();ctx.moveTo(px,oY+farmH);ctx.lineTo(px,oY+farmH+ancOff);ctx.stroke()
    }

    // 치수선 (마스트 폴 범위 기준)
    ctx.strokeStyle='#94A3B8';ctx.lineWidth=1;ctx.fillStyle='#94A3B8';ctx.setLineDash([])
    ctx.font='11px system-ui';ctx.textAlign='center'
    ctx.beginPath();ctx.moveTo(oX,oY-22);ctx.lineTo(oX+farmW,oY-22);ctx.stroke()
    ctx.fillText(`← ${number(lastMastX)}m →`,oX+farmW/2,oY-27)
    ctx.save();ctx.translate(oX-32,oY+farmH/2);ctx.rotate(-Math.PI/2)
    ctx.fillText(`← ${number(lastMastZ)}m →`,0,0);ctx.restore()

    // 마스트 간격 표시
    if(scale>0.3&&mastXs.length>1){
      ctx.fillStyle='#666';ctx.font=`${Math.max(8,9*scale*0.4)}px system-ui`;ctx.textAlign='center'
      ctx.fillText(`${number(MAST_SPAN)}m`,oX+MAST_SPAN*scale/2,oY-10)
    }

    // ── 폴 & 앵커 렌더링 ─────────────────────────
    const MR=Math.max(4,scale*0.9)  // 마스트 반지름
    const AR=Math.max(3,scale*0.65) // 앵커 반지름

    // 모든 마스트 위치에 링 원 (외곽도 동일)
    for(const mx of mastXs){
      if(mx>W) break
      for(const mz of mastZs){
        if(mz>H) break
        const px=oX+mx*scale,py=oY+mz*scale
        const isOuter=(Math.abs(mx-mastXs[0])<0.01||Math.abs(mx-mastXs[mastXs.length-1])<0.01||
          Math.abs(mz-mastZs[0])<0.01||Math.abs(mz-mastZs[mastZs.length-1])<0.01)
        // 모두 마스트 링 원으로 표시 (외곽은 더 굵게)
        drawMast(ctx,px,py,MR,isOuter)
      }
    }

    // 바깥 앵커
    const OAR=Math.max(2.5,scale*0.55)
    for(const mz of mastZs){
      if(mz>H) break
      const py=oY+mz*scale
      drawOuterAnchor(ctx,oX-ancOff,py,OAR)
      drawOuterAnchor(ctx,oX+farmW+ancOff,py,OAR)
    }
    for(const mx of mastXs){
      if(mx>W) break
      const px=oX+mx*scale
      drawOuterAnchor(ctx,px,oY-ancOff,OAR)
      drawOuterAnchor(ctx,px,oY+farmH+ancOff,OAR)
    }

    // 홉 식재 (두둑 위, 마스트 구간별 0.5+1m 간격, 땅 범위 안에서만)
    ctx.fillStyle='rgba(34,120,34,0.82)'
    for(const rx of ridgeXs){
      if(rx>lastMastX) break  // 땅 범위 초과 두둑은 홉 없음
      const px=oX+rx*scale
      for(let ci=0;ci<mastZs.length-1;ci++){
        const z0=mastZs[ci],z1=mastZs[ci+1]
        if(z1>lastMastZ+0.01) break
        for(let hz=z0+HOP_OFFSET;hz<z1-HOP_OFFSET+0.01;hz+=HOP_INTERVAL){
          const py=oY+hz*scale; if(py>oY+farmH) break
          ctx.beginPath();ctx.arc(px,py,Math.max(1.5,scale*0.3),0,Math.PI*2);ctx.fill()
        }
      }
    }

    // 북방향
    ctx.fillStyle='#94A3B8';ctx.font='bold 12px system-ui';ctx.textAlign='left'
    ctx.fillText('N↑',oX+farmW+14,oY+4)

  },[inputs,number,quantities,scale,offset])

  useEffect(()=>{
    const el=containerRef.current;if(!el)return
    const ro=new ResizeObserver(()=>fitToScreen());ro.observe(el)
    return ()=>ro.disconnect()
  },[fitToScreen])

  const onMouseDown=(e:React.MouseEvent)=>{ setIsDragging(true);dragStart.current={x:e.clientX,y:e.clientY,ox:offset.x,oy:offset.y} }
  const onMouseMove=(e:React.MouseEvent)=>{ if(!isDragging)return;setOffset({x:dragStart.current.ox+e.clientX-dragStart.current.x,y:dragStart.current.oy+e.clientY-dragStart.current.y}) }
  const onMouseUp=()=>setIsDragging(false)
  const onWheel=(e:React.WheelEvent)=>{ e.preventDefault();setScale(s=>Math.min(10,Math.max(0.2,s*(e.deltaY<0?1.12:0.9)))) }

  return (
    <Wrapper ref={containerRef}>
      <Canvas ref={canvasRef} $dragging={isDragging} aria-label={text('2D hop yard plan', '홉 농장 2D 평면도')}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}/>
      <ZoomControls>
        <ZoomBtn onClick={()=>setScale(s=>Math.min(10,s*1.2))} aria-label={text('Zoom in', '확대')}>+</ZoomBtn>
        <FitBtn onClick={fitToScreen} title={text('Fit to screen', '화면 맞춤')} aria-label={text('Fit to screen', '화면 맞춤')}>⊡</FitBtn>
        <ZoomBtn onClick={()=>setScale(s=>Math.max(0.2,s*0.8))} aria-label={text('Zoom out', '축소')}>−</ZoomBtn>
      </ZoomControls>
      <Legend>
        <LRow><LDot $color="#1A1A1A" $ring/>{text('Mast (interior vertical)', '마스트 (내부 수직)')}</LRow>
        <LRow><LDot $color="#CC0000"/>{text('Mast + anchor (perimeter inclined)', '마스트 + 앵커 (외곽 경사)')}</LRow>
        <LRow><LLine $color="rgba(10,10,10,0.75)"/>{text('Main wire', '메인 와이어')}</LRow>
        <LRow><LLine $color="rgba(50,50,50,0.4)"/>{text('Training wire (±80 cm)', '보조 유인 와이어 (±80cm)')}</LRow>
        <LRow><LLine $color="rgba(204,0,0,0.7)"/>{text('Anchor wire', '앵커 와이어')}</LRow>
        <LRow><LLine $color="rgba(59,130,246,0.6)"/>{text('Ditch', '수로')}</LRow>
        <LRow><LDot $color="rgba(34,120,34,0.8)"/>{text('Hops (1 m spacing, 50 cm from pole)', '홉 (1m 간격, 폴에서 50cm)')}</LRow>
      </Legend>
      <ScaleLabel>
        {number(Math.round(scale/getAutoScale()*100))}%
      </ScaleLabel>
      {!quantities&&(
        <EmptyState><EmptyInner>
          <EmptyIcon>🗺️</EmptyIcon>
          <EmptyText>{text('Enter design information to generate the plan.', '설계 정보를 입력하면 평면도가 생성됩니다.')}</EmptyText>
        </EmptyInner></EmptyState>
      )}
    </Wrapper>
  )
}
