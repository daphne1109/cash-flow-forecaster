import {
  type ForecastItem,
  type ForecastSettings,
  isItemSource,
  isItemType,
  isRecurrence,
  validateForecastItem,
  validateForecastSettings,
} from '../domain/types'

/** Stable local-storage key. Increment its suffix when a breaking schema change is introduced. */
export const FORECAST_STORAGE_KEY = 'cash-flow-forecaster:plan:v1'

/** The only source data persisted by this local-first prototype. */
export interface PersistedPlan {
  version: 1
  settings: ForecastSettings
  items: ForecastItem[]
}

/** Small adapter that makes storage behaviour testable without a browser. */
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * Loads a valid saved plan, or returns null when storage is empty, unavailable,
 * corrupt, or incompatible. Callers can safely show a blank-plan state in all
 * null cases without exposing implementation errors to the user.
 */
export function loadPlan(storage: StorageAdapter | null = getBrowserStorage()): PersistedPlan | null {
  if (storage === null) {
    return null
  }

  try {
    const rawValue = storage.getItem(FORECAST_STORAGE_KEY)
    if (rawValue === null) {
      return null
    }

    const parsedValue: unknown = JSON.parse(rawValue)

    return isPersistedPlan(parsedValue) ? parsedValue : null
  } catch {
    // Local storage can fail in private/restricted browser contexts. Persistence
    // must never stop a user from using the forecast in the current session.
    return null
  }
}

/**
 * Saves validated source records and reports whether the browser accepted them.
 * Derived forecast rows are deliberately not persisted; they are regenerated
 * from the saved inputs so stale calculation results cannot survive a reload.
 */
export function savePlan(
  plan: PersistedPlan,
  storage: StorageAdapter | null = getBrowserStorage(),
): boolean {
  if (storage === null || !isPersistedPlan(plan)) {
    return false
  }

  try {
    storage.setItem(FORECAST_STORAGE_KEY, JSON.stringify(plan))
    return true
  } catch {
    return false
  }
}

/**
 * Removes only this app's persisted plan, without touching other site data.
 * The boolean lets callers reset in-memory state even if a restricted browser
 * refuses the local-storage write.
 */
export function clearPlan(
  storage: StorageAdapter | null = getBrowserStorage(),
): boolean {
  if (storage === null) {
    return false
  }

  try {
    storage.removeItem(FORECAST_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

/**
 * Resolves browser storage lazily so domain/storage tests can run in Node and
 * future server rendering does not access `window` during module evaluation.
 */
function getBrowserStorage(): StorageAdapter | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Runtime validation for untrusted JSON restored from browser storage. */
function isPersistedPlan(value: unknown): value is PersistedPlan {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.settings)) {
    return false
  }

  if (!Array.isArray(value.items)) {
    return false
  }

  const settings = toForecastSettings(value.settings)
  if (settings === null || !validateForecastSettings(settings).isValid) {
    return false
  }

  return value.items.every((item) => {
    const forecastItem = toForecastItem(item)

    return forecastItem !== null && validateForecastItem(forecastItem).isValid
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toForecastSettings(
  value: Record<string, unknown>,
): ForecastSettings | null {
  if (
    typeof value.openingBalanceCents !== 'number' ||
    !Number.isSafeInteger(value.openingBalanceCents) ||
    typeof value.startDate !== 'string' ||
    value.horizonDays !== 30
  ) {
    return null
  }

  return {
    openingBalanceCents: value.openingBalanceCents,
    startDate: value.startDate,
    horizonDays: 30,
  }
}

function toForecastItem(value: unknown): ForecastItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isItemType(value.type) ||
    typeof value.amountCents !== 'number' ||
    !Number.isSafeInteger(value.amountCents) ||
    typeof value.firstOccurrenceDate !== 'string' ||
    !isRecurrence(value.recurrence) ||
    !isItemSource(value.source)
  ) {
    return null
  }

  if (value.customIntervalDays !== undefined && (!Number.isSafeInteger(value.customIntervalDays))) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    type: value.type,
    amountCents: value.amountCents,
    firstOccurrenceDate: value.firstOccurrenceDate,
    recurrence: value.recurrence,
    customIntervalDays: value.customIntervalDays as number | undefined,
    source: value.source,
  }
}
