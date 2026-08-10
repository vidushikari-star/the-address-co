import { notFound, redirect } from "next/navigation"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { isMarketingEnabled } from "@/lib/marketing/feature-flags"

export const MARKETING_ADMIN_PERMISSION = "marketing.admin" as const

export async function hasMarketingAdminPermission() {
  const user = await getServerUserProfile()

  return Boolean(user && user.role === "admin" && isMarketingEnabled())
}

/** Use from pages and server actions. API handlers should use requireMarketingApiAccess. */
export async function requireMarketingAdminPage() {
  if (!isMarketingEnabled()) {
    notFound()
  }

  const user = await getServerUserProfile()

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  return user
}

export async function requireMarketingApiAccess() {
  const user = await getServerUserProfile()

  if (!user) {
    return { user: null, error: "Unauthorized", status: 401 } as const
  }

  if (!isMarketingEnabled() || user.role !== "admin") {
    return { user: null, error: "Forbidden", status: 403 } as const
  }

  return { user, error: null, status: null } as const
}
