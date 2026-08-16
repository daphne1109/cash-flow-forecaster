import { describe, expect, it } from 'vitest'
import {
  type ForecastItem,
  type ForecastSettings,
  isValidDateKey,
  validateForecastItem,
  validateForecastSettings,
} from '../src/domain/types'

const validItem: ForecastItem = {
  id: 'groceries',
  name: 'Groceries',
  type: 'expense',
  amountCents: 12_034,
  firstOccurrenceDate: '2026-08-03',
  recurrence: 'weekly',
  source: 'guided-estimate',
}

const validSettings: ForecastSettings = {
  openingBalanceCents: 100_000,
  startDate: '2026-08-01',
  horizonDays: 30,
}

describe('date keys', () => {
  it('accepts real calendar dates and rejects impossible ones', () => {
    expect(isValidDateKey('2026-08-01')).toBe(true)
    expect(isValidDateKey('2028-02-29')).toBe(true)
    expect(isValidDateKey('2026-02-29')).toBe(false)
    expect(isValidDateKey('2026-02-30')).toBe(false)
    expect(isValidDateKey('08/01/2026')).toBe(false)
  })
})

describe('forecast item validation', () => {
  it('accepts a valid guided estimate', () => {
    expect(validateForecastItem(validItem)).toEqual({
      isValid: true,
      errors: [],
    })
  })

  it('requires an integer positive cents amount', () => {
    const result = validateForecastItem({ ...validItem, amountCents: 123.4 })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      'Item amount must be a positive integer number of cents.',
    )
  })

  it('keeps monthly and yearly recurrence edge cases explicit', () => {
    const monthly = validateForecastItem({
      ...validItem,
      firstOccurrenceDate: '2026-01-31',
      recurrence: 'monthly',
    })
    const yearly = validateForecastItem({
      ...validItem,
      firstOccurrenceDate: '2028-02-29',
      recurrence: 'yearly',
    })

    expect(monthly.errors).toContain('Monthly items must use days 1 through 28.')
    expect(yearly.errors).toContain('Yearly items cannot use February 29.')
  })
})

describe('forecast settings validation', () => {
  it('allows a negative opening balance', () => {
    expect(
      validateForecastSettings({ ...validSettings, openingBalanceCents: -5_000 }),
    ).toEqual({ isValid: true, errors: [] })
  })

  it('rejects a horizon outside the agreed prototype scope', () => {
    const result = validateForecastSettings({
      ...validSettings,
      horizonDays: 60 as 30,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      'This version supports a fixed 30-day forecast horizon.',
    )
  })
})
