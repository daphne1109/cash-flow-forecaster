/**
 * Recognition-first bill categories for guided setup.
 *
 * They are prompts, not assumptions: nothing is added until the user selects a
 * category and supplies their own amount and next payment date.
 */
export const billCategories = [
  { id: 'rent', label: 'Rent / room', defaultName: 'Rent' },
  { id: 'electricity', label: 'Electricity', defaultName: 'Electricity bill' },
  { id: 'water', label: 'Water', defaultName: 'Water bill' },
  { id: 'phone', label: 'Phone', defaultName: 'Phone plan' },
  { id: 'internet', label: 'Internet', defaultName: 'Internet bill' },
  { id: 'insurance', label: 'Insurance', defaultName: 'Insurance' },
  { id: 'education', label: 'Education', defaultName: 'Education fee' },
  { id: 'health', label: 'Health', defaultName: 'Health expense' },
  { id: 'loan', label: 'Loan / credit', defaultName: 'Loan payment' },
  { id: 'other', label: 'Other bill', defaultName: 'Other bill' },
] as const

export type BillCategory = (typeof billCategories)[number]
