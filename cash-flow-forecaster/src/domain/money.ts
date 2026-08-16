/**
 * Parses a user-entered Ringgit amount into integer cents.
 *
 * Parsing is kept at the input boundary: all domain and forecast code works
 * only with integer cents, avoiding floating-point drift in running balances.
 */
export function parseMoneyToCents(
  rawValue: string,
  options: { allowNegative?: boolean } = {},
): number | null {
  const normalised = rawValue.replace(/^\s*RM\s*/i, '').replace(/,/g, '').trim()

  if (normalised === '') {
    return null
  }

  const value = Number(normalised)
  if (!Number.isFinite(value) || (!options.allowNegative && value <= 0)) {
    return null
  }

  // Math.round is deliberate: values such as 12.34 * 100 can otherwise be
  // represented as 1233.9999999999998 by IEEE 754 floating-point arithmetic.
  return Math.round(value * 100)
}

/** Formats integer cents for user-facing Malaysian Ringgit amounts. */
export function formatCents(cents: number): string {
  const formattedAmount = new Intl.NumberFormat('en-MY', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)

  return `RM ${formattedAmount}`
}
