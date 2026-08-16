import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  addYears,
  compareDateKeys,
  daysInInclusiveRange,
  formatDateKey,
  parseDateKey,
} from '../src/domain/date'

describe('local calendar dates', () => {
  it('parses and formats date-only values without timestamps', () => {
    expect(parseDateKey('2026-08-01')).toEqual({ year: 2026, month: 8, day: 1 })
    expect(formatDateKey({ year: 2026, month: 8, day: 1 })).toBe('2026-08-01')
    expect(() => parseDateKey('2026-02-30')).toThrow(RangeError)
  })

  it('compares calendar keys in date order', () => {
    expect(compareDateKeys('2026-08-01', '2026-08-01')).toBe(0)
    expect(compareDateKeys('2026-08-01', '2026-08-02')).toBeLessThan(0)
    expect(compareDateKeys('2026-08-02', '2026-08-01')).toBeGreaterThan(0)
  })

  it('adds days over month boundaries', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('adds valid calendar months and years without silently changing the day', () => {
    expect(addMonths('2026-01-28', 1)).toBe('2026-02-28')
    expect(addYears('2024-02-28', 1)).toBe('2025-02-28')
    expect(() => addMonths('2026-01-31', 1)).toThrow(RangeError)
    expect(() => addYears('2024-02-29', 1)).toThrow(RangeError)
  })

  it('builds an inclusive date range', () => {
    const dates = daysInInclusiveRange('2026-08-01', '2026-08-30')

    expect(dates).toHaveLength(30)
    expect(dates[0]).toBe('2026-08-01')
    expect(dates.at(-1)).toBe('2026-08-30')
    expect(() => daysInInclusiveRange('2026-08-02', '2026-08-01')).toThrow(
      RangeError,
    )
  })
})
