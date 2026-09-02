// stores/designStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { calculateQuantities } from '@/lib/calculations/quantities'
import { calculateLoad } from '@/lib/calculations/loads'
import { calculateEstimate } from '@/lib/calculations/estimate'
import type { DesignInputs, EstimateResult, LoadResult, QuantityResult, WindRegion, TrainingType } from '@/types'
import { getRegionalProfile, type RegionalProfileId } from '@/lib/design/regional-profiles'

export interface LaborCosts {
  laborFee:     number  // 인건비 (원)
  equipmentFee: number  // 장비대 (원)
  plantingFee:  number  // 식재비 (원)
  etcFee:       number  // 기타 (원)
}

export interface VarietySeedInfo {
  seedTotal:       number  // 품종별 종자비 합계
  totalVarietyQty: number  // 품종별 수량 합계
}

export const DEFAULT_LABOR_COSTS: LaborCosts = {
  laborFee:     0,
  equipmentFee: 0,
  plantingFee:  0,
  etcFee:       0,
}
import { usePriceStore } from './priceStore'

const DEFAULT_INPUTS: DesignInputs = {
  widthM: 60,            // 가로 60m — 1천평 기준
  heightM: 60,           // 세로 60m
  rowSpacingM: 3.5,      // 두둑 간격 3.5m
  plantSpacingM: 1.0,    // 홉 간격 1m
  poleSpacingM: 8.0,     // 마스트 측면 간격 8m
  wireRows: 1,           // 상단 와이어만
  poleEffectiveHeightM: 5.5,
  region: 'INLAND' as WindRegion,
  trainingType: 'V' as TrainingType,
}

interface DesignStore {
  profileId: RegionalProfileId
  inputs: DesignInputs
  selectedPoleCode: string
  selectedWireCode: string
  selectedAnchorCode: string
  selectedVarietyCode: string
  varietyUnitPrice: number
  currentDesignId: string | null   // 불러온 설계안 ID (덮어쓰기용)
  currentDesignName: string | null // 불러온 설계안 이름
  quantities: QuantityResult | null
  loads: LoadResult | null
  estimate: EstimateResult | null
  isCalculating: boolean
  activeView: '2d' | '3d'
  includeLabor: boolean
  includeVat: boolean
  laborCosts: LaborCosts
  discountAmount: number   // 할인 금액 (음수로 적용)
  discountMemo: string     // 할인 메모
  setDiscount: (amount: number, memo: string) => void
  setLaborCosts: (costs: Partial<LaborCosts>) => void
  varietySeedInfo: VarietySeedInfo
  setVarietySeedInfo: (info: VarietySeedInfo) => void
  updateInputs: (partial: Partial<DesignInputs>) => void
  setSelectedPole: (code: string, effectiveHeight?: number) => void
  setSelectedWire: (code: string) => void
  setSelectedAnchor: (code: string) => void
  setSelectedVariety: (code: string, unitPrice: number) => void
  setIncludeLabor: (v: boolean) => void
  setIncludeVat: (v: boolean) => void
  setActiveView: (view: '2d' | '3d') => void
  recalculate: () => void
  loadFromSaved: (saved: { inputs?: Partial<DesignInputs>; quantities?: unknown; loads?: unknown; estimate?: unknown; designId?: string; designName?: string }) => void
  reset: () => void
}

export const useDesignStore = create<DesignStore>()(
  devtools(
    (set, get) => ({
      profileId: 'KR_STEEL_V',
      inputs: DEFAULT_INPUTS,
      selectedPoleCode: 'POLE_STEEL_60_2T_6M',
      selectedWireCode: 'WIRE_32MM',
      selectedAnchorCode: 'ANCHOR_SCREW_600',
      selectedVarietyCode: 'HOP_CASCADE',
      varietyUnitPrice: 0,
      quantities: null, loads: null, estimate: null,
      isCalculating: false, activeView: '2d', includeLabor: false, includeVat: true,
      laborCosts: DEFAULT_LABOR_COSTS,
      discountAmount: 0,
      discountMemo: '',
      varietySeedInfo: { seedTotal: 0, totalVarietyQty: 0 },

      updateInputs: (partial) => {
        set((state) => ({ inputs: { ...state.inputs, ...partial } }))
        get().recalculate()
      },
      setSelectedPole: (code, effectiveHeight) => {
        set((state) => ({
          selectedPoleCode: code,
          inputs: effectiveHeight ? { ...state.inputs, poleEffectiveHeightM: effectiveHeight } : state.inputs,
        }))
        get().recalculate()
      },
      setSelectedWire:    (code) => { set({ selectedWireCode: code });    get().recalculate() },
      setSelectedAnchor:  (code) => { set({ selectedAnchorCode: code });  get().recalculate() },
      setSelectedVariety: (code, unitPrice) => { set({ selectedVarietyCode: code, varietyUnitPrice: unitPrice }); get().recalculate() },
      setIncludeLabor:    (v) => { set({ includeLabor: v }); get().recalculate() },
      setDiscount: (amount, memo) => {
        set({ discountAmount: amount, discountMemo: memo })
        get().recalculate()
      },
      setLaborCosts: (costs) => {
        set((state) => ({ laborCosts: { ...state.laborCosts, ...costs } }))
        get().recalculate()
      },
      setVarietySeedInfo: (info) => {
        set({ varietySeedInfo: info })
        get().recalculate()
      },
      setIncludeVat:      (v) => { set({ includeVat: v });   get().recalculate() },
      setActiveView:      (view) => set({ activeView: view }),

      recalculate: () => {
        // 입력값 안전 검증 — 0이나 극단값이면 계산 스킵
        const { inputs } = get()
        if (
          inputs.rowSpacingM <= 0 || inputs.poleSpacingM <= 0 ||
          inputs.plantSpacingM <= 0 || inputs.widthM <= 0 || inputs.heightM <= 0
        ) return
        const state = get()
        const prices = usePriceStore.getState().prices
        set({ isCalculating: true })
        try {
          const quantities = calculateQuantities(state.inputs)
          const profile = getRegionalProfile(state.profileId)
          const loads = profile.loadModel === 'kr-preliminary'
            ? calculateLoad(state.inputs, quantities, state.selectedWireCode)
            : null
          const estimate = profile.pricing.status === 'live-catalog' ? calculateEstimate({
            quantities, prices,
            poleCode: state.selectedPoleCode,
            wireCode: state.selectedWireCode,
            anchorCode: state.selectedAnchorCode,
            varietyCode: state.selectedVarietyCode,
            varietyUnitPrice: state.varietyUnitPrice,
            includeLabor: state.includeLabor,
            includeVat: state.includeVat,
            laborCosts: state.laborCosts,
            discountAmount: state.discountAmount,
            seedTotal: state.varietySeedInfo.seedTotal > 0 ? state.varietySeedInfo.seedTotal : undefined,
            totalVarietyQty: state.varietySeedInfo.totalVarietyQty > 0 ? state.varietySeedInfo.totalVarietyQty : undefined,
          }) : null
          set({ quantities, loads, estimate, isCalculating: false })
        } catch (error) {
          console.error('Design calculation error:', error)
          set({ isCalculating: false })
        }
      },

      loadFromSaved: (saved) => {
        if (saved.inputs)     set({ inputs:     { ...DEFAULT_INPUTS, ...saved.inputs } })
        if (saved.quantities) set({ quantities: saved.quantities as QuantityResult })
        if (saved.loads)      set({ loads:      saved.loads as LoadResult })
        if (saved.estimate)   set({ estimate:   saved.estimate as EstimateResult })
        if (saved.designId)   set({ currentDesignId: saved.designId, currentDesignName: saved.designName ?? null })
      },

      reset: () => {
        set({
          profileId: 'KR_STEEL_V',
          inputs: DEFAULT_INPUTS,
          selectedPoleCode: 'POLE_STEEL_60_2T_6M', selectedWireCode: 'WIRE_32MM',
          selectedAnchorCode: 'ANCHOR_SCREW_600',  selectedVarietyCode: 'HOP_CASCADE',
          varietyUnitPrice: 0, quantities: null, loads: null, estimate: null,
          includeLabor: true, includeVat: false,
        })
      },
    }),
    { name: 'hopeden-design-store' }
  )
)
