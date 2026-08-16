import { describe, expect, it } from 'vitest'
import { formatCents, parseMoneyToCents } from '../src/domain/money'

describe('money input parsing', () => {
  it('converts decimal Ringgit inputs to integer cents safely', () => {
    expect(parseMoneyToCents('RM 12.34')).toBe(1_234)
    expect(parseMoneyToCents('0.01')).toBe(1)
    expect(parseMoneyToCents('1,000')).toBe(100_000)
  })

  it('handles negative balances only when the caller allows them', () => {
    expect(parseMoneyToCents('-250.50')).toBeNull()
    expect(parseMoneyToCents('-250.50', { allowNegative: true })).toBe(-25_050)
  })

  it('rejects blank and invalid input', () => {
    expect(parseMoneyToCents('')).toBeNull()
    expect(parseMoneyToCents('RM nope')).toBeNull()
    expect(formatCents(1_234)).toBe('RM 12.34')
  })
})
