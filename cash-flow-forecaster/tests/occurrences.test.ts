import { describe, expect, it } from 'vitest'
import type { ForecastItem } from '../src/domain/types'
import { expandOccurrences } from '../src/domain/occurrences'

/**
 * Creates a valid baseline item so each test can isolate one recurrence rule
 * or boundary condition without repeating unrelated valid input.
 */
function createItem(overrides: Partial<ForecastItem> = {}): ForecastItem {
  return {
    id: 'groceries',
    name: 'Groceries',
    type: 'expense',
    amountCents: 12_000,
    firstOccurrenceDate: '2026-08-03',
    recurrence: 'weekly',
    source: 'guided-estimate',
    ...overrides,
  }
}

describe('recurrence expansion', () => {
  // The final day is inclusive: forecast calculation must not lose a payment
  // simply because it falls at the boundary of the selected 30-day window.
  it('includes a one-off item only when it falls inside the inclusive window', () => {
    const inWindow = expandOccurrences(
      createItem({ recurrence: 'once', firstOccurrenceDate: '2026-08-30' }),
      '2026-08-01',
      '2026-08-30',
    )
    const beforeWindow = expandOccurrences(
      createItem({ recurrence: 'once', firstOccurrenceDate: '2026-07-31' }),
      '2026-08-01',
      '2026-08-30',
    )

    expect(inWindow).toHaveLength(1)
    expect(inWindow[0]?.date).toBe('2026-08-30')
    expect(beforeWindow).toEqual([])
  })

  it('fast-forwards a backdated weekly series into the forecast window', () => {
    const occurrences = expandOccurrences(
      createItem({ firstOccurrenceDate: '2026-07-01' }),
      '2026-08-01',
      '2026-08-30',
    )

    expect(occurrences.map((occurrence) => occurrence.date)).toEqual([
      '2026-08-05',
      '2026-08-12',
      '2026-08-19',
      '2026-08-26',
    ])
  })

  it('fast-forwards backdated biweekly, monthly, and yearly series', () => {
    const biweekly = expandOccurrences(
      createItem({ firstOccurrenceDate: '2026-07-01', recurrence: 'biweekly' }),
      '2026-08-01',
      '2026-08-31',
    )
    const monthly = expandOccurrences(
      createItem({ firstOccurrenceDate: '2026-01-15', recurrence: 'monthly' }),
      '2026-08-01',
      '2026-08-30',
    )
    const yearly = expandOccurrences(
      createItem({ firstOccurrenceDate: '2025-08-20', recurrence: 'yearly' }),
      '2026-08-01',
      '2026-08-30',
    )

    expect(biweekly.map((occurrence) => occurrence.date)).toEqual([
      '2026-08-12',
      '2026-08-26',
    ])
    expect(monthly.map((occurrence) => occurrence.date)).toEqual(['2026-08-15'])
    expect(yearly.map((occurrence) => occurrence.date)).toEqual(['2026-08-20'])
  })

  it('returns signed cents for income and expense items', () => {
    const expense = expandOccurrences(
      createItem({ amountCents: 1_234, recurrence: 'once' }),
      '2026-08-01',
      '2026-08-30',
    )
    const income = expandOccurrences(
      createItem({
        id: 'salary',
        name: 'Salary',
        type: 'income',
        amountCents: 250_000,
        recurrence: 'once',
      }),
      '2026-08-01',
      '2026-08-30',
    )

    expect(expense[0]?.signedAmountCents).toBe(-1_234)
    expect(income[0]?.signedAmountCents).toBe(250_000)
  })

  it('rejects an inverted forecast window', () => {
    expect(() =>
      expandOccurrences(createItem(), '2026-08-30', '2026-08-01'),
    ).toThrow(RangeError)
  })
})
