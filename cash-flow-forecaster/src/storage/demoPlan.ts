import type { PersistedPlan } from './forecastStore'

/**
 * Returns fresh predictable source data for the first-run demo.
 *
 * It mirrors the documented acceptance scenario and never reuses an object
 * reference, so edits in the UI cannot mutate later demo loads or test data.
 */
export function createDemoPlan(): PersistedPlan {
  return {
    version: 1,
    settings: {
      openingBalanceCents: 100_000,
      startDate: '2026-08-01',
      horizonDays: 30,
    },
    items: [
      {
        id: 'demo-salary',
        name: 'Salary',
        type: 'income',
        amountCents: 250_000,
        firstOccurrenceDate: '2026-08-01',
        recurrence: 'monthly',
        source: 'manual',
      },
      {
        id: 'demo-rent',
        name: 'Rent',
        type: 'expense',
        amountCents: 110_000,
        firstOccurrenceDate: '2026-08-02',
        recurrence: 'monthly',
        source: 'manual',
      },
      {
        id: 'demo-groceries',
        name: 'Groceries',
        type: 'expense',
        amountCents: 12_000,
        firstOccurrenceDate: '2026-08-03',
        recurrence: 'weekly',
        source: 'guided-estimate',
      },
      {
        id: 'demo-phone-plan',
        name: 'Phone plan',
        type: 'expense',
        amountCents: 4_500,
        firstOccurrenceDate: '2026-08-12',
        recurrence: 'monthly',
        source: 'manual',
      },
      {
        id: 'demo-insurance',
        name: 'Insurance',
        type: 'expense',
        amountCents: 190_000,
        firstOccurrenceDate: '2026-08-20',
        recurrence: 'yearly',
        source: 'manual',
      },
    ],
  }
}
