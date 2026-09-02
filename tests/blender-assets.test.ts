import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function readGlbJson(path: string) {
  const buffer = readFileSync(path)
  assert.equal(buffer.subarray(0, 4).toString('ascii'), 'glTF')
  const jsonLength = buffer.readUInt32LE(12)
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8').replace(/\0+$/, '').trim())
}

test('Blender asset kit contains every web-instanced master asset', () => {
  const glb = readGlbJson('public/models/hopyard-asset-kit.glb')
  const nodes = new Set(glb.nodes.map((node: { name?: string }) => node.name))
  const materials = new Set(glb.materials.map((material: { name?: string }) => material.name))

  for (const name of [
    'KR_SteelPole_6m',
    'KR_SteelPole_9m',
    'KR_WoodPole_100_6m',
    'KR_WoodPole_120_6m',
    'KR_PCPole_9m',
    'KR_PCPole_12m',
    'US_WoodPole_22ft',
    'US_HelixAnchor_48in',
    'US_Turnbuckle_12in',
    'Hop_Vine_Segment',
  ]) {
    assert.ok(nodes.has(name), `Missing Blender asset node: ${name}`)
  }
  assert.ok(materials.has('GalvanizedSteel'))
  assert.ok(materials.has('TreatedWood'))
  assert.ok(materials.has('PrecastConcrete'))
  assert.ok(materials.has('HopLeaf'))
  assert.ok(materials.has('HopCone'))
})
