import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const supabase = vi.hoisted(() => ({ createAdminSupabaseClient: vi.fn() }))
const audit = vi.hoisted(() => ({ recordHousingInventoryRequest: vi.fn().mockResolvedValue(undefined) }))
const admin = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }))

vi.mock("@/lib/supabase/admin", () => supabase)
vi.mock("@/lib/integrations/housing/inventory-audit", () => audit)

import { GET as health } from "@/app/api/integrations/housing/health/route"
import { POST } from "@/app/api/integrations/housing/inventory/route"
import { HOUSING_INVENTORY_MAX_BODY_BYTES } from "@/lib/integrations/housing/inventory"
import { resetHousingInventoryRateLimitForTests } from "@/lib/integrations/housing/inventory-rate-limit"

const apiKey = "housing-test-key-that-must-never-be-logged"

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    external_id: "HOUSING-123456",
    name: "Advisor Name",
    email: "advisor@example.com",
    phone: "+919876543210",
    property_category: "residential",
    listing_intent: "sell",
    building_or_society_name: "Casa Ekam",
    property_type: "villa",
    built_up_area: { value: 2800, unit: "sqft" },
    transaction_type: "resale",
    construction_status: "ready_to_move",
    price: { amount: 52_000_000, currency: "INR" },
    address: { locality: "Parra", city: "Goa", state: "Goa", pincode: "403510" },
    images: [{ url: "https://example.com/property.jpg", position: 1, is_cover: true }],
    ...overrides,
  }
}

function inboxRow(externalId = "HOUSING-123456", wasUpdated = false) {
  return {
    id: "b2041f1f-89e9-4a59-a8de-00169502f523",
    external_id: externalId,
    payload: validPayload({ external_id: externalId }),
    payload_hash: "a".repeat(64),
    version: wasUpdated ? 2 : 1,
    status: "ready_for_mapping",
    validation_errors: [],
    received_at: "2026-08-11T00:00:00.000Z",
    updated_at: "2026-08-11T00:00:00.000Z",
    processed_at: null,
    crm_property_id: null,
    was_updated: wasUpdated,
  }
}

function request(payload: unknown, key = apiKey, headers: HeadersInit = {}) {
  return new Request("http://localhost/api/integrations/housing/inventory", {
    method: "POST",
    headers: { "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}), ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetHousingInventoryRateLimitForTests()
  process.env.HOUSING_INVENTORY_API_KEY = apiKey
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key"
  supabase.createAdminSupabaseClient.mockReturnValue(admin)
  admin.rpc.mockResolvedValue({ data: [inboxRow()], error: null })
})

afterEach(() => vi.restoreAllMocks())

describe("POST /api/integrations/housing/inventory", () => {
  it("accepts and stores a valid authenticated property without creating a CRM property", async () => {
    const response = await POST(request(validPayload()))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ success: true, external_id: "HOUSING-123456", status: "accepted", message: "Inventory accepted for processing." })
    expect(admin.rpc).toHaveBeenCalledWith("upsert_housing_inventory_submission", expect.objectContaining({
      p_external_id: "HOUSING-123456",
      p_status: "ready_for_mapping",
      p_payload: expect.objectContaining({
        building_or_society_name: "Casa Ekam",
        name: "Advisor Name",
        email: "advisor@example.com",
        phone: "+919876543210",
        listing_contact: {
          source: "housing_payload",
          name: "Advisor Name",
          email: "advisor@example.com",
          phone: "+919876543210",
        },
      }),
    }))
    expect(admin.from).not.toHaveBeenCalledWith("properties")
  })

  it("requires a public/business listing contact name and phone", async () => {
    const missingName = await POST(request(validPayload({ name: " " })))
    expect(missingName.status).toBe(422)
    await expect(missingName.json()).resolves.toMatchObject({ fields: expect.arrayContaining([expect.objectContaining({ field: "name" })]) })

    const missingPhone = await POST(request(validPayload({ phone: "" })))
    expect(missingPhone.status).toBe(422)
    await expect(missingPhone.json()).resolves.toMatchObject({ fields: expect.arrayContaining([expect.objectContaining({ field: "phone" })]) })
  })

  it("validates optional email and normalizes listing-contact whitespace and phones", async () => {
    const invalidEmail = await POST(request(validPayload({ email: "not-an-email" })))
    expect(invalidEmail.status).toBe(422)
    await expect(invalidEmail.json()).resolves.toMatchObject({ fields: expect.arrayContaining([expect.objectContaining({ field: "email" })]) })

    const accepted = await POST(request(validPayload({
      name: "  Vidushi Kari  ",
      email: " ADVISOR@EXAMPLE.COM ",
      phone: " +91 (98765) 43210 ",
    })))
    expect(accepted.status).toBe(201)
    expect(admin.rpc).toHaveBeenLastCalledWith("upsert_housing_inventory_submission", expect.objectContaining({
      p_payload: expect.objectContaining({
        name: "Vidushi Kari",
        email: "advisor@example.com",
        phone: "+919876543210",
      }),
    }))
  })

  it("accepts and preserves a valid international listing-contact phone", async () => {
    const response = await POST(request(validPayload({ phone: "+44 20 7946 0958" })))
    expect(response.status).toBe(201)
    expect(admin.rpc).toHaveBeenCalledWith("upsert_housing_inventory_submission", expect.objectContaining({
      p_payload: expect.objectContaining({ phone: "+442079460958" }),
    }))
  })

  it("logs sanitized Supabase persistence details without incoming data or credentials", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    admin.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "42702",
        message: "column reference \"version\" is ambiguous",
        details: "Rejected value https://private.example.com/image.jpg with {\"description\":\"private\"}",
        hint: "Qualify the table column in the upsert function",
      },
    })

    const response = await POST(request(validPayload(), apiKey, { "x-request-id": "84a0cde7-8cae-4d8b-b656-ec8659a503bb" }))

    expect(response.status).toBe(500)
    expect(error).toHaveBeenCalledWith("[housing-inventory]", {
      requestId: "84a0cde7-8cae-4d8b-b656-ec8659a503bb",
      stage: "persistence",
      status: "failed",
      db_code: "42702",
      message: "column reference \"version\" is ambiguous",
      details: "Rejected value [redacted-structured-value]",
      hint: "Qualify the table column in the upsert function",
      external_id: "HOUSING-123456",
    })
    expect(JSON.stringify(error.mock.calls)).not.toContain(apiKey)
    expect(JSON.stringify(error.mock.calls)).not.toContain("private.example.com")
  })

  it("returns 401 for an invalid API key", async () => {
    const response = await POST(request(validPayload(), "wrong-key"))
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ success: false, error: "Unauthorized" })
    expect(admin.rpc).not.toHaveBeenCalled()
  })

  it("returns 401 when the API key is missing", async () => {
    const response = await POST(request(validPayload(), ""))
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ success: false, error: "Unauthorized" })
  })

  it("returns 400 for invalid JSON", async () => {
    const response = await POST(request("{", apiKey))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ success: false, error: "Invalid JSON payload." })
  })

  it("returns 422 for a missing external ID without persisting an unidentified payload", async () => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).external_id
    const response = await POST(request(payload))
    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({ success: false, error: "Validation failed", fields: expect.arrayContaining([expect.objectContaining({ field: "external_id" })]) })
    expect(admin.rpc).not.toHaveBeenCalled()
  })

  it("returns 422 and stores a validation result for unsupported enums", async () => {
    admin.rpc.mockResolvedValue({ data: [{ ...inboxRow(), status: "invalid", validation_errors: [{ field: "property_type", message: "Invalid option" }] }], error: null })
    const response = await POST(request(validPayload({ property_type: "bungalow" })))
    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({ success: false, external_id: "HOUSING-123456", error: "Validation failed" })
    expect(admin.rpc).toHaveBeenCalledWith("upsert_housing_inventory_submission", expect.objectContaining({ p_status: "invalid" }))
  })

  it("requires built-up area for a villa", async () => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).built_up_area
    const response = await POST(request(payload))
    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({ fields: expect.arrayContaining([expect.objectContaining({ field: "built_up_area.value" })]) })
  })

  it("requires plot area for a plot but does not require bedrooms, bathrooms, or furnishing", async () => {
    const noPlotArea = validPayload({ property_type: "plot" })
    delete (noPlotArea as Record<string, unknown>).built_up_area
    const invalid = await POST(request(noPlotArea))
    expect(invalid.status).toBe(422)
    await expect(invalid.json()).resolves.toMatchObject({ fields: expect.arrayContaining([expect.objectContaining({ field: "plot_area.value" })]) })

    const validPlot = validPayload({ property_type: "plot", plot_area: { value: 808, unit: "sqm" } })
    delete (validPlot as Record<string, unknown>).built_up_area
    const accepted = await POST(request(validPlot))
    expect(accepted.status).toBe(201)
  })

  it("requires rent for rent listings and accepts a rent listing without transaction type", async () => {
    const invalidRent = validPayload({ listing_intent: "rent", price: undefined, transaction_type: undefined })
    const invalid = await POST(request(invalidRent))
    expect(invalid.status).toBe(422)
    await expect(invalid.json()).resolves.toMatchObject({ fields: expect.arrayContaining([expect.objectContaining({ field: "monthly_rent.amount" })]) })

    const accepted = await POST(request(validPayload({ listing_intent: "rent", price: undefined, transaction_type: undefined, monthly_rent: { amount: 250_000, currency: "INR" } })))
    expect(accepted.status).toBe(201)
  })

  it("accepts an under-construction listing with null property age", async () => {
    const response = await POST(request(validPayload({ construction_status: "under_construction", property_age_years: null })))
    expect(response.status).toBe(201)
  })

  it("treats the same external ID as an idempotent update", async () => {
    admin.rpc
      .mockResolvedValueOnce({ data: [inboxRow("HOUSING-123456", false)], error: null })
      .mockResolvedValueOnce({ data: [inboxRow("HOUSING-123456", true)], error: null })
    const first = await POST(request(validPayload()))
    const second = await POST(request(validPayload({
      description: "Revised description",
      name: "Updated Advisor",
      email: "updated@example.com",
      phone: "+44 20 7946 0958",
    })))
    expect(first.status).toBe(201)
    expect(second.status).toBe(200)
    await expect(second.json()).resolves.toMatchObject({ success: true, external_id: "HOUSING-123456", status: "updated" })
    expect(admin.rpc.mock.calls.map(call => call[1].p_external_id)).toEqual(["HOUSING-123456", "HOUSING-123456"])
    expect(admin.rpc.mock.calls[1]?.[1].p_payload).toMatchObject({
      name: "Updated Advisor",
      email: "updated@example.com",
      phone: "+442079460958",
      listing_contact: expect.objectContaining({ name: "Updated Advisor", phone: "+442079460958" }),
    })
  })

  it("rejects non-HTTPS image URLs", async () => {
    const response = await POST(request(validPayload({ images: [{ url: "http://example.com/image.jpg" }] })))
    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({ fields: expect.arrayContaining([expect.objectContaining({ field: "images.0.url" })]) })
  })

  it("rejects an oversized request before parsing it", async () => {
    const response = await POST(request("{}", apiKey, { "content-length": String(HOUSING_INVENTORY_MAX_BODY_BYTES + 1) }))
    expect(response.status).toBe(413)
    await expect(response.json()).resolves.toMatchObject({ success: false, error: "Payload is too large." })
  })

  it("rate limits repeated submissions", async () => {
    for (let index = 0; index < 60; index += 1) {
      const response = await POST(request(validPayload({ external_id: `RATE-${index}` })))
      expect(response.status).toBe(201)
    }
    const limited = await POST(request(validPayload({ external_id: "RATE-61" })))
    expect(limited.status).toBe(429)
  })

  it("never logs the bearer secret or full property description", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined)
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const description = "This full property description must not be logged."
    await POST(request(validPayload({ description })))
    const output = JSON.stringify([...info.mock.calls, ...error.mock.calls])
    expect(output).not.toContain(apiKey)
    expect(output).not.toContain(description)
  })

  it("never returns the bearer secret", async () => {
    const response = await POST(request(validPayload()))
    expect(await response.text()).not.toContain(apiKey)
  })
})

describe("GET /api/integrations/housing/health", () => {
  it("requires the same bearer key and returns a safe health response", async () => {
    const unauthorized = await health(new Request("http://localhost/api/integrations/housing/health"))
    expect(unauthorized.status).toBe(401)

    const response = await health(new Request("http://localhost/api/integrations/housing/health", { headers: { authorization: `Bearer ${apiKey}` } }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ status: "ok", provider: "housing", timestamp: expect.any(String) })
  })
})
