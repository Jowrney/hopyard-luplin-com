import { z } from 'zod'
import type { DesignPatch, DesignSimulation } from '@/lib/design/simulate-design'

const REGIONAL_PROFILE_IDS = ['KR_STEEL_V', 'US_HIGH_TRELLIS'] as const
const WIND_REGIONS = ['INLAND', 'SEOUL', 'GANGWON', 'COASTAL', 'JEJU'] as const
const TRAINING_TYPES = ['V', 'I'] as const
const CandidateIdSchema = z.string().regex(/^candidate-[0-9a-z]+$/, 'Invalid candidate identifier')

const CandidateListArgsSchema = z.object({
  candidateIds: z.array(CandidateIdSchema).min(1).max(3),
}).strict().superRefine(({ candidateIds }, context) => {
  if (new Set(candidateIds).size !== candidateIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Candidate identifiers must be unique.' })
  }
})

const CandidateSelectionArgsSchema = z.object({
  candidateId: CandidateIdSchema,
}).strict()

export const EMPTY_INPUT_SCHEMA = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

export const CANDIDATE_LIST_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    candidateIds: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      uniqueItems: true,
      items: { type: 'string', pattern: '^candidate-[0-9a-z]+$' },
      description: 'One to three IDs returned by simulate_design.',
    },
  },
  required: ['candidateIds'],
  additionalProperties: false,
} as const

export const CANDIDATE_SELECTION_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    candidateId: {
      type: 'string',
      pattern: '^candidate-[0-9a-z]+$',
      description: 'A visible candidate ID returned by simulate_design.',
    },
  },
  required: ['candidateId'],
  additionalProperties: false,
} as const

export const SimulationToolArgsSchema = z.object({
  label: z.string().trim().min(1).max(60).optional(),
  rationale: z.string().trim().min(1).max(240).optional(),
  profileId: z.enum(REGIONAL_PROFILE_IDS).optional(),
  widthM: z.number().min(5).max(500).optional(),
  heightM: z.number().min(5).max(500).optional(),
  rowSpacingM: z.number().min(1).max(20).optional(),
  plantSpacingM: z.number().min(0.5).max(5).optional(),
  poleSpacingM: z.number().min(2).max(50).optional(),
  poleEffectiveHeightM: z.number().min(2).max(12).optional(),
  region: z.enum(WIND_REGIONS).optional(),
  trainingType: z.enum(TRAINING_TYPES).optional(),
  poleCode: z.string().trim().min(1).max(80).optional(),
  wireCode: z.string().trim().min(1).max(80).optional(),
  anchorCode: z.string().trim().min(1).max(80).optional(),
  includeVat: z.boolean().optional(),
}).strict()

export type SimulationToolArgs = z.infer<typeof SimulationToolArgsSchema>

export const SIMULATE_DESIGN_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    label: { type: 'string', description: 'Short candidate name shown to the user.', maxLength: 60 },
    rationale: { type: 'string', description: 'Why this alternative may fit the user goal.', maxLength: 240 },
    profileId: {
      type: 'string',
      enum: REGIONAL_PROFILE_IDS,
      description: 'Regional trellis and material reference profile.',
    },
    widthM: { type: 'number', minimum: 5, maximum: 500, description: 'Site width in metres.' },
    heightM: { type: 'number', minimum: 5, maximum: 500, description: 'Site length in metres.' },
    rowSpacingM: { type: 'number', minimum: 1, maximum: 20, description: 'Planting-row spacing in metres.' },
    plantSpacingM: { type: 'number', minimum: 0.5, maximum: 5, description: 'Plant spacing in metres.' },
    poleSpacingM: { type: 'number', minimum: 2, maximum: 50, description: 'Pole spacing along a row in metres.' },
    poleEffectiveHeightM: { type: 'number', minimum: 2, maximum: 12, description: 'Pole height above ground in metres.' },
    region: { type: 'string', enum: WIND_REGIONS, description: 'Korean preliminary wind region.' },
    trainingType: { type: 'string', enum: TRAINING_TYPES, description: 'I means straight I-shaped training; V is the wire value for Y-shaped split training.' },
    poleCode: { type: 'string', description: 'Material catalog pole code.', maxLength: 80 },
    wireCode: { type: 'string', description: 'Material catalog main-wire code.', maxLength: 80 },
    anchorCode: { type: 'string', description: 'Material catalog anchor code.', maxLength: 80 },
    includeVat: { type: 'boolean', description: 'Include VAT when catalog pricing is available.' },
  },
  additionalProperties: false,
} as const

export function parseSimulationToolArgs(value: unknown): SimulationToolArgs {
  return SimulationToolArgsSchema.parse(value)
}

export function parseCandidateListArgs(value: unknown): { candidateIds: string[] } {
  return CandidateListArgsSchema.parse(value)
}

export function parseCandidateSelectionArgs(value: unknown): { candidateId: string } {
  return CandidateSelectionArgsSchema.parse(value)
}

export function simulationArgsToPatch(args: SimulationToolArgs): DesignPatch {
  const inputs = {
    widthM: args.widthM,
    heightM: args.heightM,
    rowSpacingM: args.rowSpacingM,
    plantSpacingM: args.plantSpacingM,
    poleSpacingM: args.poleSpacingM,
    poleEffectiveHeightM: args.poleEffectiveHeightM,
    region: args.region,
    trainingType: args.trainingType,
  }
  const definedInputs = Object.fromEntries(
    Object.entries(inputs).filter(([, value]) => value !== undefined),
  ) as DesignPatch['inputs']

  return {
    profileId: args.profileId,
    inputs: definedInputs,
    poleCode: args.poleCode,
    wireCode: args.wireCode,
    anchorCode: args.anchorCode,
    includeVat: args.includeVat,
  }
}

export function summarizeDesignSimulation(simulation: DesignSimulation) {
  const baselineTotal = simulation.baseline.estimate?.total ?? null
  const candidateTotal = simulation.estimate?.total ?? null

  return {
    candidateId: simulation.candidateId,
    profile: {
      id: simulation.profile.id,
      name: simulation.profile.name,
      market: simulation.profile.market,
      pricingStatus: simulation.profile.pricing.status,
    },
    configuration: {
      ...simulation.snapshot.inputs,
      poleCode: simulation.snapshot.poleCode,
      wireCode: simulation.snapshot.wireCode,
      anchorCode: simulation.snapshot.anchorCode,
    },
    results: {
      poleCount: simulation.quantities.totalPoleCount,
      plantCount: simulation.quantities.plantCount,
      wireLengthM: simulation.quantities.totalWireM,
      safetyStatus: simulation.loads?.safetyStatus ?? null,
      recommendedWireDiameterMM: simulation.loads?.recommendedWireDiameterMM ?? null,
      total: candidateTotal,
      currency: simulation.profile.currency,
    },
    deltaFromCurrent: {
      poleCount: simulation.quantities.totalPoleCount - simulation.baseline.quantities.totalPoleCount,
      plantCount: simulation.quantities.plantCount - simulation.baseline.quantities.plantCount,
      wireLengthM: simulation.quantities.totalWireM - simulation.baseline.quantities.totalWireM,
      total: baselineTotal !== null && candidateTotal !== null ? candidateTotal - baselineTotal : null,
    },
    planningStatus: simulation.planningStatus,
    warnings: simulation.warnings,
  }
}
