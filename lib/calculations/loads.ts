// lib/calculations/loads.ts
import type { DesignInputs, LoadResult, QuantityResult, SafetyStatus, WindRegion } from '@/types'

const WIND_SPEED_MAP: Record<WindRegion, number> = {
  INLAND: 24, SEOUL: 26, GANGWON: 30, COASTAL: 35, JEJU: 40,
}

export const WIRE_TENSILE_MAP: Record<number, number> = {
  2.5: 15.2, 3.2: 24.8, 4.0: 38.6, 5.0: 60.4,
}

export const WIRE_CODE_TO_DIAMETER: Record<string, number> = {
  WIRE_25MM: 2.5, WIRE_32MM: 3.2, WIRE_40MM: 4.0, WIRE_50MM: 5.0,
}

export const WIRE_DIAMETER_TO_CODE: Record<number, string> = {
  2.5: 'WIRE_25MM', 3.2: 'WIRE_32MM', 4.0: 'WIRE_40MM', 5.0: 'WIRE_50MM',
}

const HOP_UNIT_WEIGHT_KG_PER_M = 1.8
const GRAVITY = 9.81
const AIR_DENSITY = 1.225
const Kz = 1.0, Kzt = 1.0, Kd = 0.85, Cf = 1.3
const HOP_VINE_WIDTH_M = 0.5
const SAFETY_FACTOR = 1.5

export function calculateLoad(
  inputs: DesignInputs,
  quantities: QuantityResult,
  selectedWireCode?: string
): LoadResult {
  const { region, heightM } = inputs

  // ── 하중은 와이어 1줄(1행) 기준으로 계산 ──────────────
  // rowCount를 곱하면 전체 농장 하중이 되어 와이어 1줄 설계와 맞지 않음

  // 1. 홉 생체중 하중 (1행 기준)
  const hopLoadKNPerM = (HOP_UNIT_WEIGHT_KG_PER_M * GRAVITY) / 1000
  const hopLoadKN = hopLoadKNPerM * heightM  // 행 길이(세로) 기준

  // 2. 풍압 하중 (1행 기준)
  const V0 = WIND_SPEED_MAP[region]
  const windSpeedMs = V0 * Kz * Kzt * Kd
  const windPressureKNm2 = 0.5 * AIR_DENSITY * Math.pow(windSpeedMs, 2) / 1000
  const windAreaM2 = heightM * HOP_VINE_WIDTH_M  // 행 1줄의 수풍면적
  const windLoadKN = windPressureKNm2 * windAreaM2 * Cf

  // 3. 설계 인장력
  const totalLoadKN = hopLoadKN + windLoadKN
  const designTensionKN = totalLoadKN * SAFETY_FACTOR

  // 4. 안전성 판정
  const selectedDiameter = selectedWireCode ? WIRE_CODE_TO_DIAMETER[selectedWireCode] : undefined
  const { safetyStatus, recommendedWireDiameterMM, currentAllowableTensionKN } =
    evaluateSafety(designTensionKN, selectedDiameter)

  return {
    hopLoadKNPerM, hopLoadKN, windSpeedMs, windPressureKNm2, windLoadKN,
    totalLoadKN, designTensionKN, safetyStatus, recommendedWireDiameterMM,
    currentAllowableTensionKN,
  }
}

function evaluateSafety(
  designTensionKN: number,
  selectedWireDiameterMM?: number
): {
  safetyStatus: SafetyStatus
  recommendedWireDiameterMM: number
  currentAllowableTensionKN: number
} {
  const diameters = [2.5, 3.2, 4.0, 5.0] as const

  // 권장 와이어 — 최소 충분한 것
  let recommendedWireDiameterMM = 5.0
  for (const d of diameters) {
    const a = WIRE_TENSILE_MAP[d]
    if (designTensionKN < a * 0.70 || designTensionKN < a * 0.90) {
      recommendedWireDiameterMM = d
      break
    }
  }

  // 현재 선택 와이어로 안전성 판정
  if (selectedWireDiameterMM && WIRE_TENSILE_MAP[selectedWireDiameterMM]) {
    const allowable = WIRE_TENSILE_MAP[selectedWireDiameterMM]
    let safetyStatus: SafetyStatus = 'RED'
    if (designTensionKN < allowable * 0.70)      safetyStatus = 'GREEN'
    else if (designTensionKN < allowable * 0.90) safetyStatus = 'YELLOW'
    return { safetyStatus, recommendedWireDiameterMM, currentAllowableTensionKN: allowable }
  }

  // 선택 없으면 최적 기준
  let safetyStatus: SafetyStatus = 'RED'
  let currentAllowableTensionKN = WIRE_TENSILE_MAP[5.0]
  for (const d of diameters) {
    const a = WIRE_TENSILE_MAP[d]
    if (designTensionKN < a * 0.70) {
      recommendedWireDiameterMM = d; safetyStatus = 'GREEN'; currentAllowableTensionKN = a; break
    } else if (designTensionKN < a * 0.90) {
      recommendedWireDiameterMM = d; safetyStatus = 'YELLOW'; currentAllowableTensionKN = a; break
    }
  }
  return { safetyStatus, recommendedWireDiameterMM, currentAllowableTensionKN }
}

export function getRegionLabel(region: WindRegion): string {
  const labels: Record<WindRegion, string> = {
    INLAND: '내륙 일반', SEOUL: '서울/경기', GANGWON: '강원 산간',
    COASTAL: '부산/경남 해안', JEJU: '제주',
  }
  return labels[region]
}
export function getWireTensileStrength(diameterMM: number): number { return WIRE_TENSILE_MAP[diameterMM] ?? 0 }
export function getSafetyLabel(status: SafetyStatus): string {
  return { GREEN: '✅ 안전', YELLOW: '⚠️ 주의', RED: '🚨 위험' }[status]
}
