const CRORE = 10_000_000

function formatCrore(value: number): string {
  const crore = value / CRORE

  return Number.isInteger(crore)
    ? `${crore}`
    : crore.toFixed(1)
}

export function formatCurrencyCr(value: number): string {
  return `₹${formatCrore(value)} Cr`
}

export function formatCurrencyRangeCr(
  min: number,
  max: number
): string {
  return `₹${formatCrore(min)}–${formatCrore(max)} Cr`
}