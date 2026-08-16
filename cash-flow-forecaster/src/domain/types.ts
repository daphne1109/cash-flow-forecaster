/**
 * Pure domain contracts for the cash-flow engine.
 *
 * Dates are local calendar keys in YYYY-MM-DD form. Money is represented as
 * integer cents; formatting and decimal input belong at the UI boundary.
 */
export type DateKey = string

export type ItemType = 'income' | 'expense'
export type Recurrence = 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type ItemSource = 'guided-estimate' | 'manual'

export interface ForecastItem {
  id: string
  name: string
  type: ItemType
  amountCents: number
  firstOccurrenceDate: DateKey
  recurrence: Recurrence
  source: ItemSource
}

export interface ForecastSettings {
  openingBalanceCents: number
  startDate: DateKey
  horizonDays: 30
}

export interface Occurrence {
  itemId: string
  itemName: string
  date: DateKey
  signedAmountCents: number
}

export interface DailyForecast {
  date: DateKey
  occurrences: Occurrence[]
  netChangeCents: number
  endingBalanceCents: number
}

export interface ForecastResult {
  days: DailyForecast[]
  lowestBalanceCents: number
  lowestBalanceDate: DateKey
  firstNegativeDate: DateKey | null
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

const ITEM_TYPES: readonly ItemType[] = ['income', 'expense']
const RECURRENCES: readonly Recurrence[] = [
  'once',
  'weekly',
  'biweekly',
  'monthly',
  'yearly',
]
const ITEM_SOURCES: readonly ItemSource[] = ['guided-estimate', 'manual']
export function isItemType(value: unknown): value is ItemType {
  return typeof value === 'string' && ITEM_TYPES.includes(value as ItemType)
}

export function isRecurrence(value: unknown): value is Recurrence {
  return typeof value === 'string' && RECURRENCES.includes(value as Recurrence)
}

export function isItemSource(value: unknown): value is ItemSource {
  return typeof value === 'string' && ITEM_SOURCES.includes(value as ItemSource)
}

export { isValidDateKey } from './date'

export function validateForecastItem(item: ForecastItem): ValidationResult {
  const errors: string[] = []

  if (!item.id.trim()) {
    errors.push('An item must have an id.')
  }

  const trimmedName = item.name.trim()
  if (trimmedName.length === 0 || trimmedName.length > 60) {
    errors.push('Item name must contain between 1 and 60 characters.')
  }

  if (!isItemType(item.type)) {
    errors.push('Item type must be income or expense.')
  }

  if (!Number.isSafeInteger(item.amountCents) || item.amountCents <= 0) {
    errors.push('Item amount must be a positive integer number of cents.')
  }

  if (!isValidDateKey(item.firstOccurrenceDate)) {
    errors.push('First occurrence date must be a real YYYY-MM-DD date.')
  }

  if (!isRecurrence(item.recurrence)) {
    errors.push('Item recurrence is not supported.')
  }

  if (!isItemSource(item.source)) {
    errors.push('Item source must be manual or guided-estimate.')
  }

  if (isValidDateKey(item.firstOccurrenceDate)) {
    const [, monthText, dayText] = item.firstOccurrenceDate.split('-')
    const month = Number(monthText)
    const day = Number(dayText)

    if (item.recurrence === 'monthly' && day > 28) {
      errors.push('Monthly items must use days 1 through 28.')
    }

    if (item.recurrence === 'yearly' && month === 2 && day === 29) {
      errors.push('Yearly items cannot use February 29.')
    }
  }

  return { isValid: errors.length === 0, errors }
}

export function validateForecastSettings(
  settings: ForecastSettings,
): ValidationResult {
  const errors: string[] = []

  if (!Number.isSafeInteger(settings.openingBalanceCents)) {
    errors.push('Opening balance must be an integer number of cents.')
  }

  if (!isValidDateKey(settings.startDate)) {
    errors.push('Forecast start date must be a real YYYY-MM-DD date.')
  }

  if (settings.horizonDays !== 30) {
    errors.push('This version supports a fixed 30-day forecast horizon.')
  }

  return { isValid: errors.length === 0, errors }
}
import { isValidDateKey } from './date'
