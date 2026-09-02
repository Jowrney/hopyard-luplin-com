import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateLoad } from '../lib/calculations/loads'
import { calculateQuantities } from '../lib/calculations/quantities'
import type { DesignInputs } from '../types'

const INPUTS: DesignInputs = {
  widthM: 60,
  heightM: 40,
  rowSpacingM: 3.5,
  plantSpacingM: 1,
  poleSpacingM: 8,
  wireRows: 1,
  poleEffectiveHeightM: 5.5,
  region: 'INLAND',
  trainingType: 'V',
}

test('recommended wire is the smallest diameter with GREEN capacity', () => {
  const quantities = calculateQuantities(INPUTS)
  const result = calculateLoad(INPUTS, quantities, 'WIRE_25MM')

  assert.equal(result.safetyStatus, 'YELLOW')
  assert.equal(result.recommendedWireDiameterMM, 3.2)
})
