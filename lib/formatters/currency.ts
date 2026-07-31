const CRORE = 10_000_000


function formatCrore(
  value?: number | null
): string {

  if(
    value === null ||
    value === undefined ||
    isNaN(value)
  ){

    return "0"

  }


  const crore =
    value / CRORE


  return Number.isInteger(crore)
    ? `${crore}`
    : crore.toFixed(1)

}







export function formatCurrencyCr(
  value?: number | null
): string {

  return `₹${formatCrore(value)} Cr`

}







export function formatCurrencyRangeCr(
  min?: number | null,
  max?: number | null
): string {

  return `₹${formatCrore(min)}–${formatCrore(max)} Cr`

}