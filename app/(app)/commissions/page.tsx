import { redirect } from "next/navigation"

import { FinancialDashboard } from "@/components/finance/financial-dashboard"
import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { getFinancialDashboardData } from "@/lib/services/financial-dashboard-service"

export default async function CommissionsPage() {
  const user = await getServerUserProfile()
  if (!user || user.role !== "admin") redirect("/dashboard")

  return <FinancialDashboard data={await getFinancialDashboardData()} />
}
