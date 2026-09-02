// lib/calculations/quantities.ts
// 수량 계산 순수 함수 — 홉이든 한국형 표준 지주 설계 기준

import type { DesignInputs, QuantityResult } from '@/types'

export function calculateQuantities(inputs: DesignInputs): QuantityResult {
  const {
    widthM: _w,
    heightM: _h,
    rowSpacingM: _rs,
    plantSpacingM: _ps,
    poleSpacingM: _poleS,
    poleEffectiveHeightM,
    trainingType,
  } = inputs

  // 안전 범위 클램핑 — 0이나 극단값 방지
  const widthM       = Math.max(10, Math.min(500, _w))
  const heightM      = Math.max(10, Math.min(500, _h))
  const rowSpacingM  = Math.max(1,  Math.min(20,  _rs))
  const plantSpacingM= Math.max(0.5,Math.min(5,   _ps))
  const poleSpacingM = Math.max(2,  Math.min(50,  _poleS))

  const MAST_SPAN = rowSpacingM * 3  // 마스트 행 간격 = 두둑 간격 × 3 = 10.5m
  const HOP_OFFSET = 0.5             // 폴에서 첫 홉까지 거리
  const WIRE_OFF = 0.8               // 유인 와이어 좌우 간격

  // ── 마스트 수량 ──────────────────────────────────
  // 마스트 행 수 (가로 방향, 10.5m 간격)
  const mastRowCount = Math.floor(widthM / MAST_SPAN) + 1
  // 마스트 열 수 (세로 방향, 8m 간격)
  const mastColCount = Math.floor(heightM / poleSpacingM) + 1

  // 마스트 범위 (실제 땅 크기)
  const lastMastX = (mastRowCount - 1) * MAST_SPAN
  const lastMastZ = (mastColCount - 1) * poleSpacingM

  // 외곽 마스트 (경사 폴 + 앵커): 첫행/끝행/첫열/끝열
  const outerPoleCount =
    mastRowCount * 2 +            // 첫열 + 끝열
    (mastColCount - 2) * 2        // 첫행/끝행 중간 (코너 제외)

  // 내부 마스트 (수직 폴)
  const innerMastCount = (mastRowCount - 2) * (mastColCount - 2)

  // 전체 마스트 수
  const totalPoleCount = mastRowCount * mastColCount

  // ── 두둑 수량 ─────────────────────────────────────
  // 두둑은 땅(lastMastX) 범위 안, 3.5m 간격
  const ridgeCount = Math.floor(lastMastX / rowSpacingM) + 1

  // ── 홉 수량 ──────────────────────────────────────
  // 각 두둑 × 각 마스트 구간 × 구간당 홉 수
  // 구간당 홉: 0.5 시작, 1m 간격 → floor((POLE_SPACING - 2*HOP_OFFSET) / plantSpacingM) + 1
  const hopsPerSpan = Math.floor((poleSpacingM - 2 * HOP_OFFSET) / plantSpacingM) + 1
  const mastSpanCount = mastColCount - 1  // 마스트 구간 수
  const plantCount = ridgeCount * mastSpanCount * hopsPerSpan

  // 10% 예비분 포함
  const rhizomeCount = plantCount  // 예비분 미포함, 실제 식재 수량과 동일

  // ── 와이어 길이 계산 ──────────────────────────────
  // 상단 메인 와이어: 마스트 열 방향 × 마스트 행 수 + 마스트 행 방향 × 마스트 열 수
  const mainWireM =
    mastColCount * lastMastX +   // Z 방향 연결 (열)
    mastRowCount * lastMastZ     // X 방향 연결 (행)

  // 보조 유인 와이어: I자형은 두둑 중앙 1줄, V자형은 좌우 2줄
  const subWirePerRidge = trainingType === 'I' ? 1 : 2
  const subWireM = ridgeCount * subWirePerRidge * lastMastZ

  // 앵커 와이어: 각 외곽 마스트에서 바깥 앵커로
  const anchorWireM = outerPoleCount * MAST_SPAN * 0.4 * 1.2 // 앵커 거리 × 여유

  // 유인줄 (yarn): I자형은 홉당 1줄, V자형은 홉당 2줄
  const twinesPerPlant = trainingType === 'I' ? 1 : 2
  const yarnWireM = plantCount * twinesPerPlant * poleEffectiveHeightM * 1.1

  const WIRE_MARGIN = 1.05
  const horizontalWireM = Math.ceil((mainWireM + subWireM + anchorWireM) * WIRE_MARGIN)
  const verticalWireM   = Math.ceil(yarnWireM)
  const totalWireM      = horizontalWireM + verticalWireM

  // ── 앵커 수량 ─────────────────────────────────────
  // 외곽 마스트 수 = 앵커 수 (마스트 위치 = 앵커 위치)
  const anchorCount = outerPoleCount

  // ── rowCount/polesPerRow (도면 렌더용) ─────────────
  const rowCount   = mastRowCount
  const polesPerRow = mastColCount

  return {
    rowCount,
    polesPerRow,
    innerPoleCount: innerMastCount,
    outerPoleCount,
    totalPoleCount,
    horizontalWireM,
    verticalWireM,
    totalWireM,
    anchorCount,
    plantCount,
    rhizomeCount,
  }
}

export function m2ToPyeong(areaM2: number): number {
  return Math.round((areaM2 / 3.3058) * 10) / 10
}

export function getStandardPlantCount(areaM2: number, spacingM = 1.2): number {
  return Math.floor(areaM2 / (spacingM * spacingM))
}
