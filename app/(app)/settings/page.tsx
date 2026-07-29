import { redirect } from "next/navigation"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"

import { SettingsCard } from "@/components/settings/settings-card"

export default async function SettingsPage() {
  const user =
    await getServerUserProfile()

  if (
    !user ||
    user.role !== "admin"
  ) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Settings
        </h1>

        <p className="max-w-2xl text-muted-foreground">
          Configure your workspace, manage users, commission rules,
          company information, and data management.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SettingsCard
          title="Users & Roles"
          description="Manage team members, access levels and permissions."
          href="/settings/users"
        />

        <SettingsCard
          title="Commission Settings"
          description="Configure default commission rules and partner splits."
          href="/settings/commission"
        />

        <SettingsCard
          title="Company Profile"
          description="Manage company information used throughout the CRM."
          href="/settings/company"
        />

        <SettingsCard
          title="Data Management"
          description="Export backups and manage your CRM data."
          href="/settings/data"
        />
      </div>
    </div>
  )
}