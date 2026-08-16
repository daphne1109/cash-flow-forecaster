import { isValidDateKey } from './date'

/**
 * Pure domain contracts for the cash-flow engine.
 *
 * Dates are local calendar keys in YYYY-MM-DD form. Money is represented as
 * integer cents; formatting and decimal input belong at the UI boundary.
 */
export type DateKey = string

export type ItemType = 'income' | 'expense'
export type Recurrence = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom'
export type ItemSource = 'guided-estimate' | 'manual'

/** Source data supplied directly by the user or created from guided prompts. */
export interface ForecastItem {
  id: string
  name: string
  type: ItemType
  amountCents: number
  firstOccurrenceDate: DateKey
  recurrence: Recurrence
  /** Required for custom recurrence; the number of days between occurrences. */
  customIntervalDays?: number
  source: ItemSource
}

export interface ForecastSettings {
  openingBalanceCents: number
  startDate: DateKey
  horizonDays: 30
}

/** A single dated effect produced after recurrence expansion. */
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

/** Derived 30-day output used by both the ledger and chart. */
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

// Keep accepted values centralised so runtime validation and TypeScript's
// compile-time unions cannot drift apart as new UI flows are added.
const ITEM_TYPES: readonly ItemType[] = ['income', 'expense']
const RECURRENCES: readonly Recurrence[] = [
  'once',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'yearly',
  'custom',
]
const ITEM_SOURCES: readonly ItemSource[] = ['guided-estimate', 'manual']

/** Narrows unknown input to a supported item direction. */
export function isItemType(value: unknown): value is ItemType {
  return typeof value === 'string' && ITEM_TYPES.includes(value as ItemType)
}

/** Narrows unknown input to a recurrence the forecast engine can expand. */
export function isRecurrence(value: unknown): value is Recurrence {
  return typeof value === 'string' && RECURRENCES.includes(value as Recurrence)
}

/** Narrows unknown input to a transparent item-origin marker. */
export function isItemSource(value: unknown): value is ItemSource {
  return typeof value === 'string' && ITEM_SOURCES.includes(value as ItemSource)
}

export { isValidDateKey } from './date'

/**
 * Validates one source item before it reaches recurrence expansion.
 *
 * This function does not mutate data or format user-facing text, which makes it
 * safe to use from forms, local-storage recovery, and future server boundaries.
 */
export function validateForecastItem(item: ForecastItem): ValidationResult {
  const errors: string[] = []

  if (!item.id.trim()) {
    errors.push('An item must have an id.')
  }

  // Names are user-visible ledger labels, so reject blank and impractically
  // long values at the domain boundary rather than only in a form component.
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

  if (
    item.recurrence === 'custom' &&
    (!Number.isSafeInteger(item.customIntervalDays) ||
      item.customIntervalDays === undefined ||
      item.customIntervalDays < 2 ||
      item.customIntervalDays > 365)
  ) {
    errors.push('Custom recurrence must repeat every 2 to 365 days.')
  }

  if (!isItemSource(item.source)) {
    errors.push('Item source must be manual or guided-estimate.')
  }

  if (isValidDateKey(item.firstOccurrenceDate)) {
    const [, monthText, dayText] = item.firstOccurrenceDate.split('-')
    const month = Number(monthText)
    const day = Number(dayText)

    // Days 1-28 exist in every month, keeping the monthly recurrence policy
    // deterministic rather than introducing an undocumented fallback.
    if (item.recurrence === 'monthly' && day > 28) {
      errors.push('Monthly items must use days 1 through 28.')
    }

    // A yearly 29 February needs a product policy for non-leap years; this
    // small prototype rejects it rather than guessing on the user's behalf.
    if (item.recurrence === 'yearly' && month === 2 && day === 29) {
      errors.push('Yearly items cannot use February 29.')
    }
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Validates the immutable inputs that define a 30-day forecast window.
 *
 * Negative opening balances are intentional: later forecast logic needs to
 * report the start date as the first negative day in that situation.
 */
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
