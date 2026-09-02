import type { DesignInputs } from '@/types'

export type RegionalProfileId = 'KR_STEEL_V' | 'US_HIGH_TRELLIS'
export type MaterialRole = 'pole' | 'anchor' | 'main-wire' | 'support-wire' | 'hardware' | 'twine'
export type PriceStatus = 'live-catalog' | 'reference-only'

export interface RegionalMaterial {
  code: string
  role: MaterialRole
  name: string
  specification: string
  unit: 'each' | 'm' | 'ft'
  sourceLabel: string
  sourceUrl: string
  visualMaterial: 'galvanized-steel' | 'treated-wood' | 'concrete' | 'coir'
}

export interface RegionalDesignProfile {
  id: RegionalProfileId
  name: string
  market: 'KR' | 'US'
  unitSystem: 'metric' | 'imperial'
  currency: 'KRW' | 'USD'
  loadModel: 'kr-preliminary' | 'local-engineering-required'
  description: string
  defaults: Pick<
    DesignInputs,
    'rowSpacingM' | 'plantSpacingM' | 'poleSpacingM' | 'poleEffectiveHeightM' | 'trainingType'
  >
  pricing: {
    status: PriceStatus
    note: string
  }
  materials: readonly RegionalMaterial[]
  sources: readonly { label: string; url: string }[]
  engineeringDisclaimer: string
}

const NEBRASKA_EXTENSION_URL = 'https://extensionpublications.unl.edu/assets/pdf/ec3026.pdf'
const HOPYARD_URL = 'https://hopyard.luplin.com'

const PROFILES: readonly RegionalDesignProfile[] = [
  {
    id: 'KR_STEEL_V',
    name: 'Korea galvanized steel V-trellis',
    market: 'KR',
    unitSystem: 'metric',
    currency: 'KRW',
    loadModel: 'kr-preliminary',
    description: 'Current HOPEDEN steel-pole system for preliminary Korean hopyard planning.',
    defaults: {
      rowSpacingM: 3.5,
      plantSpacingM: 1,
      poleSpacingM: 8,
      poleEffectiveHeightM: 5.5,
      trainingType: 'V',
    },
    pricing: {
      status: 'live-catalog',
      note: 'Prices are supplied by the active HOPEDEN material catalog.',
    },
    materials: [
      {
        code: 'POLE_STEEL_60_2T_6M',
        role: 'pole',
        name: 'Galvanized steel pole 60 mm × 2T × 6 m',
        specification: '6 m galvanized steel tube; 5.1 m catalog effective height',
        unit: 'each',
        sourceLabel: 'HOPEDEN material catalog',
        sourceUrl: HOPYARD_URL,
        visualMaterial: 'galvanized-steel',
      },
      {
        code: 'ANCHOR_SCREW_600',
        role: 'anchor',
        name: 'Screw anchor L600 mm',
        specification: '600 mm screw-in ground anchor',
        unit: 'each',
        sourceLabel: 'HOPEDEN material catalog',
        sourceUrl: HOPYARD_URL,
        visualMaterial: 'galvanized-steel',
      },
      {
        code: 'WIRE_32MM',
        role: 'main-wire',
        name: 'High-tensile steel wire 3.2 mm',
        specification: '3.2 mm catalog wire; 24.8 kN listed tensile strength',
        unit: 'm',
        sourceLabel: 'HOPEDEN material catalog',
        sourceUrl: HOPYARD_URL,
        visualMaterial: 'galvanized-steel',
      },
    ],
    sources: [{ label: 'HOPEDEN material catalog', url: HOPYARD_URL }],
    engineeringDisclaimer: 'Preliminary planning estimate; requires review by a qualified local engineer.',
  },
  {
    id: 'US_HIGH_TRELLIS',
    name: 'North America 18 ft V-trellis',
    market: 'US',
    unitSystem: 'imperial',
    currency: 'USD',
    loadModel: 'local-engineering-required',
    description: 'Quarter-acre high-trellis reference configuration based on Nebraska Extension EC3026.',
    defaults: {
      rowSpacingM: 4.2672,
      plantSpacingM: 1.0668,
      poleSpacingM: 12.8016,
      poleEffectiveHeightM: 5.4864,
      trainingType: 'V',
    },
    pricing: {
      status: 'reference-only',
      note: 'Specifications and quantities are sourced; live vendor pricing is intentionally not implied.',
    },
    materials: [
      {
        code: 'POLE_US_WOOD_22FT',
        role: 'pole',
        name: 'New wood trellis pole',
        specification: '22 ft long × 5 in top diameter; approximately 4 ft embedded and 18 ft exposed',
        unit: 'each',
        sourceLabel: 'Nebraska Extension EC3026',
        sourceUrl: NEBRASKA_EXTENSION_URL,
        visualMaterial: 'treated-wood',
      },
      {
        code: 'ANCHOR_US_HELIX_48IN',
        role: 'anchor',
        name: 'Ground anchor with base plate',
        specification: '5/8 in shaft × 48 in length × 6 in base plate',
        unit: 'each',
        sourceLabel: 'Nebraska Extension EC3026',
        sourceUrl: NEBRASKA_EXTENSION_URL,
        visualMaterial: 'galvanized-steel',
      },
      {
        code: 'WIRE_US_MAIN_5_16_7X19',
        role: 'main-wire',
        name: 'Galvanized aircraft main cable',
        specification: '5/16 in diameter, 7×19 strand',
        unit: 'ft',
        sourceLabel: 'Nebraska Extension EC3026',
        sourceUrl: NEBRASKA_EXTENSION_URL,
        visualMaterial: 'galvanized-steel',
      },
      {
        code: 'WIRE_US_SUPPORT_3_16_7X7',
        role: 'support-wire',
        name: 'Galvanized training-support cable',
        specification: '3/16 in diameter, 7×7 strand',
        unit: 'ft',
        sourceLabel: 'Nebraska Extension EC3026',
        sourceUrl: NEBRASKA_EXTENSION_URL,
        visualMaterial: 'galvanized-steel',
      },
      {
        code: 'HARDWARE_US_TURNBUCKLE_1_2X12',
        role: 'hardware',
        name: 'Cable turnbuckle',
        specification: '1/2 in × 12 in',
        unit: 'each',
        sourceLabel: 'Nebraska Extension EC3026',
        sourceUrl: NEBRASKA_EXTENSION_URL,
        visualMaterial: 'galvanized-steel',
      },
      {
        code: 'TWINE_US_COIR_21FT',
        role: 'twine',
        name: 'Coir training twine',
        specification: '21 ft coir string',
        unit: 'each',
        sourceLabel: 'Nebraska Extension EC3026',
        sourceUrl: NEBRASKA_EXTENSION_URL,
        visualMaterial: 'coir',
      },
    ],
    sources: [{ label: 'Nebraska Extension EC3026 — Hops on a Quarter-Acre', url: NEBRASKA_EXTENSION_URL }],
    engineeringDisclaimer: 'Reference layout for planning and comparison only; local loads, soil, codes, and engineering review govern construction.',
  },
]

export function listRegionalProfiles(): readonly RegionalDesignProfile[] {
  return PROFILES
}

export function getRegionalProfile(id: RegionalProfileId): RegionalDesignProfile {
  const profile = PROFILES.find((candidate) => candidate.id === id)
  if (!profile) throw new Error(`Unknown regional profile: ${id}`)
  return profile
}
