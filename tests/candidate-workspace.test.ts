import assert from 'node:assert/strict'
import test from 'node:test'
import { createCandidateWorkspace } from '../lib/design/candidate-workspace'
import { simulateDesign, type DesignSnapshot } from '../lib/design/simulate-design'

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
  prices: {},
  includeLabor: false,
  includeVat: false,
  laborCosts: { laborFee: 0, equipmentFee: 0, plantingFee: 0, etcFee: 0 },
  discountAmount: 0,
}

test('candidate workspace stages up to three known candidates for preview', () => {
  const workspace = createCandidateWorkspace()
  const economy = simulateDesign(BASELINE, { inputs: { trainingType: 'I' } })
  const balanced = simulateDesign(BASELINE, { inputs: { rowSpacingM: 4 } })

  workspace.add(economy, 'Economy', 'Uses one training line per plant.')
  workspace.add(balanced, 'Balanced', 'Keeps V training with wider rows.')
  workspace.show([economy.candidateId, balanced.candidateId])
  workspace.preview(balanced.candidateId)

  assert.deepEqual(workspace.visible().map((candidate) => candidate.label), ['Economy', 'Balanced'])
  assert.equal(workspace.previewed()?.simulation.candidateId, balanced.candidateId)
  assert.throws(() => workspace.show(['missing']), /Unknown candidate/)
  assert.throws(
    () => workspace.show([economy.candidateId, balanced.candidateId, economy.candidateId, balanced.candidateId]),
    /between 1 and 3/,
  )
})
