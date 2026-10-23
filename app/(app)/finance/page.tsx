import { redirect } from "next/navigation"

import { CommissionDistributionLedger } from "@/components/finance/commission-distribution-ledger"
import { ExpenseSection } from "@/components/finance/expense-section"
import { ExternalRecipientManager } from "@/components/finance/external-recipient-manager"
import { FinancialDashboard } from "@/components/finance/financial-dashboard"
import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { createAuthenticatedCrmReadRepository } from "@/lib/repositories/authenticated-crm-read-repository"
import { asExpenseRows, getFinancialDashboardData } from "@/lib/services/financial-dashboard-service"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Commission } from "@/types/commission"
import type { CommissionDistribution } from "@/types/commission-distribution"

export default async function FinancePage() {
  const user = await getServerUserProfile()
  if (!user || user.role !== "admin") redirect("/dashboard")

  const supabase = await createServerSupabaseClient()
  const crm = createAuthenticatedCrmReadRepository(supabase)
  const data = await getFinancialDashboardData({ supabase, crm })
  const commissions: Commission[] = data.commissions.map((commission) => ({
    ...commission,
    dealId: commission.dealId ?? "",
    type: "sale",
    status: commission.status,
    updatedAt: commission.createdAt,
  }))
  const distributions: CommissionDistribution[] = data.distributions.map((distribution) => ({
    id: distribution.id,
    commissionId: distribution.commissionId,
    userId: distribution.crmUserId,
    externalRecipientId: distribution.externalRecipientId,
    recipientKind: distribution.recipientKind,
    userName: distribution.recipientName,
    recipientName: distribution.recipientName,
    recipientIsActive: distribution.recipientIsActive,
    role: distribution.role as CommissionDistribution["role"],
    percentage: distribution.percentage,
    amount: distribution.amount,
    status: distribution.status,
    paidDate: distribution.paidDate,
    notes: distribution.notes,
    createdAt: distribution.createdAt,
  }))

  return <>
    <FinancialDashboard
      data={data}
      title="Finance"
      description="The same reconciled financial model, with expense and allocation administration below."
    />
    <div className="mx-auto max-w-[1600px] space-y-8 px-4 pb-8 md:px-8">
      <ExpenseSection expenses={asExpenseRows(data.expenses)} />
      <CommissionDistributionLedger distributions={distributions} commissions={commissions} />
      <ExternalRecipientManager />
    </div>
  </>
}
