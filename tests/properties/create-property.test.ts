import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => ({ getServerUserProfile: vi.fn() }))
const server = vi.hoisted(() => ({ rpc: vi.fn() }))
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/auth/server-user-profile", () => auth)
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn().mockResolvedValue(server) }))
vi.mock("next/cache", () => cache)

import { createPropertyAction } from "@/lib/actions/property-actions"
import { getCreatedPropertyPath, PropertyCreateSchema, type PropertyCreateInput } from "@/lib/properties/property-schema"

const requestId = "b2041f1f-89e9-4a59-a8de-00169502f523"

function validInput(overrides: Partial<PropertyCreateInput> = {}): PropertyCreateInput {
  return {
    requestId,
    name: "Villa Verde",
    transactionType: "Sale",
    listingType: "Primary",
    developmentStage: "ready_to_move",
    propertyType: "Villa",
    status: "available",
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  auth.getServerUserProfile.mockResolvedValue({ id: "admin-1", role: "admin" })
  server.rpc.mockResolvedValue({ data: [{ property_id: "property-1", property_slug: "villa-verde" }], error: null })
})

describe("property creation validation", () => {
  it("accepts a valid property and preserves optional blank fields as undefined", () => {
    const result = PropertyCreateSchema.safeParse(validInput({
      developer: "",
      location: "",
      furnishing: undefined,
      price: undefined,
      bedrooms: undefined,
    }))

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.developer).toBeUndefined()
      expect(result.data.location).toBeUndefined()
      expect(result.data.price).toBeUndefined()
    }
  })

  it("requires only the minimum property identity and structured values", () => {
    expect(PropertyCreateSchema.safeParse(validInput({ name: "" })).success).toBe(false)
    expect(PropertyCreateSchema.safeParse(validInput({ location: undefined })).success).toBe(true)
  })

  it("rejects unsupported enum values before a database write", () => {
    const result = PropertyCreateSchema.safeParse({
      ...validInput(),
      transactionType: "Lease",
      furnishing: "fully_furnished",
    })

    expect(result.success).toBe(false)
  })
})

describe("createPropertyAction", () => {
  it("rejects unauthorized creation without invoking Supabase", async () => {
    auth.getServerUserProfile.mockResolvedValue(null)

    await expect(createPropertyAction(validInput())).resolves.toEqual({
      ok: false,
      error: "You do not have permission to create properties.",
    })
    expect(server.rpc).not.toHaveBeenCalled()
  })

  it("returns the new property ID and revalidates both the list and detail destination", async () => {
    const result = await createPropertyAction(validInput({ furnishing: "furnished", price: 52_000_000 }))

    expect(result).toEqual({ ok: true, property: { id: "property-1", slug: "villa-verde" } })
    expect(server.rpc).toHaveBeenCalledWith("create_property_for_user", expect.objectContaining({
      p_request_id: requestId,
      property_payload: expect.objectContaining({
        furnishing: "furnished",
        price: { asking: 52_000_000 },
      }),
    }))
    expect(cache.revalidatePath).toHaveBeenCalledWith("/properties")
    expect(cache.revalidatePath).toHaveBeenCalledWith("/properties/villa-verde")
    expect(getCreatedPropertyPath("villa-verde")).toBe("/properties/villa-verde?created=true")
  })

  it("returns a sanitized failure when Supabase rejects the write", async () => {
    server.rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "new row violates row-level security policy" } })
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)

    const result = await createPropertyAction(validInput())

    expect(result).toEqual({ ok: false, error: `We could not save this property. Please try again. Reference: ${requestId}` })
    expect(errorSpy).toHaveBeenCalledWith("Property creation failed", expect.objectContaining({ code: "42501", requestId }))
    errorSpy.mockRestore()
  })

  it("uses the same idempotency key on a retry, allowing the database RPC to return the original property", async () => {
    const first = await createPropertyAction(validInput())
    const retry = await createPropertyAction(validInput())

    expect(first).toEqual(retry)
    expect(server.rpc).toHaveBeenCalledTimes(2)
    expect(server.rpc.mock.calls.map(call => call[1].p_request_id)).toEqual([requestId, requestId])
  })
})
