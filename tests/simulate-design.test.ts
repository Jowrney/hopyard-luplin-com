import assert from 'node:assert/strict'
import test from 'node:test'
import { simulateDesign, type DesignSnapshot } from '../lib/design/simulate-design'
import { summarizeDesignSimulation } from '../lib/webmcp/design-tool-contracts'

const BASELINE: DesignSnapshot = {
  profileId: 'KR_STEEL_V',
  inputs: {
    widthM: 60,
    heightM: 60,
    rowSpacingM: 3.5,
    plantSpacingM: 1,
    poleSpacingM: 8,
    wireRows: 1,
    poleEffectiveHeightM: 5.5,
    region: 'INLAND',
    trainingType: 'V',
  },
  poleCode: 'POLE_STEEL_60_2T_6M',
  wireCode: 'WIRE_32MM',
  anchorCode: 'ANCHOR_SCREW_600',
  varietyCode: 'HOP_CASCADE',
  varietyUnitPrice: 8_000,
  prices: {
    POLE_STEEL_60_2T_6M: 35_000,
    WIRE_32MM: 520,
    ANCHOR_SCREW_600: 8_500,
    CLIP_U_BOLT: 1_200,
  },
  includeLabor: false,
  includeVat: true,
  laborCosts: { laborFee: 0, equipmentFee: 0, plantingFee: 0, etcFee: 0 },
  discountAmount: 0,
}

test('simulation applies a patch without mutating the baseline', () => {
  const first = simulateDesign(BASELINE, { inputs: { rowSpacingM: 4 } })
  const second = simulateDesign(BASELINE, { inputs: { rowSpacingM: 4 } })

  assert.equal(BASELINE.inputs.rowSpacingM, 3.5)
  assert.equal(first.snapshot.inputs.rowSpacingM, 4)
  assert.notEqual(first.quantities.totalWireM, first.baseline.quantities.totalWireM)
  assert.equal(first.candidateId, second.candidateId)
  assert.equal(first.profile.id, 'KR_STEEL_V')
  assert.ok(first.estimate)
})

test('switching to the US profile applies sourced defaults without inventing safety or price results', () => {
  const result = simulateDesign(BASELINE, { profileId: 'US_HIGH_TRELLIS' })

  assert.equal(result.profile.id, 'US_HIGH_TRELLIS')
  assert.equal(result.snapshot.inputs.poleEffectiveHeightM, 5.4864)
  assert.equal(result.snapshot.inputs.rowSpacingM, 4.2672)
  assert.equal(result.snapshot.poleCode, 'POLE_US_WOOD_22FT')
  assert.equal(result.snapshot.wireCode, 'WIRE_US_MAIN_5_16_7X19')
  assert.equal(result.snapshot.anchorCode, 'ANCHOR_US_HELIX_48IN')
  assert.equal(result.loads, null)
  assert.equal(result.estimate, null)
  assert.equal(result.planningStatus, 'local-engineering-required')
  assert.ok(result.warnings.some((warning) => warning.includes('pricing')))
})

test('agent simulation summary is concise and excludes the raw price catalog', () => {
  const result = simulateDesign(BASELINE, { inputs: { trainingType: 'I' } })
  const summary = summarizeDesignSimulation(result)
  const serialized = JSON.stringify(summary)

  assert.equal(summary.candidateId, result.candidateId)
  assert.equal(summary.results.safetyStatus, result.loads?.safetyStatus)
  assert.ok(serialized.length < 1_500)
  assert.equal(serialized.includes('POLE_STEEL_60_2T_6M":35000'), false)
})
