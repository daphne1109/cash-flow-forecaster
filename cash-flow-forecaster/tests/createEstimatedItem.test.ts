import { describe, expect, it } from 'vitest'
import { createEstimatedItem } from '../src/guided/createEstimatedItem'

describe('guided estimates', () => {
  it('creates a normal forecast item marked as an estimate', () => {
    expect(
      createEstimatedItem({
        id: 'groceries',
        name: 'Groceries',
        type: 'expense',
        amountCents: 12_000,
        firstOccurrenceDate: '2026-08-03',
        recurrence: 'weekly',
      }),
    ).toEqual({
      id: 'groceries',
      name: 'Groceries',
      type: 'expense',
      amountCents: 12_000,
      firstOccurrenceDate: '2026-08-03',
      recurrence: 'weekly',
      source: 'guided-estimate',
    })
  })
})
