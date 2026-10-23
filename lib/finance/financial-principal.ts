export type FinancialPrincipal = {
  id: string
  name: string
}

// This is deliberately a financial-domain default rather than an application-wide
// identity rule. The calculation service also accepts any principal explicitly.
export const CURRENT_FINANCIAL_PRINCIPAL: FinancialPrincipal = {
  id: "9cd82d14-2ea2-4a57-a18b-5222a590b417",
  name: "Vidushi Kari",
}

export function resolveFinancialPrincipal(
  principal?: FinancialPrincipal
): FinancialPrincipal {
  return principal ?? CURRENT_FINANCIAL_PRINCIPAL
}
