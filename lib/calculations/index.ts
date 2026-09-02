// types/index.ts
// HOPEDEN Designer — 공통 타입 정의

// ─────────────────────────────────────────
// Enums (Prisma enum 동기화)
// ─────────────────────────────────────────
export type UserRole = 'FARMER' | 'ADMIN' | 'SUPER'
export type SafetyStatus = 'GREEN' | 'YELLOW' | 'RED'
export type WindRegion = 'INLAND' | 'SEOUL' | 'GANGWON' | 'COASTAL' | 'JEJU'

// ─────────────────────────────────────────
// 자재 관련
// ─────────────────────────────────────────
export interface MaterialCategory {
  id: number
  code: string
  name: string
  sortOrder: number
}

export interface Material {
  id: string
  code: string
  categoryId: number
  category?: MaterialCategory
  name: string
  spec: string | null
  unit: string
  unitPrice: number
  isActive: boolean
  sortOrder: number
  metadata: PoleMetadata | WireMetadata | AnchorMetadata | LaborMetadata | null
  createdAt: Date
  updatedAt: Date
}

// 폴 메타데이터
export interface PoleMetadata {
  length_m: number
  diameter_mm: number | null
  thickness_mm?: number
  section_mm?: number
  effective_height_m: number
  recommended_spacing_m: number
  durability_years: number
  burial_depth_m: number
}

// 와이어 메타데이터
export interface WireMetadata {
  diameter_mm: number
  tensile_strength_kn: number | null
  biodegradable?: boolean
}

// 앵커 메타데이터
export interface AnchorMetadata {
  length_mm?: number
  soil_type: string[]
}

// 시공비 메타데이터
export interface LaborMetadata {
  includes: string[]
}

// ─────────────────────────────────────────
// 홉 품종
// ─────────────────────────────────────────
export interface HopVariety {
  id: string
  code: string
  name: string
  nameKo: string | null
  characteristics: string | null
  unitPrice: number
  recommendedSpacingM: number
  isActive: boolean
  isOwnBrand: boolean
}

// ─────────────────────────────────────────
// 설계 관련
// ─────────────────────────────────────────
export interface DesignInputs {
  widthM: number           // 농장 가로 (m)
  heightM: number          // 농장 세로 (m)
  rowSpacingM: number      // 행간 (m)
  plantSpacingM: number    // 주간 (m)
  poleSpacingM: number     // 폴 간격 (m)
  wireRows: number         // 와이어 단수
  poleEffectiveHeightM: number // 폴 유효 높이 (m)
  region: WindRegion       // 지역
}

export interface QuantityResult {
  rowCount: number         // 총 행 수
  polesPerRow: number      // 행당 폴 수
  innerPoleCount: number   // 내부 폴 수
  outerPoleCount: number   // 외부 폴 수 (코너+중간)
  totalPoleCount: number   // 총 폴 수
  horizontalWireM: number  // 수평 와이어 길이 (m)
  verticalWireM: number    // 수직 와이어 길이 (m)
  totalWireM: number       // 총 와이어 길이 (여유율 포함, m)
  anchorCount: number      // 앵커 수
  plantCount: number       // 총 주수
  rhizomeCount: number     // 종근 수량 (10% 예비 포함)
}

export interface LoadResult {
  hopLoadKNPerM: number    // 홉 단위 하중 (kN/m)
  hopLoadKN: number        // 행당 홉 하중 (kN)
  windSpeedMs: number      // 설계풍속 (m/s)
  windPressureKNm2: number // 풍압 (kN/m²)
  windLoadKN: number       // 풍하중 (kN)
  totalLoadKN: number      // 총 하중 (kN)
  designTensionKN: number  // 설계 인장력 (kN, 안전율 1.5 적용)
  safetyStatus: SafetyStatus
  recommendedWireDiameterMM: number // 권장 와이어 직경
}

export interface EstimateLineItem {
  category: string
  code: string
  name: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

export interface EstimateResult {
  materialCost: number
  laborCost: number
  seedCost: number
  subtotal: number
  vat: number
  total: number
  breakdown: EstimateLineItem[]
}

// 가격 맵 (DB → 프론트 캐시)
export type PriceMap = Record<string, number> // code → unitPrice

// ─────────────────────────────────────────
// API 응답 공통 타입
// ─────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ─────────────────────────────────────────
// Zustand 스토어 타입
// ─────────────────────────────────────────
export interface DesignState {
  // 설계 입력값
  inputs: DesignInputs

  // 선택된 자재
  selectedPoleCode: string
  selectedWireCode: string
  selectedAnchorCode: string
  selectedVarietyCode: string

  // 계산 결과
  quantities: QuantityResult | null
  loads: LoadResult | null
  estimate: EstimateResult | null

  // UI 상태
  isCalculating: boolean
  activeView: '2d' | '3d'

  // Actions
  updateInputs: (partial: Partial<DesignInputs>) => void
  setSelectedPole: (code: string) => void
  setSelectedWire: (code: string) => void
  setSelectedAnchor: (code: string) => void
  setSelectedVariety: (code: string) => void
  recalculate: () => void
  setActiveView: (view: '2d' | '3d') => void
}

export interface PriceStoreState {
  prices: PriceMap
  lastFetchedAt: Date | null
  isLoading: boolean
  fetchPrices: () => Promise<void>
  getPrice: (code: string) => number
}
