import { describe, expect, it } from 'vitest'
import { generateForecast } from '../src/domain/forecast'
import type { ForecastItem, ForecastSettings } from '../src/domain/types'

// This stable window is used by the hand-worked acceptance scenario and makes
// every expected balance independent of the machine's current date.
const settings: ForecastSettings = {
  openingBalanceCents: 100_000,
  startDate: '2026-08-01',
  horizonDays: 30,
}

/** Supplies valid source data so each test changes only the rule under test. */
function createItem(overrides: Partial<ForecastItem> = {}): ForecastItem {
  return {
    id: 'item',
    name: 'Item',
    type: 'expense',
    amountCents: 10_000,
    firstOccurrenceDate: '2026-08-01',
    recurrence: 'once',
    source: 'manual',
    ...overrides,
  }
}

/** Finds a daily row by its date and fails clearly if the range is incomplete. */
function dayOn(
  result: ReturnType<typeof generateForecast>,
  date: string,
) {
  const day = result.days.find((candidate) => candidate.date === date)

  if (!day) {
    throw new Error(`Expected forecast day ${date} was not generated.`)
  }

  return day
}

describe('daily forecast generation', () => {
  // These values are calculated independently by hand and protect the engine
  // against regressions in recurrence, aggregation, or running-balance logic.
  it('matches the hand-worked 30-day acceptance scenario', () => {
    const result = generateForecast(settings, [
      createItem({
        id: 'salary',
        name: 'Salary',
        type: 'income',
        amountCents: 250_000,
        firstOccurrenceDate: '2026-08-01',
        recurrence: 'monthly',
      }),
      createItem({
        id: 'rent',
        name: 'Rent',
        amountCents: 110_000,
        firstOccurrenceDate: '2026-08-02',
        recurrence: 'monthly',
      }),
      createItem({
        id: 'groceries',
        name: 'Groceries',
        amountCents: 12_000,
        firstOccurrenceDate: '2026-08-03',
        recurrence: 'weekly',
        source: 'guided-estimate',
      }),
      createItem({
        id: 'phone',
        name: 'Phone plan',
        amountCents: 4_500,
        firstOccurrenceDate: '2026-08-12',
        recurrence: 'monthly',
      }),
      createItem({
        id: 'insurance',
        name: 'Insurance',
        amountCents: 190_000,
        firstOccurrenceDate: '2026-08-20',
        recurrence: 'yearly',
      }),
    ])

    expect(dayOn(result, '2026-08-01').endingBalanceCents).toBe(350_000)
    expect(dayOn(result, '2026-08-02').endingBalanceCents).toBe(240_000)
    expect(dayOn(result, '2026-08-03').endingBalanceCents).toBe(228_000)
    expect(dayOn(result, '2026-08-17').endingBalanceCents).toBe(199_500)
    expect(dayOn(result, '2026-08-20').endingBalanceCents).toBe(9_500)
    expect(dayOn(result, '2026-08-24').endingBalanceCents).toBe(-2_500)
    expect(result.lowestBalanceDate).toBe('2026-08-24')
    expect(result.lowestBalanceCents).toBe(-2_500)
    expect(result.firstNegativeDate).toBe('2026-08-24')
  })

  it('aggregates same-day items while retaining the audit trail', () => {
    const result = generateForecast(settings, [
      createItem({ id: 'salary', type: 'income', amountCents: 250_000 }),
      createItem({ id: 'rent', name: 'Rent', amountCents: 110_000 }),
    ])
    const firstDay = dayOn(result, '2026-08-01')

    expect(firstDay.occurrences).toHaveLength(2)
    expect(firstDay.netChangeCents).toBe(140_000)
    expect(firstDay.endingBalanceCents).toBe(240_000)
  })

  it('creates stable daily rows for an empty plan', () => {
    const result = generateForecast(settings, [])

    expect(result.days).toHaveLength(30)
    expect(result.days.every((day) => day.endingBalanceCents === 100_000)).toBe(
      true,
    )
    expect(result.lowestBalanceDate).toBe('2026-08-01')
    expect(result.firstNegativeDate).toBeNull()
  })

  it('flags a negative opening balance on the forecast start date', () => {
    const result = generateForecast(
      { ...settings, openingBalanceCents: -5_000 },
      [],
    )

    expect(result.firstNegativeDate).toBe('2026-08-01')
    expect(result.lowestBalanceDate).toBe('2026-08-01')
  })

  it('keeps the earliest date when the lowest balance repeats', () => {
    const result = generateForecast(settings, [
      createItem({ amountCents: 150_000, firstOccurrenceDate: '2026-08-02' }),
    ])

    expect(result.lowestBalanceCents).toBe(-50_000)
    expect(result.lowestBalanceDate).toBe('2026-08-02')
  })
})
