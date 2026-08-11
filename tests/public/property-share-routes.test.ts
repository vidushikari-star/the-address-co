import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => ({ getServerUserProfile: vi.fn() }))
const share = vi.hoisted(() => ({ getPublicPropertyShareRecord: vi.fn() }))
const rateLimit = vi.hoisted(() => ({ takePublicShareEnquiryRequest: vi.fn() }))
const supabase = vi.hoisted(() => ({ createAdminSupabaseClient: vi.fn() }))
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/auth/server-user-profile", () => auth)
vi.mock("@/lib/public/property-share", () => share)
vi.mock("@/lib/public/public-share-enquiry-rate-limit", () => rateLimit)
vi.mock("@/lib/supabase/admin", () => supabase)
vi.mock("next/cache", () => cache)

import { PATCH } from "@/app/api/properties/[id]/public-share/route"
import { POST } from "@/app/api/public/property-shares/[token]/enquiries/route"

const token = "b2041f1f-89e9-4a59-a8de-00169502f523"
const propertyId = "95d4ae27-6867-4313-b3b9-62c6bb56960c"

function enquiryRequest(body: Record<string, string>) {
  return new Request(`http://localhost/api/public/property-shares/${token}/enquiries`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.1" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  rateLimit.takePublicShareEnquiryRequest.mockReturnValue(true)
})

describe("public property-share routes", () => {
  it("never allows an unauthenticated browser to change public-share settings", async () => {
    auth.getServerUserProfile.mockResolvedValue(null)

    const response = await PATCH(
      new Request(`http://localhost/api/properties/${propertyId}/public-share`, { method: "PATCH", body: "{}" }),
      { params: Promise.resolve({ id: propertyId }) },
    )

    expect(response.status).toBe(403)
    expect(supabase.createAdminSupabaseClient).not.toHaveBeenCalled()
    expect(cache.revalidatePath).not.toHaveBeenCalled()
  })

  it("accepts visitor input through a server handler without exposing or accepting a property ID from the browser", async () => {
    const contactInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: "contact-internal-id" }, error: null }) }),
    })
    const activityInsert = vi.fn().mockResolvedValue({ error: null })
    const admin = {
      from: vi.fn((table: string) => table === "contacts" ? { insert: contactInsert } : { insert: activityInsert }),
    }
    supabase.createAdminSupabaseClient.mockReturnValue(admin)
    share.getPublicPropertyShareRecord.mockResolvedValue({
      propertyId,
      share: { title: "Sea View Villa", propertyType: "Villa", location: "Assagao" },
    })

    const response = await POST(enquiryRequest({
      name: "Avery Buyer",
      phone: "+91 99999 00000",
      email: "avery@example.com",
      message: "Please arrange a visit.",
    }), { params: Promise.resolve({ token }) })

    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload).toEqual({ ok: true })
    expect(contactInsert).toHaveBeenCalledWith(expect.objectContaining({
      first_name: "Avery",
      last_name: "Buyer",
      lead_source: "property_share",
      property_type: "villa",
      locations: ["Assagao"],
    }))
    expect(activityInsert).toHaveBeenCalledWith(expect.objectContaining({
      property_id: propertyId,
      contact_id: "contact-internal-id",
    }))
    expect(JSON.stringify(payload)).not.toContain(propertyId)
  })

  it("does not write CRM rows for a revoked public token", async () => {
    share.getPublicPropertyShareRecord.mockResolvedValue(null)

    const response = await POST(enquiryRequest({ name: "Avery Buyer", phone: "+91 99999 00000" }), {
      params: Promise.resolve({ token }),
    })

    expect(response.status).toBe(404)
    expect(supabase.createAdminSupabaseClient).not.toHaveBeenCalled()
  })
})
