import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

import { recordHousingInventoryRequest } from "@/lib/integrations/housing/inventory-audit"
import { hasValidHousingInventoryKey, readHousingBearerToken } from "@/lib/integrations/housing/inventory-auth"
import {
  externalIdFromPayload,
  readHousingInventoryRequestBody,
  storeHousingInventorySubmission,
  validateHousingInventoryPayload,
  type HousingInventoryInboxAdmin,
} from "@/lib/integrations/housing/inventory"
import { takeHousingInventoryRequest } from "@/lib/integrations/housing/inventory-rate-limit"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function requestIdFor(request: Request) {
  const supplied = request.headers.get("x-request-id")
  return supplied && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(supplied)
    ? supplied
    : randomUUID()
}

function requesterIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
}

function response(body: object, status: number, requestId: string) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Request-ID": requestId,
    },
  })
}

async function audit(
  admin: HousingInventoryInboxAdmin | null,
  input: Parameters<typeof recordHousingInventoryRequest>[1]
) {
  if (admin) await recordHousingInventoryRequest(admin, input)
}

export async function POST(request: Request) {
  const requestId = requestIdFor(request)
  const endpoint = "/api/integrations/housing/inventory"

  if (!process.env.HOUSING_INVENTORY_API_KEY) {
    console.error("Housing inventory endpoint is not configured", { requestId })
    return response({ success: false, error: "Housing inventory is not configured." }, 503, requestId)
  }

  const rateLimit = takeHousingInventoryRequest(requesterIp(request))
  if (!rateLimit.allowed) {
    console.info("[housing-inventory]", { requestId, stage: "rate_limit", status: "limited" })
    return NextResponse.json(
      { success: false, error: "Too many inventory requests. Please retry later." },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(rateLimit.retryAfterSeconds), "X-Request-ID": requestId } }
    )
  }

  const authenticated = hasValidHousingInventoryKey(readHousingBearerToken(request))
  if (!authenticated) {
    console.info("[housing-inventory]", { requestId, stage: "auth", status: "unauthorized" })
    return response({ success: false, error: "Unauthorized" }, 401, requestId)
  }

  let admin: HousingInventoryInboxAdmin
  try {
    admin = createAdminSupabaseClient() as unknown as HousingInventoryInboxAdmin
  } catch {
    console.error("Housing inventory server client unavailable", { requestId })
    return response({ success: false, error: "Housing inventory is temporarily unavailable." }, 503, requestId)
  }

  console.info("[housing-inventory]", { requestId, stage: "auth", status: "ok" })

  const body = await readHousingInventoryRequestBody(request)
  if (!body.ok) {
    await audit(admin, { endpoint, requestId, authenticated: true, status: body.status, propertyCount: 0 })
    return response({ success: false, error: body.error }, body.status, requestId)
  }

  const externalId = externalIdFromPayload(body.payload)
  const validation = validateHousingInventoryPayload(body.payload)
  if (!validation.ok) {
    if (externalId) {
      try {
        await storeHousingInventorySubmission(admin, {
          externalId,
          payload: body.payload,
          status: "invalid",
          validationErrors: validation.fields,
        })
      } catch {
        console.error("Housing inventory persistence failed", { requestId, stage: "validation" })
        await audit(admin, { endpoint, requestId, authenticated: true, status: 500, propertyCount: 0 })
        return response({ success: false, error: "Unable to receive inventory." }, 500, requestId)
      }
    }

    console.info("[housing-inventory]", { requestId, stage: "validation", status: "invalid" })
    await audit(admin, { endpoint, requestId, authenticated: true, status: 422, propertyCount: externalId ? 1 : 0 })
    return response({ success: false, external_id: externalId, error: "Validation failed", fields: validation.fields }, 422, requestId)
  }

  console.info("[housing-inventory]", { requestId, stage: "validation", status: "ok" })

  try {
    const stored = await storeHousingInventorySubmission(admin, {
      externalId: validation.submission.external_id,
      payload: validation.submission,
      status: "ready_for_mapping",
      validationErrors: [],
    })
    const status = stored.updated ? "updated" : "accepted"
    console.info("[housing-inventory]", { requestId, stage: "persistence", status })
    await audit(admin, { endpoint, requestId, authenticated: true, status: stored.updated ? 200 : 201, propertyCount: 1 })

    return response({
      success: true,
      external_id: stored.submission.external_id,
      status,
      message: stored.updated ? "Inventory update accepted." : "Inventory accepted for processing.",
    }, stored.updated ? 200 : 201, requestId)
  } catch {
    console.error("Housing inventory persistence failed", { requestId, stage: "persistence" })
    await audit(admin, { endpoint, requestId, authenticated: true, status: 500, propertyCount: 0 })
    return response({ success: false, error: "Unable to receive inventory." }, 500, requestId)
  }
}
