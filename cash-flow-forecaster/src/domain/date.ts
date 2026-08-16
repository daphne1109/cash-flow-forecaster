/**
 * Local calendar-date helpers. These functions never parse a YYYY-MM-DD value
 * as a timestamp, which avoids timezone shifts when handling scheduled items.
 */
export interface DateParts {
  year: number
  month: number
  day: number
}

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function createLocalDate(parts: DateParts): Date {
  const { year, month, day } = parts
  const date = new Date(year, month - 1, day)

  // JavaScript normalises invalid dates (for example, 30 February becomes a
  // March date), so compare every component after construction.
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new RangeError('Date parts must form a real local calendar date.')
  }

  return date
}

function toDateParts(date: Date): DateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  }
}

/** Throws a clear domain error before date arithmetic is attempted. */
function assertDateKey(value: string): void {
  if (!isValidDateKey(value)) {
    throw new RangeError(`Invalid local calendar date: ${value}`)
  }
}

export function isValidDateKey(value: string): boolean {
  const match = DATE_KEY_PATTERN.exec(value)

  if (!match) {
    return false
  }

  try {
    createLocalDate({
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    })
    return true
  } catch {
    return false
  }
}

export function parseDateKey(value: string): DateParts {
  assertDateKey(value)
  const [, year, month, day] = value.match(DATE_KEY_PATTERN)!

  return { year: Number(year), month: Number(month), day: Number(day) }
}

export function formatDateKey(parts: DateParts): string {
  createLocalDate(parts)

  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(
    2,
    '0',
  )}-${String(parts.day).padStart(2, '0')}`
}

export function compareDateKeys(left: string, right: string): number {
  assertDateKey(left)
  assertDateKey(right)

  // ISO calendar keys sort lexicographically in the same order as dates.
  return left.localeCompare(right)
}

export function addDays(dateKey: string, days: number): string {
  if (!Number.isInteger(days)) {
    throw new RangeError('Days to add must be an integer.')
  }

  const date = createLocalDate(parseDateKey(dateKey))
  date.setDate(date.getDate() + days)

  return formatDateKey(toDateParts(date))
}

export function addMonths(dateKey: string, months: number): string {
  if (!Number.isInteger(months)) {
    throw new RangeError('Months to add must be an integer.')
  }

  const { year, month, day } = parseDateKey(dateKey)
  // Work with an absolute month index so positive and negative cross-year
  // offsets use the same calculation.
  const targetMonthIndex = year * 12 + (month - 1) + months
  const targetYear = Math.floor(targetMonthIndex / 12)
  const targetMonth = (targetMonthIndex % 12) + 1

  // formatDateKey rejects impossible dates instead of silently rolling 31 Jan
  // into March. Validation makes such recurring rules unreachable in practice.
  return formatDateKey({ year: targetYear, month: targetMonth, day })
}

export function addYears(dateKey: string, years: number): string {
  if (!Number.isInteger(years)) {
    throw new RangeError('Years to add must be an integer.')
  }

  const { year, month, day } = parseDateKey(dateKey)

  return formatDateKey({ year: year + years, month, day })
}

export function daysInInclusiveRange(start: string, end: string): string[] {
  if (compareDateKeys(start, end) > 0) {
    throw new RangeError('Range start must be on or before range end.')
  }

  const days: string[] = []
  let current = start

  // The end date is included because a payment on the final forecast day must
  // contribute to the reported daily balance.
  while (compareDateKeys(current, end) <= 0) {
    days.push(current)
    current = addDays(current, 1)
  }

  return days
}
