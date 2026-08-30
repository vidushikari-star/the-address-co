import { beforeEach, describe, expect, it, vi } from "vitest"

const auth = vi.hoisted(() => ({ getServerUserProfile: vi.fn() }))
const share = vi.hoisted(() => ({ getPublicPropertyShareRecord: vi.fn() }))
const rateLimit = vi.hoisted(() => ({ takePublicShareEnquiryRequest: vi.fn() }))
const supabase = vi.hoisted(() => ({ createAdminSupabaseClient: vi.fn() }))
const server = vi.hoisted(() => ({ createServerSupabaseClient: vi.fn() }))
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/auth/server-user-profile", () => auth)
vi.mock("@/lib/public/property-share", () => share)
vi.mock("@/lib/public/public-share-enquiry-rate-limit", () => rateLimit)
vi.mock("@/lib/supabase/admin", () => supabase)
vi.mock("@/lib/supabase/server", () => server)
vi.mock("next/cache", () => cache)

import { PATCH } from "@/app/api/properties/[id]/public-share/route"
import { POST } from "@/app/api/public/property-shares/[token]/enquiries/route"

const token = "b2041f1f-89e9-4a59-a8de-00169502f523"
const propertyId = "95d4ae27-6867-4313-b3b9-62c6bb56960c"
const yashProfileId = "5a1cd0bc-e9db-430b-890e-bef393cf104b"

function publicShareRequest(enabled: boolean) {
  return new Request(`http://localhost/api/properties/${propertyId}/public-share`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      enabled,
      showPrice: false,
      showAdvisorContact: false,
      showDocuments: false,
      showExactAddress: false,
      expiresAt: null,
      advisorName: null,
      advisorPhone: null,
      advisorWhatsapp: null,
      advisorEmail: null,
      imageIds: [],
      documentIds: [],
    }),
  })
}

function profile(id: string, role: "admin" | "sales") {
  return { id, role, name: "CRM user", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }
}

function configurePublicShareServer() {
  const propertyUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  const propertyQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: propertyId, public_share_token: token }, error: null }),
    update: propertyUpdate,
  }
  propertyQuery.select.mockReturnValue(propertyQuery)
  propertyQuery.eq.mockReturnValue(propertyQuery)

  const mediaUpdateQuery = () => {
    const query = { update: vi.fn(), eq: vi.fn(), in: vi.fn() }
    query.update.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.in.mockResolvedValue({ error: null })
    return query
  }
  const images = mediaUpdateQuery()
  const documents = mediaUpdateQuery()
  server.createServerSupabaseClient.mockResolvedValue({
    from: vi.fn((table: string) => table === "properties" ? propertyQuery : table === "property_images" ? images : documents),
  })

  return { propertyUpdate }
}

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
  it("keeps admin enable and disable behavior unchanged", async () => {
    auth.getServerUserProfile.mockResolvedValue(profile("admin-1", "admin"))
    const enabledServer = configurePublicShareServer()

    const enabled = await PATCH(publicShareRequest(true), { params: Promise.resolve({ id: propertyId }) })

    expect(enabled.status).toBe(200)
    await expect(enabled.json()).resolves.toEqual({ share: { enabled: true, token, url: `/share/${token}` } })
    expect(enabledServer.propertyUpdate).toHaveBeenCalledWith(expect.objectContaining({ public_share_enabled: true, public_share_token: token }))

    vi.clearAllMocks()
    auth.getServerUserProfile.mockResolvedValue(profile("admin-1", "admin"))
    const disabledServer = configurePublicShareServer()
    const disabled = await PATCH(publicShareRequest(false), { params: Promise.resolve({ id: propertyId }) })

    expect(disabled.status).toBe(200)
    await expect(disabled.json()).resolves.toEqual({ share: { enabled: false, token, url: `/share/${token}` } })
    expect(disabledServer.propertyUpdate).toHaveBeenCalledWith(expect.objectContaining({ public_share_enabled: false, public_share_token: token }))
  })

  it("allows Yash's stable profile ID to enable and disable the normal public share link", async () => {
    auth.getServerUserProfile.mockResolvedValue(profile(yashProfileId, "sales"))
    const enabledServer = configurePublicShareServer()

    const enabled = await PATCH(publicShareRequest(true), { params: Promise.resolve({ id: propertyId }) })

    expect(enabled.status).toBe(200)
    await expect(enabled.json()).resolves.toEqual({ share: { enabled: true, token, url: `/share/${token}` } })
    expect(enabledServer.propertyUpdate).toHaveBeenCalledWith(expect.objectContaining({ public_share_enabled: true }))

    vi.clearAllMocks()
    auth.getServerUserProfile.mockResolvedValue(profile(yashProfileId, "sales"))
    const disabledServer = configurePublicShareServer()
    const disabled = await PATCH(publicShareRequest(false), { params: Promise.resolve({ id: propertyId }) })

    expect(disabled.status).toBe(200)
    expect(disabledServer.propertyUpdate).toHaveBeenCalledWith(expect.objectContaining({ public_share_enabled: false }))
  })

  it("does not let another CRM user bypass the UI with a direct PATCH", async () => {
    auth.getServerUserProfile.mockResolvedValue(profile("11111111-1111-4111-8111-111111111111", "sales"))

    const response = await PATCH(publicShareRequest(true), { params: Promise.resolve({ id: propertyId }) })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Public-sharing management access is required." })
    expect(server.createServerSupabaseClient).not.toHaveBeenCalled()
  })

  it("never allows an unauthenticated browser to change public-share settings", async () => {
    auth.getServerUserProfile.mockResolvedValue(null)

    const response = await PATCH(
      publicShareRequest(true),
      { params: Promise.resolve({ id: propertyId }) },
    )

    expect(response.status).toBe(403)
    expect(server.createServerSupabaseClient).not.toHaveBeenCalled()
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
