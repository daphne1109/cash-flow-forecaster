import {
  addDays,
  addMonths,
  addYears,
  compareDateKeys,
  differenceInCalendarDays,
  isValidDateKey,
  parseDateKey,
} from './date'
import {
  type DateKey,
  type ForecastItem,
  type Occurrence,
  validateForecastItem,
} from './types'

/**
 * Recurrence expansion for the forecast domain.
 *
 * Source items remain compact records; this module is the only place that
 * translates their recurrence rules into the dated cash movements consumed by
 * the daily forecast calculation.
 */

/**
 * Converts one scheduled item into every dated occurrence inside an inclusive
 * forecast window. The result is intentionally independent of React and
 * storage so it can be tested and reused by the forecast engine.
 */
export function expandOccurrences(
  item: ForecastItem,
  startDate: DateKey,
  endDate: DateKey,
): Occurrence[] {
  assertValidItem(item)
  assertValidWindow(startDate, endDate)

  const firstInWindow = findFirstOccurrenceInWindow(item, startDate)
  if (firstInWindow === null || compareDateKeys(firstInWindow, endDate) > 0) {
    return []
  }

  const occurrences: Occurrence[] = []
  let currentDate: DateKey | null = firstInWindow

  while (currentDate !== null && compareDateKeys(currentDate, endDate) <= 0) {
    occurrences.push({
      itemId: item.id,
      itemName: item.name,
      date: currentDate,
      signedAmountCents:
        item.type === 'income' ? item.amountCents : -item.amountCents,
    })
    currentDate = nextOccurrenceDate(item, currentDate)
  }

  return occurrences
}

function assertValidItem(item: ForecastItem): void {
  const validation = validateForecastItem(item)

  if (!validation.isValid) {
    throw new RangeError(`Invalid forecast item: ${validation.errors.join(' ')}`)
  }
}

/** Guards the inclusive date range expected by every recurrence algorithm. */
function assertValidWindow(startDate: DateKey, endDate: DateKey): void {
  if (!isValidDateKey(startDate) || !isValidDateKey(endDate)) {
    throw new RangeError('Forecast window dates must be real YYYY-MM-DD dates.')
  }

  if (compareDateKeys(startDate, endDate) > 0) {
    throw new RangeError('Forecast window start must be on or before its end.')
  }
}

/**
 * Finds the first occurrence on or after the forecast start. This is the key
 * backdating rule: an item can start months or years earlier and must still
 * contribute its future occurrences instead of being discarded.
 */
function findFirstOccurrenceInWindow(
  item: ForecastItem,
  startDate: DateKey,
): DateKey | null {
  const firstDate = item.firstOccurrenceDate

  if (compareDateKeys(firstDate, startDate) >= 0) {
    return firstDate
  }

  switch (item.recurrence) {
    case 'once':
      return null
    case 'daily':
      return fastForwardByDays(firstDate, startDate, 1)
    case 'weekly':
      return fastForwardByDays(firstDate, startDate, 7)
    case 'biweekly':
      return fastForwardByDays(firstDate, startDate, 14)
    case 'monthly':
      return fastForwardByMonths(firstDate, startDate)
    case 'yearly':
      return fastForwardByYears(firstDate, startDate)
    case 'custom':
      return fastForwardByDays(firstDate, startDate, item.customIntervalDays!)
  }
}

function fastForwardByDays(
  firstDate: DateKey,
  startDate: DateKey,
  intervalDays: number,
): DateKey {
  const daysUntilStart = differenceInCalendarDays(firstDate, startDate)
  // Ceiling division preserves the recurrence's original cadence. For example,
  // a 1 July weekly item produces 5 August, not an arbitrary 1 August entry.
  const intervalsToSkip = Math.ceil(daysUntilStart / intervalDays)

  return addDays(firstDate, intervalsToSkip * intervalDays)
}

function fastForwardByMonths(firstDate: DateKey, startDate: DateKey): DateKey {
  const first = parseDateKey(firstDate)
  const start = parseDateKey(startDate)
  const monthsUntilStart =
    (start.year - first.year) * 12 + (start.month - first.month)
  let candidate = addMonths(firstDate, monthsUntilStart)

  // The same calendar month may still be before the window when the scheduled
  // day is earlier than the forecast start day.
  if (compareDateKeys(candidate, startDate) < 0) {
    candidate = addMonths(candidate, 1)
  }

  return candidate
}

function fastForwardByYears(firstDate: DateKey, startDate: DateKey): DateKey {
  const first = parseDateKey(firstDate)
  const start = parseDateKey(startDate)
  let candidate = addYears(firstDate, start.year - first.year)

  // A matching year is not sufficient when that year's scheduled date has
  // already passed before the forecast start.
  if (compareDateKeys(candidate, startDate) < 0) {
    candidate = addYears(candidate, 1)
  }

  return candidate
}

/** Returns the following occurrence date, or null for a one-off item. */
function nextOccurrenceDate(
  item: ForecastItem,
  currentDate: DateKey,
): DateKey | null {
  switch (item.recurrence) {
    case 'once':
      return null
    case 'daily':
      return addDays(currentDate, 1)
    case 'weekly':
      return addDays(currentDate, 7)
    case 'biweekly':
      return addDays(currentDate, 14)
    case 'monthly':
      return addMonths(currentDate, 1)
    case 'yearly':
      return addYears(currentDate, 1)
    case 'custom':
      return addDays(currentDate, item.customIntervalDays!)
  }
}
