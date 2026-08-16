import { describe, expect, it } from 'vitest'
import { dailyLivingCategories } from '../src/guided/dailyLivingCategories'

describe('daily living category prompts', () => {
  it('covers familiar variable spending without assuming amounts', () => {
    expect(dailyLivingCategories.map((category) => category.id)).toEqual(
      expect.arrayContaining(['eating-out', 'outings', 'food-delivery']),
    )
    expect(dailyLivingCategories.every((category) => category.recurrences.length > 0)).toBe(true)
    expect(new Set(dailyLivingCategories.map((category) => category.id)).size).toBe(
      dailyLivingCategories.length,
    )
  })
})
