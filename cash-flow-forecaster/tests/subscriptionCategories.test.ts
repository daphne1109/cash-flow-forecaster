import { describe, expect, it } from 'vitest'
import { subscriptionCategories } from '../src/guided/subscriptionCategories'

describe('subscription category prompts', () => {
  it('includes common media, storage, productivity, and hosting services', () => {
    const labels = subscriptionCategories.map((category) => category.label)

    expect(labels).toEqual(expect.arrayContaining([
      'Spotify',
      'YouTube Premium',
      'Apple iCloud',
      'Hostinger',
      'Other subscription',
    ]))
    expect(new Set(subscriptionCategories.map((category) => category.id)).size).toBe(
      subscriptionCategories.length,
    )
  })
})
