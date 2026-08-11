import { redirect } from "next/navigation"

import { HousingInventoryInbox } from "@/components/settings/housing-inventory-inbox"
import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { listHousingInventorySubmissions } from "@/lib/integrations/housing/inventory"
import type { HousingInventoryInboxRow } from "@/lib/integrations/housing/inventory"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export default async function HousingIntegrationSettingsPage() {
  const user = await getServerUserProfile()
  if (!user || user.role !== "admin") redirect("/dashboard")

  const configured = Boolean(process.env.HOUSING_INVENTORY_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY)
  let submissions: HousingInventoryInboxRow[] = []
  let loadError = false

  if (configured) {
    try {
      submissions = await listHousingInventorySubmissions(createAdminSupabaseClient())
    } catch {
      loadError = true
    }
  }

  return <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Settings / Integrations</p><h1 className="mt-2 text-3xl font-semibold">Housing.com</h1><p className="mt-1 text-muted-foreground">Inventory submission inbox and integration status.</p></div><HousingInventoryInbox configured={configured} submissions={submissions} loadError={loadError} /></div>
}
