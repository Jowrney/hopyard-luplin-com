// lib/calculations/estimate.ts
// 비용 계산 순수 함수 — 03_계산로직_명세.md 기준
// 핵심 세금 처리:
//   - 자재비 + 시공비(인건비): 과세 (부가세 10%)
//   - 종근(씨앗)비: 농업용 면세 — 부가세 미적용

import type { EstimateLineItem, EstimateResult, PriceMap, QuantityResult } from '@/types'
import type { LaborCosts } from '@/stores/designStore'

/** 금액 포맷 (₩1,250,000) */
export function formatKRW(n: number | undefined | null): string {
  return `₩${(n ?? 0).toLocaleString('ko-KR')}`
}

// ── 시공비 단가 (DB에 없으면 기본값 사용) ──────────────
const LABOR_DEFAULTS: Record<string, number> = {
  LABOR_POLE_INSTALL:    12_000,  // 폴 설치 (개당)
  LABOR_WIRE_INSTALL:    35_000,  // 와이어 설치 (100m당)
  LABOR_ANCHOR_INSTALL:   8_000,  // 앵커 설치 (개당)
  LABOR_RHIZOME_PLANT:    2_500,  // 종근 식재 (주당)
}

interface EstimateParams {
  quantities:      QuantityResult
  prices:          PriceMap
  poleCode:        string
  wireCode:        string
  anchorCode:      string
  varietyCode:     string
  varietyUnitPrice: number
  includeLabor:    boolean   // 시공비(인건비) 포함 여부
  includeVat:      boolean   // 부가세 포함 여부
  laborCosts?:     LaborCosts // 수동 입력 시공비
  totalVarietyQty?: number   // 품종별 수량 합계 (미입력 시 plantCount 사용)
  seedTotal?:       number   // 품종별 종자비 합계 (직접 전달 시 우선 사용)
  discountAmount?:  number   // 할인 금액 (양수 입력 → 차감)
}

export function calculateEstimate(params: EstimateParams): EstimateResult {
  const {
    quantities, prices,
    poleCode, wireCode, anchorCode,
    varietyCode, varietyUnitPrice,
    includeLabor, includeVat,
    laborCosts,
    totalVarietyQty,
    seedTotal,
    discountAmount,
  } = params

  const breakdown: EstimateLineItem[] = []
  let materialCost = 0
  let laborCost    = 0
  let seedCost     = 0

  const getPrice = (code: string, fallback = 0) => prices[code] ?? fallback

  // ── 1. 자재비 ─────────────────────────────────────
  // 폴
  const polePrice = getPrice(poleCode)
  if (polePrice > 0 && quantities.totalPoleCount > 0) {
    const total = polePrice * quantities.totalPoleCount
    materialCost += total
    breakdown.push({
      category: '자재비', code: poleCode,
      name: `폴 (${poleCode})`,
      quantity: quantities.totalPoleCount, unit: '개',
      unitPrice: polePrice, totalPrice: total,
    })
  }

  // 와이어
  const wirePrice = getPrice(wireCode)
  if (wirePrice > 0 && quantities.totalWireM > 0) {
    const total = wirePrice * quantities.totalWireM
    materialCost += total
    breakdown.push({
      category: '자재비', code: wireCode,
      name: `와이어 (${wireCode})`,
      quantity: quantities.totalWireM, unit: 'm',
      unitPrice: wirePrice, totalPrice: total,
    })
  }

  // 앵커
  const anchorPrice = getPrice(anchorCode)
  if (anchorPrice > 0 && quantities.anchorCount > 0) {
    const total = anchorPrice * quantities.anchorCount
    materialCost += total
    breakdown.push({
      category: '자재비', code: anchorCode,
      name: `앵커 (${anchorCode})`,
      quantity: quantities.anchorCount, unit: '개',
      unitPrice: anchorPrice, totalPrice: total,
    })
  }

  // 연결부속 (폴 수량 × 1.2 × 클립 단가)
  const clipPrice = getPrice('CLIP_U_BOLT', 1_200)
  if (clipPrice > 0 && quantities.totalPoleCount > 0) {
    const clipQty = Math.ceil(quantities.totalPoleCount * 1.2)
    const total   = clipPrice * clipQty
    materialCost += total
    breakdown.push({
      category: '자재비', code: 'CLIP_U_BOLT',
      name: '연결부속 (U볼트 클램프)',
      quantity: clipQty, unit: '개',
      unitPrice: clipPrice, totalPrice: total,
    })
  }

  // ── 2. 시공비 (인건비) — 수동 입력값 사용 ────────
  if (includeLabor && laborCosts) {
    const items = [
      { code: 'LABOR_MANUAL_LABOR',     name: '인건비',  amount: laborCosts.laborFee },
      { code: 'LABOR_MANUAL_EQUIPMENT', name: '장비대',  amount: laborCosts.equipmentFee },
      { code: 'LABOR_MANUAL_PLANTING',  name: '식재비',  amount: laborCosts.plantingFee },
      { code: 'LABOR_MANUAL_ETC',       name: '기타',    amount: laborCosts.etcFee },
    ]
    for (const item of items) {
      if (item.amount > 0) {
        laborCost += item.amount
        breakdown.push({
          category: '시공비', code: item.code,
          name: item.name,
          quantity: 1, unit: '식',
          unitPrice: item.amount, totalPrice: item.amount,
        })
      }
    }
  }

  // ── 3. 종자비 (면세 품목) ──────────────────────────
  // seedTotal이 직접 전달된 경우 우선 사용 (품종별 수량 × 단가 합계)
  if (seedTotal !== undefined && seedTotal > 0) {
    const qty = totalVarietyQty ?? quantities.plantCount
    seedCost = seedTotal
    breakdown.push({
      category: '종자비', code: varietyCode,
      name: '종근 (복수 품종 포함) — 면세',
      quantity: qty, unit: '주',
      unitPrice: qty > 0 ? Math.round(seedTotal / qty) : 0,
      totalPrice: seedTotal,
    })
  } else {
    // 단일 품종 또는 기본값
    const rhizomeUnitPrice = varietyUnitPrice > 0
      ? varietyUnitPrice
      : getPrice(varietyCode, 8_000)
    const qty = totalVarietyQty ?? quantities.plantCount
    if (rhizomeUnitPrice > 0 && qty > 0) {
      const total = rhizomeUnitPrice * qty
      seedCost += total
      breakdown.push({
        category: '종자비', code: varietyCode,
        name: `종근 (${varietyCode}) — 면세`,
        quantity: qty, unit: '주',
        unitPrice: rhizomeUnitPrice, totalPrice: total,
      })
    }
  }

  // ── 4. 세금 계산 ───────────────────────────────────
  // 과세 대상: 자재비 + 시공비(인건비)
  // 면세 대상: 종자비(종근)
  // ── 4. 할인 ─────────────────────────────────────────
  const discount = discountAmount && discountAmount > 0 ? discountAmount : 0

  // ── 5. 세금 계산 ──────────────────────────────────────
  const taxableAmount = materialCost + laborCost
  const vat = includeVat ? Math.round(taxableAmount * 0.1) : 0

  const subtotal = materialCost + laborCost + seedCost
  const total    = subtotal + vat - discount

  return {
    materialCost,
    laborCost,
    seedCost,
    subtotal,
    vat,
    discount,
    total,
    breakdown,
  }
}
