import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateQuantities } from '../lib/calculations/quantities'
import type { DesignInputs } from '../types'

const BASE_INPUTS: DesignInputs = {
  widthM: 60,
  heightM: 60,
  rowSpacingM: 3.5,
  plantSpacingM: 1,
  poleSpacingM: 8,
  wireRows: 1,
  poleEffectiveHeightM: 5.5,
  region: 'INLAND',
  trainingType: 'V',
}

test('I training uses one support wire and one twine per plant', () => {
  const vDesign = calculateQuantities(BASE_INPUTS)
  const iDesign = calculateQuantities({ ...BASE_INPUTS, trainingType: 'I' })

  assert.equal(iDesign.plantCount, vDesign.plantCount)
  assert.equal(iDesign.verticalWireM, Math.ceil(vDesign.verticalWireM / 2))
  assert.ok(iDesign.horizontalWireM < vDesign.horizontalWireM)
})
