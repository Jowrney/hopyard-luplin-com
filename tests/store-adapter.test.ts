import assert from 'node:assert/strict'
import test from 'node:test'
import { simulateDesign } from '../lib/design/simulate-design'
import {
  designStateToSnapshot,
  simulationToDesignState,
} from '../lib/design/store-adapter'
import { useDesignStore } from '../stores/designStore'
import { useCandidateStore } from '../stores/candidateStore'
import { getRegionalProfile } from '../lib/design/regional-profiles'

const PRICES = {
  POLE_STEEL_60_2T_6M: 35_000,
  WIRE_32MM: 520,
  ANCHOR_SCREW_600: 8_500,
  CLIP_U_BOLT: 1_200,
}

test('store adapter round-trips a simulated design into shared UI state', () => {
  useDesignStore.getState().reset()
  const baseline = designStateToSnapshot(useDesignStore.getState(), PRICES)
  const simulation = simulateDesign(baseline, {
    inputs: { trainingType: 'I' },
    wireCode: 'WIRE_40MM',
  })
  const nextState = simulationToDesignState(simulation)

  assert.equal(baseline.wireCode, 'WIRE_32MM')
  assert.equal(nextState.inputs.trainingType, 'I')
  assert.equal(nextState.selectedWireCode, 'WIRE_40MM')
  assert.deepEqual(nextState.quantities, simulation.quantities)
  assert.deepEqual(nextState.loads, simulation.loads)
  assert.deepEqual(nextState.estimate, simulation.estimate)
})

test('candidate preview can be discarded to restore the original shared design', () => {
  useDesignStore.getState().reset()
  useCandidateStore.getState().clear()
  const baseline = designStateToSnapshot(useDesignStore.getState(), PRICES)
  const simulation = simulateDesign(baseline, { inputs: { trainingType: 'I' } })
  const candidates = useCandidateStore.getState()

  candidates.addCandidate(simulation, 'Economy')
  candidates.showCandidates([simulation.candidateId])
  candidates.preview(simulation.candidateId)
  assert.equal(useDesignStore.getState().inputs.trainingType, 'I')

  useCandidateStore.getState().discardPreview()
  assert.equal(useDesignStore.getState().inputs.trainingType, 'V')
  assert.equal(useCandidateStore.getState().previewCandidate, null)
})

test('store recalculation never invents Korean safety or pricing for a US reference design', () => {
  useDesignStore.getState().reset()
  const profile = getRegionalProfile('US_HIGH_TRELLIS')
  useDesignStore.setState({
    profileId: profile.id,
    inputs: { ...useDesignStore.getState().inputs, ...profile.defaults },
    selectedPoleCode: 'POLE_US_WOOD_22FT',
    selectedWireCode: 'WIRE_US_MAIN_5_16_7X19',
    selectedAnchorCode: 'ANCHOR_US_HELIX_48IN',
  })

  useDesignStore.getState().recalculate()

  assert.ok(useDesignStore.getState().quantities)
  assert.equal(useDesignStore.getState().loads, null)
  assert.equal(useDesignStore.getState().estimate, null)
})
