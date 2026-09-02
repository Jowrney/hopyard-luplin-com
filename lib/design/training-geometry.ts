import type { TrainingType } from '@/types'

export function getTrainingWireOffsets(
  trainingType: TrainingType,
  isFirstMastRow: boolean,
  isLastMastRow: boolean,
  wireOffsetM: number,
): number[] {
  if (trainingType === 'I') return [0]
  if (isFirstMastRow) return [0, wireOffsetM]
  if (isLastMastRow) return [-wireOffsetM, 0]
  return [-wireOffsetM, wireOffsetM]
}
