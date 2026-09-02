// components/canvas/FarmCanvas3D.tsx
'use client'

import { useEffect, useRef } from 'react'
import type * as THREETypes from 'three'
import styled from 'styled-components'
import { useDesignStore } from '@/stores/designStore'

const CanvasWrapper = styled.div`width:100%;height:100%;position:relative;`

// 외부에서 PNG 저장할 수 있도록 렌더러 캔버스 노출
export function captureCanvas3D(): string | null {
  const canvas = document.querySelector('#hopeden-3d-canvas') as HTMLCanvasElement | null
  if (!canvas) return null
  try {
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}
const BottomHint = styled.div`
    position:absolute;bottom:0.75rem;left:0.75rem;background:rgba(255,255,255,0.85);
    backdrop-filter:blur(4px);border:1px solid #e5e7eb;border-radius:0.75rem;
    padding:0.375rem 0.75rem;font-size:0.75rem;color:#6b7280;
    box-shadow:0 1px 4px rgba(0,0,0,0.08);pointer-events:none;
`
const TopLabel = styled.div`
  position:absolute;top:0.75rem;left:0.75rem;background:rgba(255,255,255,0.85);
  backdrop-filter:blur(4px);border:1px solid #e5e7eb;border-radius:0.5rem;
  padding:0.25rem 0.625rem;font-size:0.75rem;color:#2D5A27;
  font-weight:500;box-shadow:0 1px 4px rgba(0,0,0,0.08);pointer-events:none;
`

export function FarmCanvas3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef  = useRef<unknown>(null)
  const cameraRef    = useRef<unknown>(null)
  const sceneRef     = useRef<unknown>(null)
  const animIdRef    = useRef(0)
  const readyRef     = useRef(false)
  const assetKitRef  = useRef<Map<string, THREETypes.Mesh> | null>(null)
  const {inputs, quantities, profileId} = useDesignStore()

  useEffect(()=>{
    const container = containerRef.current; if(!container) return
    let removed = false
    const init = async ()=>{
      await new Promise<void>(resolve=>{ const check=()=>(container.clientWidth>0&&container.clientHeight>0)?resolve():requestAnimationFrame(check);check() })
      if(removed) return
      const THREE = await import('three')
      const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true})
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
      renderer.setSize(container.clientWidth,container.clientHeight)
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap
      renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1
      renderer.domElement.id = 'hopeden-3d-canvas'
      container.appendChild(renderer.domElement);rendererRef.current=renderer
      const camera=new THREE.PerspectiveCamera(50,container.clientWidth/container.clientHeight,0.1,1000)
      cameraRef.current=camera
      const W=inputs.widthM,H=inputs.heightM,r=Math.max(W,H)*1.4
      camera.position.set(W/2+r*0.6,r*0.45,H/2+r*0.6);camera.lookAt(W/2,0,H/2)
      let theta=Math.atan2(camera.position.x-W/2,camera.position.z-H/2),phi=Math.PI/4,radius=r
      const tgt={x:W/2,y:0,z:H/2}
      const syncCam=()=>{ phi=Math.max(0.05,Math.min(Math.PI/2.05,phi));radius=Math.max(3,Math.min(600,radius));camera.position.set(tgt.x+radius*Math.sin(phi)*Math.sin(theta),radius*Math.cos(phi),tgt.z+radius*Math.sin(phi)*Math.cos(theta));camera.lookAt(tgt.x,tgt.y,tgt.z) }
      syncCam()
      let down=false,lx=0,ly=0
      const onDown=(e:PointerEvent)=>{ if(e.button===2) return; down=true;lx=e.clientX;ly=e.clientY;renderer.domElement.setPointerCapture(e.pointerId) }
      const onUp=(e:PointerEvent)=>{ down=false;renderer.domElement.releasePointerCapture(e.pointerId) }
      const onMove=(e:PointerEvent)=>{ const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;if(down){theta-=dx*0.007;phi-=dy*0.007;syncCam()} }
      const onWheel=(e:WheelEvent)=>{ e.preventDefault();radius*=e.deltaY>0?1.08:0.93;syncCam() }

      // 방향키로 카메라 이동
      const MOVE_SPEED = 0.5
      const onKeyDown=(e:KeyboardEvent)=>{
        const s = radius * 0.008
        switch(e.key){
          case 'ArrowLeft':  tgt.x-=Math.cos(theta)*MOVE_SPEED*s*60; tgt.z+=Math.sin(theta)*MOVE_SPEED*s*60; e.preventDefault(); break
          case 'ArrowRight': tgt.x+=Math.cos(theta)*MOVE_SPEED*s*60; tgt.z-=Math.sin(theta)*MOVE_SPEED*s*60; e.preventDefault(); break
          case 'ArrowUp':    tgt.x+=Math.sin(theta)*MOVE_SPEED*s*60; tgt.z+=Math.cos(theta)*MOVE_SPEED*s*60; e.preventDefault(); break
          case 'ArrowDown':  tgt.x-=Math.sin(theta)*MOVE_SPEED*s*60; tgt.z-=Math.cos(theta)*MOVE_SPEED*s*60; e.preventDefault(); break
        }
        syncCam()
      }

      renderer.domElement.addEventListener('pointerdown',(e)=>{ renderer.domElement.focus(); onDown(e) })
      renderer.domElement.addEventListener('pointerup',onUp)
      renderer.domElement.addEventListener('pointermove',onMove)
      renderer.domElement.addEventListener('wheel',onWheel,{passive:false})
      renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault())
      // 캔버스 포커스 가능하게 설정
      renderer.domElement.setAttribute('tabindex','0')
      renderer.domElement.style.outline='none'
      renderer.domElement.addEventListener('keydown',onKeyDown)
      const ro=new ResizeObserver(()=>{ camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();renderer.setSize(container.clientWidth,container.clientHeight) })
      ro.observe(container)
      const tick=()=>{ animIdRef.current=requestAnimationFrame(tick);if(sceneRef.current)renderer.render(sceneRef.current as THREETypes.Scene,camera as THREETypes.PerspectiveCamera) }
      tick();readyRef.current=true
      return ()=>{ removed=true;readyRef.current=false;cancelAnimationFrame(animIdRef.current);ro.disconnect();renderer.dispose();if(container.contains(renderer.domElement))container.removeChild(renderer.domElement);rendererRef.current=null;cameraRef.current=null }
    }
    let cleanup:(()=>void)|undefined
    init().then(fn=>{cleanup=fn})
    return ()=>{ removed=true;cleanup?.() }
  },[]) // eslint-disable-line

  useEffect(()=>{
    const build = async ()=>{
      await new Promise<void>(resolve=>{ const check=()=>readyRef.current?resolve():setTimeout(check,50);check() })
      const THREE = await import('three')
      if (!assetKitRef.current) {
        try {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
          const gltf = await new GLTFLoader().loadAsync('/models/hopyard-asset-kit.glb')
          const assets = new Map<string, THREETypes.Mesh>()
          gltf.scene.traverse(object => {
            if ((object as THREETypes.Mesh).isMesh) assets.set(object.name, object as THREETypes.Mesh)
          })
          assetKitRef.current = assets
        } catch (error) {
          console.warn('Blender asset kit unavailable; using procedural fallback.', error)
          assetKitRef.current = new Map()
        }
      }
      const poleAssetName = profileId === 'US_HIGH_TRELLIS' ? 'US_WoodPole_22ft' : 'KR_SteelPole_6m'
      const poleTemplate = assetKitRef.current.get(poleAssetName)
      const anchorTemplate = profileId === 'US_HIGH_TRELLIS'
        ? assetKitRef.current.get('US_HelixAnchor_48in')
        : undefined
      const scene = new THREE.Scene()
      scene.background=new THREE.Color(0xDCEDDC)
      scene.fog=new THREE.Fog(0xCCE4CC,120,400)
      sceneRef.current=scene

      const W=inputs.widthM, H=inputs.heightM
      const pH=inputs.poleEffectiveHeightM
      const RS=inputs.rowSpacingM          // 두둑 간격 3.5m
      const MAST_SPAN=RS*3                  // 마스트 간격 10.5m
      const POLE_SPACING=inputs.poleSpacingM // 측면 마스트 간격 8m
      const HOP_OFFSET=0.5
      const HOP_INTERVAL=Math.max(0.5,Math.min(5,inputs.plantSpacingM))
      const WIRE_OFF=0.8
      const IS_I_TYPE=inputs.trainingType==='I'                    // 보조 유인 와이어 ±80cm

      // 마스트 위치 (2D와 동일 기준)
      // 입력값 안전 클램핑
      const safeRS    = Math.max(1,  Math.min(20,  RS))
      const safePS    = Math.max(2,  Math.min(50,  POLE_SPACING))
      const safeMSPAN = safeRS * 3
      const safeW     = Math.max(10, Math.min(500, W))
      const safeH     = Math.max(10, Math.min(500, H))

      // 마스트/두둑 위치 (상한선으로 브라우저 크래시 방지)
      const mastXs:number[]=[]; for(let x=0;x<=safeW+0.01&&mastXs.length<50;x+=safeMSPAN) mastXs.push(Math.round(x*100)/100)
      const mastZs:number[]=[]; for(let z=0;z<=safeH+0.01&&mastZs.length<50;z+=safePS)    mastZs.push(Math.round(z*100)/100)
      const ridgeXs:number[]=[]; for(let x=0;x<=safeW+0.01&&ridgeXs.length<200;x+=safeRS) ridgeXs.push(Math.round(x*100)/100)

      const lastMastX=mastXs.length>0?mastXs[mastXs.length-1]:safeW
      const lastMastZ=mastZs.length>0?mastZs[mastZs.length-1]:safeH
      const cx=lastMastX/2, cz=lastMastZ/2

      // 카메라 타겟 업데이트
      if(cameraRef.current){
        const cam=cameraRef.current as THREETypes.PerspectiveCamera
        cam.lookAt(cx,0,cz)
      }

      // ── 조명 ──────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff,0.75))
      const sun=new THREE.DirectionalLight(0xFFFDE7,1.3)
      sun.position.set(cx+lastMastX*0.4,60,cz-lastMastZ*0.3);sun.castShadow=true
      sun.shadow.mapSize.set(4096,4096)
      sun.shadow.camera.left=-lastMastX*1.5;sun.shadow.camera.right=lastMastX*2
      sun.shadow.camera.top=lastMastZ*1.5;sun.shadow.camera.bottom=-lastMastZ
      sun.shadow.camera.far=300;sun.shadow.bias=-0.001
      scene.add(sun)
      const fill=new THREE.DirectionalLight(0xB3E5FC,0.3);fill.position.set(-lastMastX,25,lastMastZ);scene.add(fill)

      // ── 지면 ──────────────────────────────────────
      const gnd=new THREE.Mesh(new THREE.PlaneGeometry(lastMastX*8,lastMastZ*8),new THREE.MeshLambertMaterial({color:0x6AAF6A}))
      gnd.rotation.x=-Math.PI/2;gnd.position.set(cx,-0.02,cz);gnd.receiveShadow=true;scene.add(gnd)
      // 농장 땅 (마스트 범위만)
      const farm=new THREE.Mesh(new THREE.PlaneGeometry(lastMastX,lastMastZ),new THREE.MeshLambertMaterial({color:0xE8C98A}))
      farm.rotation.x=-Math.PI/2;farm.position.set(cx,0,cz);farm.receiveShadow=true;scene.add(farm)
      const border=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(lastMastX,0.02,lastMastZ)),new THREE.LineBasicMaterial({color:0x8B7355}))
      border.position.set(cx,0.01,cz);scene.add(border)

      // ── 두둑 (Ridge) — 마스트 범위 안 세로 방향 ──
      const ridgeMat=new THREE.MeshLambertMaterial({color:0xC8905A})
      for(const rx of ridgeXs){
        if(rx>lastMastX+0.01) break
        const ridge=new THREE.Mesh(new THREE.BoxGeometry(RS*0.5,0.12,lastMastZ),ridgeMat)
        ridge.position.set(rx,0.06,cz);ridge.receiveShadow=true;scene.add(ridge)
      }

      // ── 재질 ──────────────────────────────────────
      const mastMat  = poleTemplate?.material ?? new THREE.MeshStandardMaterial({color:0x1A1A1A,metalness:0.75,roughness:0.25})
      const plateMat = new THREE.MeshStandardMaterial({color:0xCC0000,metalness:0.5,roughness:0.4})
      const concMat  = new THREE.MeshLambertMaterial({color:0xBDBDBD})
      const capMat   = new THREE.MeshStandardMaterial({color:0x424242,metalness:0.8,roughness:0.2})
      const mainWire = new THREE.LineBasicMaterial({color:0x111111})
      const ancWire  = new THREE.LineBasicMaterial({color:0xCC0000})
      const subWire  = new THREE.LineBasicMaterial({color:0x444444,opacity:0.7,transparent:true})
      const yarnMat  = new THREE.LineBasicMaterial({color:0xCCAA00,opacity:0.8,transparent:true})
      const stemMat  = new THREE.MeshLambertMaterial({color:0x2E7D32})
      const hopMat   = new THREE.MeshLambertMaterial({color:0x558B2F})

      // 기초 생성
      const addBase=(x:number,z:number)=>{
        const c=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.25,0.07,8),concMat)
        c.position.set(x,0.035,z);scene.add(c)
        const p=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.04,8),plateMat)
        p.position.set(x,0.08,z);scene.add(p)
      }
      const addOuterAnchor=(x:number,z:number)=>{
        if(anchorTemplate){
          const anchor=new THREE.Mesh(anchorTemplate.geometry,anchorTemplate.material)
          anchor.position.set(x,0,z);anchor.castShadow=true;scene.add(anchor)
          return {x,y:0.1,z}
        }
        const c=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.2,0.06,8),concMat)
        c.position.set(x,0.03,z);scene.add(c)
        const p=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.04,8),plateMat)
        p.position.set(x,0.07,z);scene.add(p)
        const sc=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.01,0.5,6),new THREE.MeshStandardMaterial({color:0xC0C0C0,metalness:0.9}))
        sc.position.set(x,-0.22,z);scene.add(sc)
        const rg=new THREE.Mesh(new THREE.TorusGeometry(0.055,0.011,8,12),new THREE.MeshStandardMaterial({color:0xC0C0C0,metalness:0.9}))
        rg.position.set(x,0.1,z);rg.rotation.x=Math.PI/2;scene.add(rg)
        return {x,y:0.1,z}
      }

      const TILT=0.2
      interface Top{tx:number,ty:number,tz:number}
      interface MastInfo{ri:number,ci:number,rx:number,cz_:number,top:Top}
      const masts:MastInfo[]=[]
      const mastGeometry = poleTemplate
        ? poleTemplate.geometry
        : new THREE.CylinderGeometry(0.042,0.058,1,8).translate(0,0.5,0)
      const templateHeight = poleTemplate
        ? Number(poleTemplate.userData.exposed_height_m ?? Number(poleTemplate.userData.exposed_height_ft ?? 1) * 0.3048)
        : 1
      const poleTransforms:{position:THREETypes.Vector3;quaternion:THREETypes.Quaternion;scale:THREETypes.Vector3}[]=[]
      const recordPole=(x:number,z:number,top:Top)=>{
        const direction=new THREE.Vector3(top.tx-x,top.ty,top.tz-z)
        const length=direction.length()
        const quaternion=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize())
        poleTransforms.push({
          position:new THREE.Vector3(x,0,z),
          quaternion,
          scale:new THREE.Vector3(1,length/templateHeight,1),
        })
      }

      // 경사 마스트
      const addTiltedMast=(x:number,z:number,dX:number,dZ:number):Top=>{
        addBase(x,z)
        const topX=x+Math.sin(TILT)*pH*dX
        const topZ=z+Math.sin(TILT)*pH*dZ
        const topY=Math.cos(TILT)*pH
        recordPole(x,z,{tx:topX,ty:topY,tz:topZ})
        const cap=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,4,0,Math.PI*2,0,Math.PI/2),capMat)
        cap.position.set(topX,topY,topZ);scene.add(cap)
        return {tx:topX,ty:topY,tz:topZ}
      }
      // 수직 마스트
      const addVertMast=(x:number,z:number):Top=>{
        addBase(x,z)
        recordPole(x,z,{tx:x,ty:pH,tz:z})
        const cap=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,4,0,Math.PI*2,0,Math.PI/2),capMat)
        cap.position.set(x,pH,z);scene.add(cap)
        return {tx:x,ty:pH,tz:z}
      }

      // ── 마스트 배치 ───────────────────────────────
      for(let ri=0;ri<mastXs.length;ri++){
        const mx=mastXs[ri]; if(mx>lastMastX+0.01) break
        for(let ci=0;ci<mastZs.length;ci++){
          const mz=mastZs[ci]; if(mz>lastMastZ+0.01) break
          const isLeft=ri===0, isRight=ri===mastXs.length-1||mastXs[ri+1]>lastMastX+0.01
          const isFront=ci===0, isBack=ci===mastZs.length-1||mastZs[ci+1]>lastMastZ+0.01
          const isOuter=isLeft||isRight||isFront||isBack
          let top:Top
          if(isOuter){
            const dX=isLeft?-1:isRight?1:0
            const dZ=isFront?-1:isBack?1:0
            top=addTiltedMast(mx,mz,dX,dZ)
          } else {
            top=addVertMast(mx,mz)
          }
          masts.push({ri,ci,rx:mx,cz_:mz,top})
        }
      }
      const poleInstances=new THREE.InstancedMesh(mastGeometry,mastMat,poleTransforms.length)
      const poleMatrix=new THREE.Matrix4()
      poleTransforms.forEach((transform,index)=>{
        poleMatrix.compose(transform.position,transform.quaternion,transform.scale)
        poleInstances.setMatrixAt(index,poleMatrix)
      })
      poleInstances.instanceMatrix.needsUpdate=true
      poleInstances.castShadow=true
      poleInstances.receiveShadow=true
      poleInstances.name=`${poleAssetName}_Instances`
      scene.add(poleInstances)

      // ── 바깥 앵커 + 앵커 와이어 ──────────────────
      const anchorDist=MAST_SPAN*0.4
      for(let ci=0;ci<mastZs.length;ci++){
        const mz=mastZs[ci]; if(mz>lastMastZ+0.01) break
        const lTop=masts.find(m=>m.ri===0&&Math.abs(m.cz_-mz)<0.01)?.top
        const rTop=masts.find(m=>m.rx===mastXs[mastXs.length-1]&&Math.abs(m.cz_-mz)<0.01)?.top
        if(lTop){ const a=addOuterAnchor(-anchorDist,mz); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(lTop.tx,lTop.ty,lTop.tz),new THREE.Vector3(a.x,a.y,a.z)]),ancWire)) }
        if(rTop){ const a=addOuterAnchor(lastMastX+anchorDist,mz); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(rTop.tx,rTop.ty,rTop.tz),new THREE.Vector3(a.x,a.y,a.z)]),ancWire)) }
      }
      for(let ri=0;ri<mastXs.length;ri++){
        const mx=mastXs[ri]; if(mx>lastMastX+0.01) break
        const fTop=masts.find(m=>Math.abs(m.rx-mx)<0.01&&m.ci===0)?.top
        const bTop=masts.find(m=>Math.abs(m.rx-mx)<0.01&&m.cz_===mastZs[mastZs.length-1])?.top
        if(fTop){ const a=addOuterAnchor(mx,-anchorDist); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(fTop.tx,fTop.ty,fTop.tz),new THREE.Vector3(a.x,a.y,a.z)]),ancWire)) }
        if(bTop){ const a=addOuterAnchor(mx,lastMastZ+anchorDist); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(bTop.tx,bTop.ty,bTop.tz),new THREE.Vector3(a.x,a.y,a.z)]),ancWire)) }
      }

      // ── 상단 메인 와이어 ──────────────────────────
      // Z 방향 (열) 연결
      for(let ci=0;ci<mastZs.length;ci++){
        const mz=mastZs[ci]; if(mz>lastMastZ+0.01) break
        const pts=masts.filter(m=>Math.abs(m.cz_-mz)<0.01).sort((a,b)=>a.rx-b.rx).map(m=>new THREE.Vector3(m.top.tx,m.top.ty,m.top.tz))
        if(pts.length>1) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mainWire))
      }
      // X 방향 (행) 연결
      for(let ri=0;ri<mastXs.length;ri++){
        const mx=mastXs[ri]; if(mx>lastMastX+0.01) break
        const pts=masts.filter(m=>Math.abs(m.rx-mx)<0.01).sort((a,b)=>a.cz_-b.cz_).map(m=>new THREE.Vector3(m.top.tx,m.top.ty,m.top.tz))
        if(pts.length>1) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mainWire))
      }

      // ── 보조 유인 와이어 — 모든 두둑 ±80cm 세로 방향 ──
      // 첫/끝 마스트: 메인와이어(ridgeX) + 안쪽 80cm
      // 중간 마스트 & 일반 두둑: ±80cm 양쪽
      for(const ridgeX of ridgeXs){
        if(ridgeX>lastMastX+0.01) break
        const mastIdx=mastXs.findIndex(mx=>Math.abs(mx-ridgeX)<0.01)
        const isMast=mastIdx>=0
        const isFirst=mastIdx===0
        const isLast=isMast&&(mastIdx===mastXs.length-1||(mastXs[mastIdx+1]??999)>lastMastX+0.01)

        const wireOffsets:number[]=[]
        if(IS_I_TYPE){
          // I자형: 두둑 중앙 1줄만
          wireOffsets.push(0)
        } else {
          // V자형
          if(isFirst)      wireOffsets.push(0, +WIRE_OFF)
          else if(isLast)  wireOffsets.push(-WIRE_OFF, 0)
          else             wireOffsets.push(-WIRE_OFF, +WIRE_OFF)
        }

        // 인접 마스트 찾기 (높이 보간용)
        const leftMastX =mastXs.filter(mx=>mx<=ridgeX).at(-1)??mastXs[0]
        const rightMastX=mastXs.filter(mx=>mx> ridgeX)[0]??mastXs[mastXs.length-1]
        const tX=leftMastX===rightMastX?0:(ridgeX-leftMastX)/(rightMastX-leftMastX)

        for(const dx of wireOffsets){
          const wx=ridgeX+dx; if(wx<0||wx>lastMastX) continue
          // Z 방향 세로 와이어 — 마스트 Z 위치들 연결
          const pts:THREETypes.Vector3[]=[]
          for(let ci=0;ci<mastZs.length;ci++){
            const mz=mastZs[ci]; if(mz>lastMastZ+0.01) break
            const lM=masts.find(m=>Math.abs(m.rx-leftMastX)<0.01&&Math.abs(m.cz_-mz)<0.01)
            const rM=masts.find(m=>Math.abs(m.rx-rightMastX)<0.01&&Math.abs(m.cz_-mz)<0.01)
            if(!lM||!rM) continue
            const wy=lM.top.ty*(1-tX)+rM.top.ty*tX
            pts.push(new THREE.Vector3(wx,wy,mz))
          }
          if(pts.length>1) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),subWire))
        }
      }

      // ── 홉 & V자 유인줄 ──────────────────────────
      // 두둑마다, 마스트 구간(Z)마다 홉 배치
      // 유인줄: 홉 → 해당 두둑의 좌우 보조 유인 와이어로 V자 연결
      for(const ridgeX of ridgeXs){
        if(ridgeX>lastMastX+0.01) break

        // 이 두둑의 유인 와이어 X 위치 계산
        const mastIdx=mastXs.findIndex(mx=>Math.abs(mx-ridgeX)<0.01)
        const isMast=mastIdx>=0
        const isFirst=mastIdx===0
        const isLast=isMast&&(mastIdx===mastXs.length-1||(mastXs[mastIdx+1]??999)>lastMastX+0.01)

        // 유인줄 거치 X 위치 (보조 와이어와 동일 로직)
        const mastIdx2=mastXs.findIndex(mx=>Math.abs(mx-ridgeX)<0.01)
        const isFirst2=mastIdx2===0
        const isLast2=mastIdx2>=0&&(mastIdx2===mastXs.length-1||(mastXs[mastIdx2+1]??999)>lastMastX+0.01)
        const wireXsRaw:number[]=[]
        if(IS_I_TYPE){
          // I자형: 두둑 중앙 1줄 → 유인줄도 1줄
          wireXsRaw.push(ridgeX)
        } else {
          // V자형
          if(isFirst2)     wireXsRaw.push(ridgeX, ridgeX+WIRE_OFF)
          else if(isLast2) wireXsRaw.push(ridgeX-WIRE_OFF, ridgeX)
          else             wireXsRaw.push(ridgeX-WIRE_OFF, ridgeX+WIRE_OFF)
        }
        const validWireXs=wireXsRaw.filter(wx=>wx>=0&&wx<=lastMastX)

        // 높이 보간용 인접 마스트
        const leftMastX =mastXs.filter(mx=>mx<=ridgeX).at(-1)??mastXs[0]
        const rightMastX=mastXs.filter(mx=>mx> ridgeX)[0]??mastXs[mastXs.length-1]
        const tX=leftMastX===rightMastX?0:(ridgeX-leftMastX)/(rightMastX-leftMastX)

        for(let ci=0;ci<mastZs.length-1;ci++){
          const z0=mastZs[ci], z1=mastZs[ci+1]
          if(z1>lastMastZ+0.01) break

          const hopZs:number[]=[]
          for(let hz=z0+HOP_OFFSET;hz<z1-HOP_OFFSET+0.01;hz+=HOP_INTERVAL) hopZs.push(hz)

          // 홉 총 개수 제한 (3000개 초과시 스킵 — 성능)
          const totalHops=ridgeXs.filter(rx=>rx<=lastMastX+0.01).length*(mastZs.length-1)*hopZs.length
          const skipHop=totalHops>3000
          for(const hz of hopZs){
            // 홉 식물
            if(skipHop) continue
            const hopH=0.25+Math.random()*0.15
            const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.04,hopH,6),stemMat)
            stem.position.set(ridgeX,hopH/2,hz);stem.castShadow=true;scene.add(stem)
            const ball=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,6),hopMat)
            ball.position.set(ridgeX,hopH+0.05,hz);ball.castShadow=true;scene.add(ball)

            // 이 z 위치에서 보조 와이어 높이 보간
            const tZ=(hz-z0)/POLE_SPACING
            const lM0=masts.find(m=>Math.abs(m.rx-leftMastX)<0.01&&Math.abs(m.cz_-z0)<0.01)
            const lM1=masts.find(m=>Math.abs(m.rx-leftMastX)<0.01&&Math.abs(m.cz_-z1)<0.01)
            const rM0=masts.find(m=>Math.abs(m.rx-rightMastX)<0.01&&Math.abs(m.cz_-z0)<0.01)
            const rM1=masts.find(m=>Math.abs(m.rx-rightMastX)<0.01&&Math.abs(m.cz_-z1)<0.01)
            if(!lM0||!lM1||!rM0||!rM1) continue

            const lWy=lM0.top.ty*(1-tZ)+lM1.top.ty*tZ
            const rWy=rM0.top.ty*(1-tZ)+rM1.top.ty*tZ
            // 이 두둑 위치에서의 보조 와이어 높이 (좌우 마스트 보간)
            const wireWy=lWy*(1-tX)+rWy*tX

            const hopTop=new THREE.Vector3(ridgeX,hopH+0.05,hz)

            // V자 유인줄 — 홉 → 해당 두둑의 유인 와이어로
            for(const wx of validWireXs){
              const target=new THREE.Vector3(wx,wireWy,hz)
              scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([hopTop,target]),yarnMat))
            }
          }
        }
      }

      // ── 격자 ──────────────────────────────────────
      const grid=new THREE.GridHelper(Math.max(lastMastX,lastMastZ)*8,80,0xA5D6A7,0xC8E6C9)
      grid.position.set(cx,-0.015,cz)
      const gm=grid.material as THREETypes.LineBasicMaterial
      gm.opacity=0.2;gm.transparent=true;scene.add(grid)
    }
    build()
  },[inputs,quantities,profileId])

  return (
    <CanvasWrapper ref={containerRef}>
      <BottomHint>🖱️ 드래그 — 회전 &nbsp;|&nbsp; 방향키 — 이동 &nbsp;|&nbsp; 휠 — 줌</BottomHint>
      <TopLabel>
        🌿 {profileId === 'US_HIGH_TRELLIS' ? 'North America 18 ft reference' : 'Korea steel trellis'}
      </TopLabel>
    </CanvasWrapper>
  )
}
