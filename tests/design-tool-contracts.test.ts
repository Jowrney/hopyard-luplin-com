import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseCandidateListArgs,
  parseCandidateSelectionArgs,
  parseSimulationToolArgs,
  simulationArgsToPatch,
  SIMULATE_DESIGN_INPUT_SCHEMA,
} from '../lib/webmcp/design-tool-contracts'

test('simulation tool accepts a bounded regional design request', () => {
  const args = parseSimulationToolArgs({
    label: 'North American reference',
    profileId: 'US_HIGH_TRELLIS',
    widthM: 50,
    heightM: 80,
    rowSpacingM: 4.2672,
    trainingType: 'V',
  })
  const patch = simulationArgsToPatch(args)

  assert.equal(patch.profileId, 'US_HIGH_TRELLIS')
  assert.deepEqual(patch.inputs, {
    widthM: 50,
    heightM: 80,
    rowSpacingM: 4.2672,
    trainingType: 'V',
  })
  assert.equal(SIMULATE_DESIGN_INPUT_SCHEMA.additionalProperties, false)
})

test('simulation tool rejects unsafe dimensions and unknown fields', () => {
  assert.throws(() => parseSimulationToolArgs({ widthM: 4 }), /widthM/)
  assert.throws(() => parseSimulationToolArgs({ widthM: 50, surprise: true }), /Unrecognized key/)
})

test('candidate tools accept only known-shaped unique identifiers', () => {
  assert.deepEqual(parseCandidateListArgs({ candidateIds: ['candidate-a', 'candidate-b'] }), {
    candidateIds: ['candidate-a', 'candidate-b'],
  })
  assert.deepEqual(parseCandidateSelectionArgs({ candidateId: 'candidate-a' }), {
    candidateId: 'candidate-a',
  })
  assert.throws(
    () => parseCandidateListArgs({ candidateIds: ['candidate-a', 'candidate-a'] }),
    /unique/,
  )
})
