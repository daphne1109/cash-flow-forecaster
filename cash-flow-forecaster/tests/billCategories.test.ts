import { describe, expect, it } from 'vitest'
import { billCategories } from '../src/guided/billCategories'

describe('bill category prompts', () => {
  it('provides distinct recognition-first categories with usable default names', () => {
    expect(billCategories.length).toBeGreaterThan(5)
    expect(new Set(billCategories.map((category) => category.id)).size).toBe(
      billCategories.length,
    )
    expect(billCategories.every((category) => category.defaultName.length > 0)).toBe(true)
  })
})
