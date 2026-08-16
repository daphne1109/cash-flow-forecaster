import { describe, expect, it } from 'vitest'
import { createDemoPlan } from '../src/storage/demoPlan'
import {
  FORECAST_STORAGE_KEY,
  type StorageAdapter,
  loadPlan,
  savePlan,
} from '../src/storage/forecastStore'

/** In-memory storage lets these tests exercise browser failure paths in Node. */
function createMemoryStorage(): StorageAdapter & { values: Map<string, string> } {
  const values = new Map<string, string>()

  return {
    values,
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}

describe('forecast plan storage', () => {
  it('round-trips validated source data through storage', () => {
    const storage = createMemoryStorage()
    const plan = createDemoPlan()

    expect(savePlan(plan, storage)).toBe(true)
    expect(loadPlan(storage)).toEqual(plan)
  })

  it('rejects corrupt and schema-incompatible stored values safely', () => {
    const storage = createMemoryStorage()
    storage.values.set(FORECAST_STORAGE_KEY, '{not valid JSON')

    expect(loadPlan(storage)).toBeNull()

    storage.values.set(
      FORECAST_STORAGE_KEY,
      JSON.stringify({ version: 1, settings: {}, items: [] }),
    )
    expect(loadPlan(storage)).toBeNull()
  })

  it('does not save a plan with invalid source data', () => {
    const storage = createMemoryStorage()
    const invalidPlan = createDemoPlan()
    invalidPlan.items[0]!.amountCents = 12.5

    expect(savePlan(invalidPlan, storage)).toBe(false)
    expect(storage.values.has(FORECAST_STORAGE_KEY)).toBe(false)
  })

  it('handles unavailable storage without throwing', () => {
    const unavailableStorage: StorageAdapter = {
      getItem() {
        throw new Error('Storage is unavailable')
      },
      setItem() {
        throw new Error('Storage is unavailable')
      },
    }

    expect(loadPlan(unavailableStorage)).toBeNull()
    expect(savePlan(createDemoPlan(), unavailableStorage)).toBe(false)
  })
})
