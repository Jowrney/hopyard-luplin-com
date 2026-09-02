import assert from 'node:assert/strict'
import test from 'node:test'
import { getPoleAssetLabel, getPoleAssetName } from '../lib/design/pole-assets'

test('every selectable pole code maps to a dedicated Blender asset', () => {
  assert.equal(getPoleAssetName('POLE_STEEL_60_2T_6M', 'KR_STEEL_V'), 'KR_SteelPole_6m')
  assert.equal(getPoleAssetName('POLE_STEEL_60_2T_9M', 'KR_STEEL_V'), 'KR_SteelPole_9m')
  assert.equal(getPoleAssetName('POLE_WOOD_H4_100_6M', 'KR_STEEL_V'), 'KR_WoodPole_100_6m')
  assert.equal(getPoleAssetName('POLE_WOOD_H4_120_6M', 'KR_STEEL_V'), 'KR_WoodPole_120_6m')
  assert.equal(getPoleAssetName('POLE_PC_9M', 'KR_STEEL_V'), 'KR_PCPole_9m')
  assert.equal(getPoleAssetName('POLE_PC_12M', 'KR_STEEL_V'), 'KR_PCPole_12m')
  assert.equal(getPoleAssetName('POLE_US_WOOD_22FT', 'US_HIGH_TRELLIS'), 'US_WoodPole_22ft')
})

test('unknown pole codes fall back to the active regional system', () => {
  assert.equal(getPoleAssetName('UNKNOWN', 'KR_STEEL_V'), 'KR_SteelPole_6m')
  assert.equal(getPoleAssetName('UNKNOWN', 'US_HIGH_TRELLIS'), 'US_WoodPole_22ft')
})

test('pole asset labels expose the selected material and size', () => {
  assert.equal(getPoleAssetLabel('POLE_STEEL_60_2T_6M', 'KR_STEEL_V'), 'Galvanized steel 60 mm · 6 m')
  assert.equal(getPoleAssetLabel('POLE_WOOD_H4_120_6M', 'KR_STEEL_V'), 'H4 timber 120 mm · 6 m')
  assert.equal(getPoleAssetLabel('POLE_PC_12M', 'KR_STEEL_V'), 'Precast concrete · 12 m')
  assert.equal(getPoleAssetLabel('POLE_US_WOOD_22FT', 'US_HIGH_TRELLIS'), 'New wood pole · 22 ft')
})
