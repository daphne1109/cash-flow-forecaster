import type { ForecastItem, ItemType, Recurrence } from '../domain/types'

/** Input collected from one guided money-discovery question. */
export interface GuidedEstimateInput {
  id: string
  name: string
  type: ItemType
  amountCents: number
  firstOccurrenceDate: string
  recurrence: Recurrence
  customIntervalDays?: number
}

/**
 * Converts a guided answer into the same source model used for manual items.
 * `source` is the only distinction, preserving transparency without creating a
 * second calculation path for estimates.
 */
export function createEstimatedItem(
  input: GuidedEstimateInput,
): ForecastItem {
  return { ...input, source: 'guided-estimate' }
}
