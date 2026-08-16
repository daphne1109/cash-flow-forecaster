import { addDays, daysInInclusiveRange } from './date'
import { expandOccurrences } from './occurrences'
import {
  type DailyForecast,
  type DateKey,
  type ForecastItem,
  type ForecastResult,
  type ForecastSettings,
  type Occurrence,
  validateForecastSettings,
} from './types'

/**
 * Produces the complete, auditable daily forecast for a fixed 30-day window.
 *
 * The function accepts only source records and returns derived data; it has no
 * dependency on React, storage, or the current date. This keeps the core
 * financial calculation deterministic and straightforward to verify.
 */
export function generateForecast(
  settings: ForecastSettings,
  items: ForecastItem[],
): ForecastResult {
  assertValidSettings(settings)

  const endDate = addDays(settings.startDate, settings.horizonDays - 1)
  const occurrencesByDate = createOccurrenceIndex(
    items,
    settings.startDate,
    endDate,
  )
  const days = buildDailyForecast(
    settings.openingBalanceCents,
    settings.startDate,
    endDate,
    occurrencesByDate,
  )

  return summariseForecast(days)
}

function assertValidSettings(settings: ForecastSettings): void {
  const validation = validateForecastSettings(settings)

  if (!validation.isValid) {
    throw new RangeError(`Invalid forecast settings: ${validation.errors.join(' ')}`)
  }
}

/**
 * Creates a single date-keyed ledger from every item before balance arithmetic
 * begins. This prevents UI ordering or item insertion order from affecting a
 * day's net result.
 */
function createOccurrenceIndex(
  items: ForecastItem[],
  startDate: DateKey,
  endDate: DateKey,
): Map<DateKey, Occurrence[]> {
  const occurrencesByDate = new Map<DateKey, Occurrence[]>()

  for (const item of items) {
    for (const occurrence of expandOccurrences(item, startDate, endDate)) {
      const existing = occurrencesByDate.get(occurrence.date) ?? []
      existing.push(occurrence)
      occurrencesByDate.set(occurrence.date, existing)
    }
  }

  return occurrencesByDate
}

function buildDailyForecast(
  openingBalanceCents: number,
  startDate: DateKey,
  endDate: DateKey,
  occurrencesByDate: Map<DateKey, Occurrence[]>,
): DailyForecast[] {
  // The opening balance represents the amount before start-date transactions;
  // each daily row therefore reports the balance at that day's end.
  let runningBalanceCents = openingBalanceCents

  return daysInInclusiveRange(startDate, endDate).map((date) => {
    const occurrences = occurrencesByDate.get(date) ?? []
    const netChangeCents = occurrences.reduce(
      (sum, occurrence) => sum + occurrence.signedAmountCents,
      0,
    )
    runningBalanceCents += netChangeCents

    return {
      date,
      occurrences,
      netChangeCents,
      endingBalanceCents: runningBalanceCents,
    }
  })
}

/** Extracts the user-facing risk insights from already-calculated daily rows. */
function summariseForecast(days: DailyForecast[]): ForecastResult {
  // Settings validation guarantees 30 rows. This defensive check keeps the
  // result contract safe if the implementation changes in the future.
  if (days.length === 0) {
    throw new RangeError('A forecast must contain at least one day.')
  }

  let lowestBalanceCents = days[0].endingBalanceCents
  let lowestBalanceDate = days[0].date
  let firstNegativeDate: DateKey | null = null

  for (const day of days) {
    // Strictly lower preserves the earliest date when the lowest balance ties.
    if (day.endingBalanceCents < lowestBalanceCents) {
      lowestBalanceCents = day.endingBalanceCents
      lowestBalanceDate = day.date
    }

    // A negative opening balance is correctly detected on the first day even
    // when no scheduled item occurs there.
    if (firstNegativeDate === null && day.endingBalanceCents < 0) {
      firstNegativeDate = day.date
    }
  }

  return { days, lowestBalanceCents, lowestBalanceDate, firstNegativeDate }
}
