'use client'

import styled from 'styled-components'
import { useSafeWebMCP } from '@/lib/webmcp/use-safe-webmcp'
import { listRegionalProfiles } from '@/lib/design/regional-profiles'
import { designStateToSnapshot } from '@/lib/design/store-adapter'
import { simulateDesign } from '@/lib/design/simulate-design'
import {
  CANDIDATE_LIST_INPUT_SCHEMA,
  CANDIDATE_SELECTION_INPUT_SCHEMA,
  EMPTY_INPUT_SCHEMA,
  parseCandidateListArgs,
  parseCandidateSelectionArgs,
  parseSimulationToolArgs,
  SIMULATE_DESIGN_INPUT_SCHEMA,
  simulationArgsToPatch,
  summarizeDesignSimulation,
} from '@/lib/webmcp/design-tool-contracts'
import { useCandidateStore } from '@/stores/candidateStore'
import { useDesignStore } from '@/stores/designStore'
import { usePriceStore } from '@/stores/priceStore'

const StatusBadge = styled.span<{ $active: boolean }>`
  display:inline-flex;align-items:center;gap:0.35rem;padding:0.25rem 0.55rem;
  border-radius:999px;font-size:0.68rem;font-weight:700;white-space:nowrap;
  color:${({ $active }) => $active ? '#166534' : '#6b7280'};
  background:${({ $active }) => $active ? '#dcfce7' : '#f3f4f6'};
  border:1px solid ${({ $active }) => $active ? '#86efac' : '#e5e7eb'};
`

function currentSnapshot() {
  return designStateToSnapshot(
    useDesignStore.getState(),
    usePriceStore.getState().prices,
  )
}

function currentContext() {
  const simulation = simulateDesign(currentSnapshot(), {})
  return {
    ...summarizeDesignSimulation(simulation),
    availableProfiles: listRegionalProfiles().map((profile) => profile.id),
    collaboration: {
      candidateCount: useCandidateStore.getState().visibleCandidates.length,
      previewing: useCandidateStore.getState().previewCandidate?.simulation.candidateId ?? null,
    },
  }
}

export function DesignWebMCP() {
  const hasPreview = useCandidateStore((state) => state.previewCandidate !== null)
  const reportError = (error: unknown) => console.error('WebMCP tool error:', error)

  const contextTool = useSafeWebMCP<Record<string, never>, ReturnType<typeof currentContext>>({
    name: 'get_design_context',
    description: 'Read the active hopyard design, calculated quantities, price status, safety status, and collaboration state. Use before proposing changes.',
    inputSchema: EMPTY_INPUT_SCHEMA,
    annotations: { readOnlyHint: true },
    execute: () => currentContext(),
    onError: reportError,
  })

  const profilesTool = useSafeWebMCP({
    name: 'list_regional_profiles',
    description: 'List sourced regional trellis profiles and their material specifications. Reference-only profiles do not claim live prices or local engineering approval.',
    inputSchema: EMPTY_INPUT_SCHEMA,
    annotations: { readOnlyHint: true },
    execute: () => listRegionalProfiles().map((profile) => ({
      id: profile.id,
      name: profile.name,
      market: profile.market,
      unitSystem: profile.unitSystem,
      pricing: profile.pricing,
      defaults: profile.defaults,
      materials: profile.materials.map(({ code, role, name, specification }) => ({ code, role, name, specification })),
      sources: profile.sources,
      engineeringDisclaimer: profile.engineeringDisclaimer,
    })),
    onError: reportError,
  })

  const simulationTool = useSafeWebMCP({
    name: 'simulate_design',
    description: 'Calculate a non-destructive hopyard alternative from optional changes. Returns a candidate ID for later comparison; it does not change the visible design.',
    inputSchema: SIMULATE_DESIGN_INPUT_SCHEMA,
    annotations: { readOnlyHint: true },
    execute: (rawArgs: unknown) => {
      const args = parseSimulationToolArgs(rawArgs)
      const simulation = simulateDesign(currentSnapshot(), simulationArgsToPatch(args))
      useCandidateStore.getState().addCandidate(simulation, args.label, args.rationale)
      return {
        label: args.label ?? 'Design alternative',
        rationale: args.rationale ?? '',
        ...summarizeDesignSimulation(simulation),
      }
    },
    onError: reportError,
  })

  const showTool = useSafeWebMCP({
    name: 'show_candidates',
    description: 'Show one to three previously simulated candidates in the shared comparison tray without changing the active design.',
    inputSchema: CANDIDATE_LIST_INPUT_SCHEMA,
    annotations: { readOnlyHint: false },
    execute: (rawArgs: unknown) => {
      const { candidateIds } = parseCandidateListArgs(rawArgs)
      useCandidateStore.getState().showCandidates(candidateIds)
      return {
        shown: useCandidateStore.getState().visibleCandidates.map((candidate) => ({
          candidateId: candidate.simulation.candidateId,
          label: candidate.label,
        })),
        next: 'Ask the user which candidate to preview.',
      }
    },
    onError: reportError,
  })

  const previewTool = useSafeWebMCP({
    name: 'preview_candidate',
    description: 'Temporarily apply a visible candidate to the shared 2D and 3D design UI for human review. The preview can then be applied or discarded.',
    inputSchema: CANDIDATE_SELECTION_INPUT_SCHEMA,
    annotations: { readOnlyHint: false },
    execute: (rawArgs: unknown) => {
      const { candidateId } = parseCandidateSelectionArgs(rawArgs)
      const candidate = useCandidateStore.getState().preview(candidateId)
      return {
        status: 'previewing-not-saved',
        label: candidate.label,
        ...summarizeDesignSimulation(candidate.simulation),
        next: 'Wait for explicit user approval before applying this candidate.',
      }
    },
    onError: reportError,
  })

  const applyTool = useSafeWebMCP({
    name: 'apply_candidate',
    description: 'Apply the currently previewed candidate after the user explicitly approves it. This keeps it as the active design but does not save it to the account.',
    inputSchema: EMPTY_INPUT_SCHEMA,
    annotations: { readOnlyHint: false },
    enabled: hasPreview,
    execute: () => {
      const candidate = useCandidateStore.getState().applyPreview()
      return {
        status: 'applied-to-active-design',
        candidateId: candidate.simulation.candidateId,
        label: candidate.label,
        note: 'The active design changed. Account persistence still requires the normal Save Design flow.',
      }
    },
    onError: reportError,
  })

  const discardTool = useSafeWebMCP({
    name: 'discard_preview',
    description: 'Discard the current uncommitted candidate preview and restore the exact design that was active before previewing.',
    inputSchema: EMPTY_INPUT_SCHEMA,
    annotations: { readOnlyHint: false },
    enabled: hasPreview,
    execute: () => {
      useCandidateStore.getState().discardPreview()
      return { status: 'preview-discarded', restored: true }
    },
    onError: reportError,
  })

  const states = [contextTool, profilesTool, simulationTool, showTool, previewTool, applyTool, discardTool]
  const supported = states.some((state) => state.supported)
  const registered = states.filter((state) => state.registered).length

  return (
    <StatusBadge $active={supported} title={supported ? `${registered} site tools registered` : 'Use ChatGPT browser or Chrome with WebMCP enabled'}>
      <span>{supported ? '●' : '○'}</span>
      <span>{supported ? `WebMCP ${registered}` : 'WebMCP ready'}</span>
    </StatusBadge>
  )
}
