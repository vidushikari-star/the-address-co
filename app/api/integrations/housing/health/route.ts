import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { recordHousingInventoryRequest } from "@/lib/integrations/housing/inventory-audit"
import { hasValidHousingInventoryKey, readHousingBearerToken } from "@/lib/integrations/housing/inventory-auth"
import type { HousingInventoryInboxAdmin } from "@/lib/integrations/housing/inventory"
import { takeHousingInventoryRequest } from "@/lib/integrations/housing/inventory-rate-limit"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const requestId = randomUUID()
  const endpoint = "/api/integrations/housing/health"

  if (!process.env.HOUSING_INVENTORY_API_KEY) {
    return NextResponse.json({ error: "Housing inventory is not configured.", request_id: requestId }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }

  const authenticated = hasValidHousingInventoryKey(readHousingBearerToken(request))
  let admin: ReturnType<typeof createAdminSupabaseClient> | null = null
  try {
    admin = createAdminSupabaseClient()
  } catch {
    // The response below does not reveal deployment configuration details.
  }

  const requesterIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
  const rateLimit = takeHousingInventoryRequest(requesterIp)
  if (!rateLimit.allowed) {
    if (admin) {
      await recordHousingInventoryRequest(admin as unknown as HousingInventoryInboxAdmin, {
        endpoint,
        requestId,
        authenticated,
        status: 429,
        propertyCount: 0,
      })
    }
    return NextResponse.json(
      { error: "Too many health-check requests. Please retry later.", request_id: requestId },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  if (!authenticated) {
    if (admin) {
      await recordHousingInventoryRequest(admin as unknown as HousingInventoryInboxAdmin, {
        endpoint,
        requestId,
        authenticated: false,
        status: 401,
        propertyCount: 0,
      })
    }
    return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401, headers: { "Cache-Control": "no-store" } })
  }

  if (!admin) {
    return NextResponse.json({ error: "Housing inventory is temporarily unavailable.", request_id: requestId }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }

    await recordHousingInventoryRequest(admin as unknown as HousingInventoryInboxAdmin, {
    endpoint,
    requestId,
    authenticated: true,
    status: 200,
    propertyCount: 0,
  })

  return NextResponse.json({ status: "ok", provider: "housing", timestamp: new Date().toISOString(), request_id: requestId }, { headers: { "Cache-Control": "no-store" } })
}
