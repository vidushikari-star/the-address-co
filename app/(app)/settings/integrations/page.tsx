import { redirect } from "next/navigation"

import { SettingsCard } from "@/components/settings/settings-card"
import { getServerUserProfile } from "@/lib/auth/server-user-profile"

export default async function IntegrationsSettingsPage() {
  const user = await getServerUserProfile()
  if (!user || user.role !== "admin") redirect("/dashboard")

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div><h1 className="text-3xl font-semibold">Integrations</h1><p className="mt-1 text-muted-foreground">Configure and review secure connections to external platforms.</p></div>
      <div className="grid gap-6 md:grid-cols-2"><SettingsCard title="Housing.com" description="Review inventory submissions received from Housing.com before phase-2 CRM mapping is enabled." href="/settings/integrations/housing" /></div>
    </div>
  )
}
