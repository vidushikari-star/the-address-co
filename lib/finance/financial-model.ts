import type { FinancialPrincipal } from "@/lib/finance/financial-principal"

export type FinancialCommissionStatus =
  | "pending"
  | "invoiced"
  | "received"
  | "cancelled"

export type FinancialDistributionStatus = "pending" | "paid"
export type FinancialExpenseStatus = "pending" | "paid"
export type RecipientKind = "crm_user" | "external"
export type ReconciliationStatus =
  | "reconciled"
  | "unallocated"
  | "overallocated"
  | "provisional"
  | "excluded"

export type FinancialCommission = {
  id: string
  amount: number
  status: FinancialCommissionStatus
  createdAt: string
  receivedDate?: string
  paymentDate?: string
  dealId?: string
  dealName?: string
  propertyId?: string
  propertyName?: string
}

export type FinancialDistribution = {
  id: string
  commissionId: string
  amount: number
  status: FinancialDistributionStatus
  createdAt: string
  paidDate?: string
  recipientKind: RecipientKind
  crmUserId?: string
  externalRecipientId?: string
  recipientName?: string
  recipientIsActive?: boolean
  role?: string
  percentage?: number
  notes?: string
}

export type FinancialExpense = {
  id: string
  amount: number
  status: FinancialExpenseStatus
  date: string
  createdAt: string
  category: string
  description?: string
}

export type CommissionReconciliation = {
  commission: FinancialCommission
  gross: number
  totalAllocated: number
  principalAllocation: number
  otherRecipientAllocation: number
  unallocated: number
  overallocated: number
  myIncome: number
  incomeSource: "explicit" | "provisional" | "unreconciled" | "excluded"
  reconciliationStatus: ReconciliationStatus
  receivedPrincipalCommission: number
  distributions: FinancialDistribution[]
}

export type FinancialSummary = {
  grossCommission: number
  receivedCommission: number
  outstandingCommission: number
  myIncome: number
  otherRecipientDistributions: number
  distributionsPaid: number
  distributionsPayable: number
  paidExpenses: number
  pendingExpenses: number
  totalExpenses: number
  netIncome: number
  netCash: number
  unallocated: number
  overallocated: number
  unreconciledCommissionCount: number
  receivedPrincipalCashUnresolvedCount: number
  commissionReconciliations: CommissionReconciliation[]
}

const money = (value: number) => Number(value || 0)

export function getCommissionReceiptDate(
  commission: FinancialCommission
): string | undefined {
  // `received_date` is written by the current receipt action and is canonical.
  // `payment_date` remains a compatibility fallback for older rows.
  return commission.receivedDate ?? commission.paymentDate
}

export function getCommissionFinancialDate(
  commission: FinancialCommission
): string {
  return commission.status === "received"
    ? getCommissionReceiptDate(commission) ?? commission.createdAt
    : commission.createdAt
}

export function getDistributionFinancialDate(
  distribution: FinancialDistribution
): string {
  return distribution.status === "paid"
    ? distribution.paidDate ?? distribution.createdAt
    : distribution.createdAt
}

export function getExpenseFinancialDate(expense: FinancialExpense): string {
  // Expenses are incurred on their recorded business date, not their audit date.
  return expense.date
}

export function reconcileCommission({
  commission,
  distributions,
  principal,
}: {
  commission: FinancialCommission
  distributions: FinancialDistribution[]
  principal: FinancialPrincipal
}): CommissionReconciliation {
  const commissionDistributions = distributions.filter(
    (distribution) => distribution.commissionId === commission.id
  )

  if (commission.status === "cancelled") {
    return {
      commission,
      gross: 0,
      totalAllocated: 0,
      principalAllocation: 0,
      otherRecipientAllocation: 0,
      unallocated: 0,
      overallocated: 0,
      myIncome: 0,
      incomeSource: "excluded",
      reconciliationStatus: "excluded",
      receivedPrincipalCommission: 0,
      distributions: commissionDistributions,
    }
  }

  const gross = money(commission.amount)
  const principalDistributions = commissionDistributions.filter(
    (distribution) =>
      distribution.recipientKind === "crm_user" &&
      distribution.crmUserId === principal.id
  )
  const principalAllocation = principalDistributions.reduce(
    (total, distribution) => total + money(distribution.amount),
    0
  )
  const otherRecipientAllocation = commissionDistributions
    .filter((distribution) => !principalDistributions.includes(distribution))
    .reduce((total, distribution) => total + money(distribution.amount), 0)
  const totalAllocated = principalAllocation + otherRecipientAllocation
  const unallocated = Math.max(gross - totalAllocated, 0)
  const overallocated = Math.max(totalAllocated - gross, 0)
  const hasExplicitPrincipalAllocation = principalDistributions.length > 0
  const hasOtherAllocation = otherRecipientAllocation > 0

  let myIncome = 0
  let incomeSource: CommissionReconciliation["incomeSource"] = "unreconciled"
  let reconciliationStatus: ReconciliationStatus = "unallocated"

  if (overallocated > 0) {
    reconciliationStatus = "overallocated"
  }

  if (hasExplicitPrincipalAllocation) {
    myIncome = principalAllocation
    incomeSource = "explicit"
    if (overallocated === 0 && unallocated === 0) {
      reconciliationStatus = "reconciled"
    }
  } else if (hasOtherAllocation && overallocated === 0) {
    // A remainder is usable only when allocations do not exceed the parent.
    myIncome = gross - otherRecipientAllocation
    incomeSource = "provisional"
    reconciliationStatus = "provisional"
  }

  const receivedPrincipalCommission =
    commission.status === "received" &&
    (incomeSource === "explicit" || incomeSource === "provisional")
      ? myIncome
      : 0

  return {
    commission,
    gross,
    totalAllocated,
    principalAllocation,
    otherRecipientAllocation,
    unallocated,
    overallocated,
    myIncome,
    incomeSource,
    reconciliationStatus,
    receivedPrincipalCommission,
    distributions: commissionDistributions,
  }
}

export function calculateFinancialSummary({
  commissions,
  distributions,
  expenses,
  principal,
}: {
  commissions: FinancialCommission[]
  distributions: FinancialDistribution[]
  expenses: FinancialExpense[]
  principal: FinancialPrincipal
}): FinancialSummary {
  const commissionReconciliations = commissions.map((commission) =>
    reconcileCommission({ commission, distributions, principal })
  )
  const activeReconciliations = commissionReconciliations.filter(
    (reconciliation) => reconciliation.reconciliationStatus !== "excluded"
  )
  const grossCommission = activeReconciliations.reduce(
    (total, reconciliation) => total + reconciliation.gross,
    0
  )
  const receivedCommission = activeReconciliations
    .filter((reconciliation) => reconciliation.commission.status === "received")
    .reduce((total, reconciliation) => total + reconciliation.gross, 0)
  const outstandingCommission = activeReconciliations
    .filter(
      (reconciliation) =>
        reconciliation.commission.status === "pending" ||
        reconciliation.commission.status === "invoiced"
    )
    .reduce((total, reconciliation) => total + reconciliation.gross, 0)
  const myIncome = activeReconciliations.reduce(
    (total, reconciliation) => total + reconciliation.myIncome,
    0
  )
  const otherRecipientDistributions = activeReconciliations.reduce(
    (total, reconciliation) => total + reconciliation.otherRecipientAllocation,
    0
  )
  const paidOtherDistributionIds = new Set(
    activeReconciliations.flatMap((reconciliation) =>
      reconciliation.distributions
        .filter(
          (distribution) =>
            distribution.status === "paid" &&
            !(
              distribution.recipientKind === "crm_user" &&
              distribution.crmUserId === principal.id
            )
        )
        .map((distribution) => distribution.id)
    )
  )
  const distributionsPaid = distributions
    .filter((distribution) => paidOtherDistributionIds.has(distribution.id))
    .reduce((total, distribution) => total + money(distribution.amount), 0)
  const distributionsPayable = activeReconciliations.flatMap(
    (reconciliation) => reconciliation.distributions
  )
    .filter(
      (distribution) =>
        distribution.status === "pending" &&
        !(
          distribution.recipientKind === "crm_user" &&
          distribution.crmUserId === principal.id
        )
    )
    .reduce((total, distribution) => total + money(distribution.amount), 0)
  const paidExpenses = expenses
    .filter((expense) => expense.status === "paid")
    .reduce((total, expense) => total + money(expense.amount), 0)
  const pendingExpenses = expenses
    .filter((expense) => expense.status === "pending")
    .reduce((total, expense) => total + money(expense.amount), 0)
  const totalExpenses = paidExpenses + pendingExpenses
  const unallocated = activeReconciliations.reduce(
    (total, reconciliation) => total + reconciliation.unallocated,
    0
  )
  const overallocated = activeReconciliations.reduce(
    (total, reconciliation) => total + reconciliation.overallocated,
    0
  )

  return {
    grossCommission,
    receivedCommission,
    outstandingCommission,
    myIncome,
    otherRecipientDistributions,
    distributionsPaid,
    distributionsPayable,
    paidExpenses,
    pendingExpenses,
    totalExpenses,
    // Economic view includes incurred pending expenses; it is explicitly not cash.
    netIncome: myIncome - totalExpenses,
    netCash:
      activeReconciliations.reduce(
        (total, reconciliation) => total + reconciliation.receivedPrincipalCommission,
        0
      ) -
      distributionsPaid -
      paidExpenses,
    unallocated,
    overallocated,
    unreconciledCommissionCount: activeReconciliations.filter(
      (reconciliation) =>
        reconciliation.reconciliationStatus === "unallocated" ||
        reconciliation.reconciliationStatus === "overallocated"
    ).length,
    receivedPrincipalCashUnresolvedCount: activeReconciliations.filter(
      (reconciliation) =>
        reconciliation.commission.status === "received" &&
        reconciliation.incomeSource === "unreconciled"
    ).length,
    commissionReconciliations,
  }
}
