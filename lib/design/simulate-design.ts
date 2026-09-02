import { calculateEstimate } from '@/lib/calculations/estimate'
import { calculateLoad } from '@/lib/calculations/loads'
import { calculateQuantities } from '@/lib/calculations/quantities'
import { getRegionalProfile, type RegionalDesignProfile, type RegionalProfileId } from '@/lib/design/regional-profiles'
import type { LaborCosts } from '@/stores/designStore'
import type { DesignInputs, EstimateResult, LoadResult, PriceMap, QuantityResult } from '@/types'

export interface DesignSnapshot {
  profileId: RegionalProfileId
  inputs: DesignInputs
  poleCode: string
  wireCode: string
  anchorCode: string
  varietyCode: string
  varietyUnitPrice: number
  prices: PriceMap
  includeLabor: boolean
  includeVat: boolean
  laborCosts: LaborCosts
  discountAmount: number
}

export interface DesignPatch {
  profileId?: RegionalProfileId
  inputs?: Partial<DesignInputs>
  poleCode?: string
  wireCode?: string
  anchorCode?: string
  varietyCode?: string
  varietyUnitPrice?: number
  includeLabor?: boolean
  includeVat?: boolean
  laborCosts?: Partial<LaborCosts>
  discountAmount?: number
}

export interface SimulationResultSet {
  quantities: QuantityResult
  loads: LoadResult | null
  estimate: EstimateResult | null
}

export interface DesignSimulation {
  candidateId: string
  profile: RegionalDesignProfile
  snapshot: DesignSnapshot
  baseline: SimulationResultSet
  quantities: QuantityResult
  loads: LoadResult | null
  estimate: EstimateResult | null
  planningStatus: 'preliminary-estimate' | 'local-engineering-required'
  warnings: string[]
}

function calculateSnapshot(
  snapshot: DesignSnapshot,
  profile: RegionalDesignProfile,
): SimulationResultSet {
  const quantities = calculateQuantities(snapshot.inputs)
  const loads = profile.loadModel === 'kr-preliminary'
    ? calculateLoad(snapshot.inputs, quantities, snapshot.wireCode)
    : null
  const estimate = profile.pricing.status === 'live-catalog'
    ? calculateEstimate({
        quantities,
        prices: snapshot.prices,
        poleCode: snapshot.poleCode,
        wireCode: snapshot.wireCode,
        anchorCode: snapshot.anchorCode,
        varietyCode: snapshot.varietyCode,
        varietyUnitPrice: snapshot.varietyUnitPrice,
        includeLabor: snapshot.includeLabor,
        includeVat: snapshot.includeVat,
        laborCosts: snapshot.laborCosts,
        discountAmount: snapshot.discountAmount,
      })
    : null

  return { quantities, loads, estimate }
}

function stableCandidateId(snapshot: DesignSnapshot): string {
  const payload = JSON.stringify({
    profileId: snapshot.profileId,
    inputs: snapshot.inputs,
    poleCode: snapshot.poleCode,
    wireCode: snapshot.wireCode,
    anchorCode: snapshot.anchorCode,
    varietyCode: snapshot.varietyCode,
    varietyUnitPrice: snapshot.varietyUnitPrice,
    includeLabor: snapshot.includeLabor,
    includeVat: snapshot.includeVat,
    laborCosts: snapshot.laborCosts,
    discountAmount: snapshot.discountAmount,
  })
  let hash = 0x811c9dc5
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `candidate-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function materialCode(
  profile: RegionalDesignProfile,
  role: 'pole' | 'main-wire' | 'anchor',
): string {
  const material = profile.materials.find((candidate) => candidate.role === role)
  if (!material) throw new Error(`Profile ${profile.id} has no ${role} material`)
  return material.code
}

export function simulateDesign(
  baseline: DesignSnapshot,
  patch: DesignPatch,
): DesignSimulation {
  const profileId = patch.profileId ?? baseline.profileId
  const profile = getRegionalProfile(profileId)
  const profileChanged = profileId !== baseline.profileId
  const snapshot: DesignSnapshot = {
    ...baseline,
    profileId,
    inputs: {
      ...baseline.inputs,
      ...(profileChanged ? profile.defaults : {}),
      ...patch.inputs,
    },
    laborCosts: { ...baseline.laborCosts, ...patch.laborCosts },
    poleCode: patch.poleCode ?? (profileChanged ? materialCode(profile, 'pole') : baseline.poleCode),
    wireCode: patch.wireCode ?? (profileChanged ? materialCode(profile, 'main-wire') : baseline.wireCode),
    anchorCode: patch.anchorCode ?? (profileChanged ? materialCode(profile, 'anchor') : baseline.anchorCode),
    varietyCode: patch.varietyCode ?? baseline.varietyCode,
    varietyUnitPrice: patch.varietyUnitPrice ?? baseline.varietyUnitPrice,
    includeLabor: patch.includeLabor ?? baseline.includeLabor,
    includeVat: patch.includeVat ?? baseline.includeVat,
    discountAmount: patch.discountAmount ?? baseline.discountAmount,
  }
  const result = calculateSnapshot(snapshot, profile)
  const warnings = [profile.engineeringDisclaimer]
  if (profile.pricing.status === 'reference-only') {
    warnings.push('Live pricing is unavailable for this regional profile; no total estimate was generated.')
  }

  return {
    candidateId: stableCandidateId(snapshot),
    profile,
    snapshot,
    baseline: calculateSnapshot(baseline, getRegionalProfile(baseline.profileId)),
    planningStatus: profile.loadModel === 'kr-preliminary'
      ? 'preliminary-estimate'
      : 'local-engineering-required',
    warnings,
    ...result,
  }
}
