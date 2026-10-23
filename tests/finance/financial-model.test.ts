import { describe, expect, it } from "vitest"

import { CURRENT_FINANCIAL_PRINCIPAL } from "@/lib/finance/financial-principal"
import { filterByDate } from "@/lib/reports/filter-report-data"
import {
  calculateFinancialSummary,
  getCommissionReceiptDate,
  getExpenseFinancialDate,
  reconcileCommission,
  type FinancialCommission,
  type FinancialDistribution,
  type FinancialExpense,
} from "@/lib/finance/financial-model"

const principal = CURRENT_FINANCIAL_PRINCIPAL
const otherUser = "historical-inactive-user"

function commission(overrides: Partial<FinancialCommission> = {}): FinancialCommission {
  return { id: "commission-1", amount: 100_000, status: "received", createdAt: "2026-10-01T00:00:00.000Z", ...overrides }
}

function distribution(overrides: Partial<FinancialDistribution> = {}): FinancialDistribution {
  return {
    id: "distribution-1", commissionId: "commission-1", amount: 20_000, status: "pending", createdAt: "2026-10-01T00:00:00.000Z",
    recipientKind: "crm_user", crmUserId: otherUser, recipientName: "Historical teammate", recipientIsActive: false, ...overrides,
  }
}

function expense(overrides: Partial<FinancialExpense> = {}): FinancialExpense {
  return { id: "expense-1", amount: 10_000, status: "paid", date: "2026-10-15", createdAt: "2026-09-01T00:00:00.000Z", category: "marketing", ...overrides }
}

describe("financial calculation model", () => {
  it("includes pending, invoiced and received in gross but excludes cancelled rows", () => {
    const summary = calculateFinancialSummary({
      commissions: [commission({ id: "pending", status: "pending" }), commission({ id: "invoiced", status: "invoiced" }), commission({ id: "received", status: "received" }), commission({ id: "cancelled", status: "cancelled" })],
      distributions: [], expenses: [], principal,
    })
    expect(summary.grossCommission).toBe(300_000)
    expect(summary.outstandingCommission).toBe(200_000)
    expect(summary.receivedCommission).toBe(100_000)
  })

  it("uses an explicit principal allocation instead of gross minus every distribution", () => {
    const result = reconcileCommission({
      commission: commission(), principal,
      distributions: [distribution({ id: "mine", crmUserId: principal.id, amount: 70_000, recipientName: principal.name }), distribution({ id: "other", amount: 30_000 })],
    })
    expect(result.myIncome).toBe(70_000)
    expect(result.principalAllocation).toBe(70_000)
    expect(result.otherRecipientAllocation).toBe(30_000)
    expect(result.reconciliationStatus).toBe("reconciled")
  })

  it("classifies internal historical and external allocations as other-recipient distributions, never expenses", () => {
    const summary = calculateFinancialSummary({
      commissions: [commission()],
      distributions: [distribution({ amount: 20_000 }), distribution({ id: "external", amount: 30_000, recipientKind: "external", crmUserId: undefined, externalRecipientId: "broker-1", recipientName: "External broker" })],
      expenses: [], principal,
    })
    expect(summary.otherRecipientDistributions).toBe(50_000)
    expect(summary.totalExpenses).toBe(0)
    expect(summary.myIncome).toBe(50_000)
  })

  it("retains inactive historical recipient data while the new-allocation source is active-only", () => {
    const historical = distribution({ recipientIsActive: false, recipientName: "Himanshu Mehrotra" })
    expect(historical.recipientName).toBe("Himanshu Mehrotra")
    expect(historical.recipientIsActive).toBe(false)
    // Eligibility is enforced by the active-profile query and the database trigger;
    // calculation deliberately does not erase historical rows.
    expect(reconcileCommission({ commission: commission(), distributions: [historical], principal }).otherRecipientAllocation).toBe(20_000)
  })

  it("uses a reconcilable remainder only when there is no principal allocation", () => {
    const provisional = reconcileCommission({ commission: commission(), distributions: [distribution({ amount: 40_000 })], principal })
    expect(provisional.myIncome).toBe(60_000)
    expect(provisional.incomeSource).toBe("provisional")
    expect(provisional.reconciliationStatus).toBe("provisional")

    const unallocated = reconcileCommission({ commission: commission(), distributions: [], principal })
    expect(unallocated.myIncome).toBe(0)
    expect(unallocated.unallocated).toBe(100_000)
    expect(unallocated.incomeSource).toBe("unreconciled")
  })

  it("flags over-allocation and does not present it as principal income", () => {
    const result = reconcileCommission({ commission: commission(), distributions: [distribution({ amount: 120_000 })], principal })
    expect(result.overallocated).toBe(20_000)
    expect(result.myIncome).toBe(0)
    expect(result.reconciliationStatus).toBe("overallocated")
  })

  it("keeps paid and pending expenses separate and uses the expense business date", () => {
    const summary = calculateFinancialSummary({ commissions: [], distributions: [], expenses: [expense(), expense({ id: "pending", amount: 4_000, status: "pending", date: "2026-10-20" })], principal })
    expect(summary.paidExpenses).toBe(10_000)
    expect(summary.pendingExpenses).toBe(4_000)
    expect(summary.totalExpenses).toBe(14_000)
    expect(getExpenseFinancialDate(expense())).toBe("2026-10-15")
  })

  it("calculates net cash only from received determined principal income minus paid other outflows", () => {
    const summary = calculateFinancialSummary({
      commissions: [commission()],
      distributions: [distribution({ id: "mine", crmUserId: principal.id, amount: 70_000, recipientName: principal.name }), distribution({ id: "paid-other", amount: 30_000, status: "paid" })],
      expenses: [expense({ amount: 5_000, status: "paid" }), expense({ id: "pending", amount: 2_000, status: "pending" })], principal,
    })
    expect(summary.netIncome).toBe(63_000)
    expect(summary.netCash).toBe(35_000)
    expect(summary.distributionsPayable).toBe(0)
  })

  it("uses received_date first and payment_date only as a historical compatibility fallback", () => {
    expect(getCommissionReceiptDate(commission({ receivedDate: "2026-10-02", paymentDate: "2026-10-01" }))).toBe("2026-10-02")
    expect(getCommissionReceiptDate(commission({ paymentDate: "2026-10-01" }))).toBe("2026-10-01")
  })

  it("filters expenses by their business date rather than their record creation date", () => {
    const oldCreation = new Date()
    oldCreation.setFullYear(oldCreation.getFullYear() - 1)
    const today = new Date().toISOString().slice(0, 10)
    const result = filterByDate([{ id: "expense", date: today, createdAt: oldCreation.toISOString() }], "month")
    expect(result).toHaveLength(1)
  })
})
