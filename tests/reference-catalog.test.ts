import assert from 'node:assert/strict'
import test from 'node:test'
import {
  REFERENCE_MATERIAL_CATEGORIES,
  REFERENCE_VARIETIES,
  getReferencePriceMap,
} from '../lib/catalog/reference-catalog'

test('reference catalog keeps the guest calculator and selectors deterministic', () => {
  const prices = getReferencePriceMap()
  const categories = new Map(
    REFERENCE_MATERIAL_CATEGORIES.map((category) => [category.code, category.materials]),
  )

  assert.equal(prices.POLE_STEEL_60_2T_6M, 35_000)
  assert.equal(prices.WIRE_32MM, 520)
  assert.equal(prices.ANCHOR_SCREW_600, 8_500)
  assert.equal(prices.CLIP_U_BOLT, 1_200)
  assert.ok((categories.get('POLE')?.length ?? 0) >= 4)
  assert.ok((categories.get('WIRE')?.length ?? 0) >= 4)
  assert.ok((categories.get('ANCHOR')?.length ?? 0) >= 3)
  assert.equal(REFERENCE_VARIETIES.length, 7)
  assert.equal(REFERENCE_VARIETIES.find((variety) => variety.code === 'HOP_CASCADE')?.unitPrice, 8_000)
})
