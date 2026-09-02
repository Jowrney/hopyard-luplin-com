import { create } from 'zustand'
import {
  createCandidateWorkspace,
  type DesignCandidate,
} from '@/lib/design/candidate-workspace'
import type { DesignSimulation } from '@/lib/design/simulate-design'
import type { DesignSnapshot } from '@/lib/design/simulate-design'
import { simulateDesign } from '@/lib/design/simulate-design'
import { designStateToSnapshot, simulationToDesignState } from '@/lib/design/store-adapter'
import { useDesignStore } from '@/stores/designStore'
import { usePriceStore } from '@/stores/priceStore'

const workspace = createCandidateWorkspace()

interface CandidateStore {
  visibleCandidates: DesignCandidate[]
  previewCandidate: DesignCandidate | null
  previewOrigin: DesignSnapshot | null
  addCandidate: (simulation: DesignSimulation, label?: string, rationale?: string) => DesignCandidate
  showCandidates: (candidateIds: string[]) => void
  preview: (candidateId: string) => DesignCandidate
  applyPreview: () => DesignCandidate
  discardPreview: () => void
  clear: () => void
}

export const useCandidateStore = create<CandidateStore>()((set, get) => ({
  visibleCandidates: [],
  previewCandidate: null,
  previewOrigin: null,

  addCandidate(simulation, label, rationale) {
    return workspace.add(simulation, label, rationale)
  },

  showCandidates(candidateIds) {
    workspace.show(candidateIds)
    set({ visibleCandidates: workspace.visible(), previewCandidate: workspace.previewed() })
  },

  preview(candidateId) {
    workspace.preview(candidateId)
    const candidate = workspace.previewed()
    if (!candidate) throw new Error(`Unable to preview candidate: ${candidateId}`)
    const previewOrigin = get().previewOrigin ?? designStateToSnapshot(
      useDesignStore.getState(),
      usePriceStore.getState().prices,
    )
    useDesignStore.setState(simulationToDesignState(candidate.simulation))
    set({ previewCandidate: candidate, previewOrigin })
    return candidate
  },

  applyPreview() {
    const candidate = get().previewCandidate
    if (!candidate) throw new Error('No candidate is currently previewed.')
    workspace.clear()
    set({ visibleCandidates: [], previewCandidate: null, previewOrigin: null })
    return candidate
  },

  discardPreview() {
    const origin = get().previewOrigin
    if (origin) {
      const restored = simulateDesign(origin, {})
      useDesignStore.setState(simulationToDesignState(restored))
    }
    workspace.discardPreview()
    set({ previewCandidate: null, previewOrigin: null })
  },

  clear() {
    workspace.clear()
    set({ visibleCandidates: [], previewCandidate: null, previewOrigin: null })
  },
}))
