import type { Recurrence } from '../domain/types'

/**
 * Common variable expenses that people recall as routines rather than bills.
 *
 * These are recognition prompts only. Their amounts and dates remain entirely
 * user-provided, while the recurrence options model a usual spending cadence.
 */
export const dailyLivingCategories = [
  { id: 'eating-out', label: 'Eating out', defaultName: 'Eating out', recurrences: ['weekly', 'biweekly'] },
  { id: 'coffee-drinks', label: 'Coffee / drinks', defaultName: 'Coffee and drinks', recurrences: ['weekly', 'biweekly'] },
  { id: 'food-delivery', label: 'Food delivery', defaultName: 'Food delivery', recurrences: ['weekly', 'biweekly'] },
  { id: 'outings', label: 'Outings / entertainment', defaultName: 'Outings and entertainment', recurrences: ['weekly', 'biweekly', 'monthly'] },
  { id: 'shopping', label: 'Shopping', defaultName: 'Shopping', recurrences: ['biweekly', 'monthly'] },
  { id: 'personal-care', label: 'Personal care', defaultName: 'Personal care', recurrences: ['monthly'] },
  { id: 'gym-sports', label: 'Gym / sports', defaultName: 'Gym and sports', recurrences: ['weekly', 'monthly'] },
  { id: 'hobbies', label: 'Hobbies', defaultName: 'Hobbies', recurrences: ['weekly', 'monthly'] },
  { id: 'other', label: 'Other day-to-day cost', defaultName: 'Other day-to-day cost', recurrences: ['weekly', 'biweekly', 'monthly'] },
] as const satisfies readonly {
  id: string
  label: string
  defaultName: string
  recurrences: readonly Recurrence[]
}[]

export type DailyLivingCategory = (typeof dailyLivingCategories)[number]
