import type { DesignSimulation } from '@/lib/design/simulate-design'

export interface DesignCandidate {
  simulation: DesignSimulation
  label: string
  rationale: string
}

export interface CandidateWorkspace {
  add(simulation: DesignSimulation, label?: string, rationale?: string): DesignCandidate
  show(candidateIds: string[]): void
  preview(candidateId: string): void
  discardPreview(): void
  get(candidateId: string): DesignCandidate | undefined
  visible(): DesignCandidate[]
  previewed(): DesignCandidate | null
  clear(): void
}

export function createCandidateWorkspace(): CandidateWorkspace {
  const candidates = new Map<string, DesignCandidate>()
  let visibleIds: string[] = []
  let previewId: string | null = null

  return {
    add(simulation, label = 'Design alternative', rationale = '') {
      const candidate = { simulation, label, rationale }
      candidates.set(simulation.candidateId, candidate)
      return candidate
    },

    show(candidateIds) {
      if (candidateIds.length < 1 || candidateIds.length > 3) {
        throw new Error('Candidate comparison requires between 1 and 3 candidates.')
      }
      for (const candidateId of candidateIds) {
        if (!candidates.has(candidateId)) throw new Error(`Unknown candidate: ${candidateId}`)
      }
      visibleIds = [...new Set(candidateIds)]
      if (previewId && !visibleIds.includes(previewId)) previewId = null
    },

    preview(candidateId) {
      if (!visibleIds.includes(candidateId)) {
        throw new Error(`Candidate must be visible before preview: ${candidateId}`)
      }
      previewId = candidateId
    },

    discardPreview() {
      previewId = null
    },

    get(candidateId) {
      return candidates.get(candidateId)
    },

    visible() {
      return visibleIds.flatMap((candidateId) => {
        const candidate = candidates.get(candidateId)
        return candidate ? [candidate] : []
      })
    },

    previewed() {
      return previewId ? candidates.get(previewId) ?? null : null
    },

    clear() {
      candidates.clear()
      visibleIds = []
      previewId = null
    },
  }
}
