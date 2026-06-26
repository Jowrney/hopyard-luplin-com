// types/index.ts
export type UserRole = 'FARMER' | 'ADMIN' | 'SUPER'
export type SafetyStatus = 'GREEN' | 'YELLOW' | 'RED'
export type WindRegion = 'INLAND' | 'SEOUL' | 'GANGWON' | 'COASTAL' | 'JEJU'
export type TrainingType = 'V' | 'I'

export interface DesignInputs {
  widthM: number
  heightM: number
  rowSpacingM: number
  plantSpacingM: number
  poleSpacingM: number
  wireRows: number
  poleEffectiveHeightM: number
  region: WindRegion
  trainingType: TrainingType  // 유인방식: V자형 | I자형
}

export interface QuantityResult {
  rowCount: number
  polesPerRow: number
  innerPoleCount: number
  outerPoleCount: number
  totalPoleCount: number
  horizontalWireM: number
  verticalWireM: number
  totalWireM: number
  anchorCount: number
  plantCount: number
  rhizomeCount: number
}

export interface LoadResult {
  hopLoadKNPerM: number
  hopLoadKN: number
  windSpeedMs: number
  windPressureKNm2: number
  windLoadKN: number
  totalLoadKN: number
  designTensionKN: number
  safetyStatus: SafetyStatus
  recommendedWireDiameterMM: number
  currentAllowableTensionKN: number  // 현재 선택 와이어 허용 인장력
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
  discount: number
  total: number
  breakdown: EstimateLineItem[]
}

export type PriceMap = Record<string, number>

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PriceStoreState {
  prices: PriceMap
  lastFetchedAt: Date | null
  isLoading: boolean
  fetchPrices: () => Promise<void>
  getPrice: (code: string) => number
}
