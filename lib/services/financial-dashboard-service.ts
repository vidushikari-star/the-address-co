import { resolveFinancialPrincipal, type FinancialPrincipal } from "@/lib/finance/financial-principal"
import {
  calculateFinancialSummary,
  getCommissionFinancialDate,
  getExpenseFinancialDate,
  type FinancialCommission,
  type FinancialDistribution,
  type FinancialExpense,
} from "@/lib/finance/financial-model"
import { getDateRange, type ReportRange } from "@/lib/reports/report-date-utils"
import { getCommissions } from "@/lib/repositories/commission-server-repository"
import { createAuthenticatedCrmReadRepository, type AuthenticatedCrmClient } from "@/lib/repositories/authenticated-crm-read-repository"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { CommissionRecipient } from "@/types/commission-recipient"
import type { Expense } from "@/types/expense"

type DistributionRow = {
  id: string
  commission_id: string
  user_id: string | null
  external_recipient_id: string | null
  recipient_kind: "crm_user" | "external" | null
  amount: number | string | null
  status: "pending" | "paid"
  role: string
  percentage: number | string | null
  notes: string | null
  paid_date: string | null
  created_at: string
  user: { name: string | null; is_active: boolean | null } | null
  external: { name: string | null; is_active: boolean | null } | null
}

type RecipientRow = {
  id: string
  name: string
  recipient_type: CommissionRecipient["recipientType"]
  company_name: string | null
  phone: string | null
  email: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapExpense(row: Expense): FinancialExpense {
  return {
    id: row.id,
    amount: row.amount,
    status: row.status,
    date: row.date,
    createdAt: row.createdAt,
    category: row.category,
    description: row.description,
  }
}

function mapRecipient(row: RecipientRow): CommissionRecipient {
  return {
    id: row.id,
    name: row.name,
    recipientType: row.recipient_type,
    companyName: row.company_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export type FinancialDashboardData = {
  principal: FinancialPrincipal
  commissions: FinancialCommission[]
  distributions: FinancialDistribution[]
  expenses: FinancialExpense[]
  activeExternalRecipients: CommissionRecipient[]
  summary: ReturnType<typeof calculateFinancialSummary>
}

/**
 * The sole server-side loader for Commission, Finance, Reports and financial
 * exports. Its pure calculation layer is intentionally shared with tests.
 */
export async function getFinancialDashboardData(
  options: {
    principal?: FinancialPrincipal
    supabase?: AuthenticatedCrmClient
    crm?: ReturnType<typeof createAuthenticatedCrmReadRepository>
  } = {}
): Promise<FinancialDashboardData> {
  const resolvedPrincipal = resolveFinancialPrincipal(options.principal)
  const supabase = options.supabase ?? await createServerSupabaseClient()
  const crm = options.crm ?? createAuthenticatedCrmReadRepository(supabase)

  const [commissionRows, distributionsResult, expenseRows, recipientsResult] =
    await Promise.all([
      getCommissions(),
      supabase
        .from("commission_distributions")
        .select(
          "id,commission_id,user_id,external_recipient_id,recipient_kind,amount,status,role,percentage,notes,paid_date,created_at,user:user_profiles(name,is_active),external:commission_recipients(name,is_active)"
        )
        .order("created_at", { ascending: false }),
      crm.getExpenses(),
      supabase
        .from("commission_recipients")
        .select("id,name,recipient_type,company_name,phone,email,notes,is_active,created_at,updated_at")
        .eq("is_active", true)
        .order("name"),
    ])

  if (distributionsResult.error) throw distributionsResult.error
  // A database that has not yet received the additive local migration cannot
  // load external recipients; surface that honestly rather than hiding it.
  if (recipientsResult.error) throw recipientsResult.error

  const commissions: FinancialCommission[] = commissionRows.map((commission) => ({
    id: commission.id,
    amount: commission.amount,
    status: commission.status,
    createdAt: commission.createdAt,
    receivedDate: commission.receivedDate,
    paymentDate: commission.paymentDate,
    dealId: commission.dealId,
    dealName: commission.dealName,
    propertyId: commission.propertyId,
  }))
  const distributions: FinancialDistribution[] = (
    (distributionsResult.data as unknown as DistributionRow[] | null) ?? []
  ).map((distribution) => {
    const recipientKind = distribution.recipient_kind ?? "crm_user"
    const recipient = recipientKind === "external"
      ? distribution.external
      : distribution.user

    return {
      id: distribution.id,
      commissionId: distribution.commission_id,
      amount: Number(distribution.amount ?? 0),
      status: distribution.status,
      paidDate: distribution.paid_date ?? undefined,
      createdAt: distribution.created_at,
      recipientKind,
      crmUserId: distribution.user_id ?? undefined,
      externalRecipientId: distribution.external_recipient_id ?? undefined,
      recipientName: recipient?.name ?? undefined,
      recipientIsActive: recipient?.is_active ?? undefined,
      role: distribution.role,
      percentage: distribution.percentage == null ? undefined : Number(distribution.percentage),
      notes: distribution.notes ?? undefined,
    }
  })
  const expenses = expenseRows.map(mapExpense)
  const activeExternalRecipients = (
    (recipientsResult.data as RecipientRow[] | null) ?? []
  ).map(mapRecipient)

  return {
    principal: resolvedPrincipal,
    commissions,
    distributions,
    expenses,
    activeExternalRecipients,
    summary: calculateFinancialSummary({
      commissions,
      distributions,
      expenses,
      principal: resolvedPrincipal,
    }),
  }
}

export function filterFinancialDashboardDataByRange(
  data: FinancialDashboardData,
  range: ReportRange
): FinancialDashboardData {
  const { start, end } = getDateRange(range)
  if (!start || !end) return data
  const isInRange = (value: string) => {
    const date = new Date(value)
    return date >= start && date <= end
  }
  const commissions = data.commissions.filter((commission) =>
    isInRange(getCommissionFinancialDate(commission))
  )
  const commissionIds = new Set(commissions.map((commission) => commission.id))
  const distributions = data.distributions.filter((distribution) => commissionIds.has(distribution.commissionId))
  const expenses = data.expenses.filter((expense) => isInRange(getExpenseFinancialDate(expense)))

  return {
    ...data,
    commissions,
    distributions,
    expenses,
    summary: calculateFinancialSummary({
      commissions,
      distributions,
      expenses,
      principal: data.principal,
    }),
  }
}

export function asExpenseRows(expenses: FinancialExpense[]): Expense[] {
  return expenses.map((expense) => ({
    id: expense.id,
    amount: expense.amount,
    status: expense.status,
    date: expense.date,
    category: expense.category as Expense["category"],
    description: expense.description,
    createdAt: expense.createdAt,
  }))
}
