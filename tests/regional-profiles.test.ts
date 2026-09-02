import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getRegionalProfile,
  listRegionalProfiles,
} from '../lib/design/regional-profiles'

const closeTo = (actual: number, expected: number) => {
  assert.ok(Math.abs(actual - expected) < 0.0001, `${actual} != ${expected}`)
}

test('regional profiles expose Korean and North American systems', () => {
  assert.deepEqual(
    listRegionalProfiles().map((profile) => profile.id),
    ['KR_STEEL_V', 'US_HIGH_TRELLIS'],
  )
})

test('US high trellis uses sourced dimensions and materials', () => {
  const profile = getRegionalProfile('US_HIGH_TRELLIS')

  closeTo(profile.defaults.poleEffectiveHeightM, 5.4864)
  closeTo(profile.defaults.rowSpacingM, 4.2672)
  closeTo(profile.defaults.plantSpacingM, 1.0668)
  closeTo(profile.defaults.poleSpacingM, 12.8016)
  assert.equal(profile.pricing.status, 'reference-only')
  assert.deepEqual(
    profile.materials.map((material) => material.code),
    [
      'POLE_US_WOOD_22FT',
      'ANCHOR_US_HELIX_48IN',
      'WIRE_US_MAIN_5_16_7X19',
      'WIRE_US_SUPPORT_3_16_7X7',
      'HARDWARE_US_TURNBUCKLE_1_2X12',
      'TWINE_US_COIR_21FT',
    ],
  )
  assert.ok(profile.materials.every((material) => material.sourceUrl.startsWith('https://')))
})
