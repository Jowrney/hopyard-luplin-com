import type { PriceMap } from '@/types'

export interface ReferenceMaterial {
  id: string
  code: string
  name: string
  spec: string | null
  unit: string
  unitPrice: number
  isActive: true
  sortOrder: number
  metadata: Record<string, unknown> | null
}

export interface ReferenceMaterialCategory {
  id: number
  code: 'POLE' | 'WIRE' | 'ANCHOR' | 'CLIP'
  name: string
  sortOrder: number
  materials: readonly ReferenceMaterial[]
}

export interface ReferenceVariety {
  id: string
  code: string
  name: string
  nameKo: string | null
  characteristics: string | null
  unitPrice: number
  recommendedSpacingM: number
  isActive: true
  isOwnBrand: boolean
}

const material = (
  category: string,
  sortOrder: number,
  code: string,
  name: string,
  spec: string | null,
  unit: string,
  unitPrice: number,
  metadata: Record<string, unknown> | null = null,
): ReferenceMaterial => ({
  id: `reference-${category.toLowerCase()}-${sortOrder}`,
  code,
  name,
  spec,
  unit,
  unitPrice,
  isActive: true,
  sortOrder,
  metadata,
})

export const REFERENCE_MATERIAL_CATEGORIES: readonly ReferenceMaterialCategory[] = [
  {
    id: 1,
    code: 'POLE',
    name: '폴(지주)',
    sortOrder: 1,
    materials: [
      material('pole', 1, 'POLE_STEEL_60_2T_6M', '강관 60mm 2T × 6m', '아연도금 강관', '개', 35_000, { length_m: 6, diameter_mm: 60, thickness_mm: 2, effective_height_m: 5.1 }),
      material('pole', 2, 'POLE_STEEL_60_2T_9M', '강관 60mm 2T × 9m', '특주', '개', 52_000, { length_m: 9, diameter_mm: 60, thickness_mm: 2, effective_height_m: 7.5 }),
      material('pole', 3, 'POLE_WOOD_H4_100_6M', '방부목 H4 100×100 × 6m', 'CCA처리', '개', 28_000, { length_m: 6, section_mm: 100, effective_height_m: 4.9 }),
      material('pole', 4, 'POLE_WOOD_H4_120_6M', '방부목 H4 120×120 × 6m', 'CCA처리', '개', 38_000, { length_m: 6, section_mm: 120, effective_height_m: 4.9 }),
      material('pole', 5, 'POLE_PC_9M', 'PC전봇대 9m', '중고', '개', 45_000, { length_m: 9, effective_height_m: 7.5 }),
      material('pole', 6, 'POLE_PC_12M', 'PC전봇대 12m', '중고', '개', 65_000, { length_m: 12, effective_height_m: 10.5 }),
    ],
  },
  {
    id: 2,
    code: 'WIRE',
    name: '와이어',
    sortOrder: 2,
    materials: [
      material('wire', 1, 'WIRE_25MM', '스틸와이어 Φ2.5mm', '고장력강', 'm', 380, { diameter_mm: 2.5, tensile_strength_kn: 15.2 }),
      material('wire', 2, 'WIRE_32MM', '스틸와이어 Φ3.2mm', '고장력강', 'm', 520, { diameter_mm: 3.2, tensile_strength_kn: 24.8 }),
      material('wire', 3, 'WIRE_40MM', '스틸와이어 Φ4.0mm', '고장력강', 'm', 780, { diameter_mm: 4, tensile_strength_kn: 38.6 }),
      material('wire', 4, 'WIRE_50MM', '스틸와이어 Φ5.0mm', '고장력강', 'm', 1_100, { diameter_mm: 5, tensile_strength_kn: 60.4 }),
      material('wire', 5, 'WIRE_COIR_3MM', '코이어 로프 Φ3mm', '생분해', 'm', 650, { diameter_mm: 3, tensile_strength_kn: null }),
    ],
  },
  {
    id: 3,
    code: 'ANCHOR',
    name: '앵커',
    sortOrder: 3,
    materials: [
      material('anchor', 1, 'ANCHOR_SCREW_600', '나사말뚝 앵커 L600mm', 'L600mm', '개', 8_500),
      material('anchor', 2, 'ANCHOR_SCREW_900', '나사말뚝 앵커 L900mm', 'L900mm', '개', 12_000),
      material('anchor', 3, 'ANCHOR_CONCRETE', '콘크리트 앵커 기초블록', '기초블록', '개', 15_000),
    ],
  },
  {
    id: 4,
    code: 'CLIP',
    name: '연결부속',
    sortOrder: 4,
    materials: [
      material('clip', 1, 'CLIP_U_BOLT', 'U볼트 클램프', '60mm용', '개', 1_200),
      material('clip', 2, 'CLIP_WIRE_GRIP', '와이어그립', '3.2mm용', '개', 800),
      material('clip', 3, 'CLIP_TURNBUCKLE', '턴버클', 'M10', '개', 3_500),
      material('clip', 4, 'EYE_BOLT', '아이볼트', 'M12', '개', 2_200),
    ],
  },
]

export const REFERENCE_VARIETIES: readonly ReferenceVariety[] = [
  { id: 'reference-variety-1', code: 'HOP_CASCADE', name: 'Cascade', nameKo: '캐스케이드', characteristics: '감귤·꽃향, 범용성', unitPrice: 8_000, recommendedSpacingM: 1.2, isActive: true, isOwnBrand: false },
  { id: 'reference-variety-2', code: 'HOP_CENTENNIAL', name: 'Centennial', nameKo: '센테니얼', characteristics: '쓴맛과 시트러스 향', unitPrice: 9_000, recommendedSpacingM: 1.2, isActive: true, isOwnBrand: false },
  { id: 'reference-variety-3', code: 'HOP_CITRA', name: 'Citra', nameKo: '시트라', characteristics: '열대과일향', unitPrice: 12_000, recommendedSpacingM: 1.2, isActive: true, isOwnBrand: false },
  { id: 'reference-variety-4', code: 'HOP_CHINOOK', name: 'Chinook', nameKo: '치누크', characteristics: '송진·향신료 향', unitPrice: 9_500, recommendedSpacingM: 1.2, isActive: true, isOwnBrand: false },
  { id: 'reference-variety-5', code: 'HOP_FUGGLES', name: 'Fuggles', nameKo: '퍼글스', characteristics: '흙향, 전통 에일', unitPrice: 8_500, recommendedSpacingM: 1, isActive: true, isOwnBrand: false },
  { id: 'reference-variety-6', code: 'HOP_HALLERTAU', name: 'Hallertau', nameKo: '할러타우', characteristics: '라거용 노블 홉', unitPrice: 11_000, recommendedSpacingM: 1.2, isActive: true, isOwnBrand: false },
  { id: 'reference-variety-7', code: 'HOP_EDEN_01', name: '홉이든 1호', nameKo: '홉이든 1호', characteristics: '자체 육종, 국내 기후 적응', unitPrice: 15_000, recommendedSpacingM: 1.2, isActive: true, isOwnBrand: true },
]

export function getReferencePriceMap(): PriceMap {
  const prices: PriceMap = {}
  for (const category of REFERENCE_MATERIAL_CATEGORIES) {
    for (const item of category.materials) prices[item.code] = item.unitPrice
  }
  for (const variety of REFERENCE_VARIETIES) prices[variety.code] = variety.unitPrice
  return prices
}
