import assert from 'node:assert/strict'
import test from 'node:test'
import { getTrainingWireOffsets } from '../lib/design/training-geometry'

test('I training grows one vine vertically to the center wire', () => {
  assert.deepEqual(getTrainingWireOffsets('I', false, false, 0.8), [0])
})

test('V training grows two vines toward the available left and right wires', () => {
  assert.deepEqual(getTrainingWireOffsets('V', false, false, 0.8), [-0.8, 0.8])
  assert.deepEqual(getTrainingWireOffsets('V', true, false, 0.8), [0, 0.8])
  assert.deepEqual(getTrainingWireOffsets('V', false, true, 0.8), [-0.8, 0])
})
