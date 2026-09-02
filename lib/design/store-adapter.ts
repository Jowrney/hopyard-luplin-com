import type { DesignSimulation, DesignSnapshot } from '@/lib/design/simulate-design'
import type { useDesignStore } from '@/stores/designStore'
import type { PriceMap } from '@/types'

type DesignStoreState = ReturnType<typeof useDesignStore.getState>

type SnapshotFields = Pick<
  DesignStoreState,
  | 'profileId'
  | 'inputs'
  | 'selectedPoleCode'
  | 'selectedWireCode'
  | 'selectedAnchorCode'
  | 'selectedVarietyCode'
  | 'varietyUnitPrice'
  | 'includeLabor'
  | 'includeVat'
  | 'laborCosts'
  | 'discountAmount'
>

export type ApplicableDesignState = Pick<
  DesignStoreState,
  | 'profileId'
  | 'inputs'
  | 'selectedPoleCode'
  | 'selectedWireCode'
  | 'selectedAnchorCode'
  | 'selectedVarietyCode'
  | 'varietyUnitPrice'
  | 'includeLabor'
  | 'includeVat'
  | 'laborCosts'
  | 'discountAmount'
  | 'quantities'
  | 'loads'
  | 'estimate'
>

export function designStateToSnapshot(
  state: SnapshotFields,
  prices: PriceMap,
): DesignSnapshot {
  return {
    profileId: state.profileId,
    inputs: { ...state.inputs },
    poleCode: state.selectedPoleCode,
    wireCode: state.selectedWireCode,
    anchorCode: state.selectedAnchorCode,
    varietyCode: state.selectedVarietyCode,
    varietyUnitPrice: state.varietyUnitPrice,
    prices: { ...prices },
    includeLabor: state.includeLabor,
    includeVat: state.includeVat,
    laborCosts: { ...state.laborCosts },
    discountAmount: state.discountAmount,
  }
}

export function simulationToDesignState(
  simulation: DesignSimulation,
): ApplicableDesignState {
  return {
    profileId: simulation.snapshot.profileId,
    inputs: { ...simulation.snapshot.inputs },
    selectedPoleCode: simulation.snapshot.poleCode,
    selectedWireCode: simulation.snapshot.wireCode,
    selectedAnchorCode: simulation.snapshot.anchorCode,
    selectedVarietyCode: simulation.snapshot.varietyCode,
    varietyUnitPrice: simulation.snapshot.varietyUnitPrice,
    includeLabor: simulation.snapshot.includeLabor,
    includeVat: simulation.snapshot.includeVat,
    laborCosts: { ...simulation.snapshot.laborCosts },
    discountAmount: simulation.snapshot.discountAmount,
    quantities: simulation.quantities,
    loads: simulation.loads,
    estimate: simulation.estimate,
  }
}
