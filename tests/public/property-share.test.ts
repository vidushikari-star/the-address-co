import { describe, expect, it, beforeEach, vi } from "vitest"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const supabase = vi.hoisted(() => ({ createAdminSupabaseClient: vi.fn() }))

vi.mock("@/lib/supabase/admin", () => supabase)

import {
  getPublicPropertyShare,
  PUBLIC_SHARE_DOCUMENT_TTL_SECONDS,
} from "@/lib/public/property-share"
import {
  resetPublicShareEnquiryRateLimitForTests,
  takePublicShareEnquiryRequest,
} from "@/lib/public/public-share-enquiry-rate-limit"

const token = "b2041f1f-89e9-4a59-a8de-00169502f523"

function query(result: { data: unknown; error?: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
  }
  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.in.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.maybeSingle.mockResolvedValue(result)
  Object.assign(builder, result)
  return builder
}

function propertyRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "property-internal-id",
    public_share_token: token,
    public_share_enabled: true,
    public_share_show_price: false,
    public_share_show_advisor_contact: false,
    public_share_show_documents: false,
    public_share_show_exact_address: false,
    public_share_expires_at: null,
    public_share_advisor_name: "Internal advisor should not leak",
    public_share_advisor_phone: "+91 9999999999",
    public_share_advisor_whatsapp: null,
    public_share_advisor_email: "advisor@example.com",
    name: "Sea View Villa",
    locality: "Assagao",
    location: "12 Private Lane, Assagao",
    listing_type: "Resale",
    transaction_type: "Sale",
    property_type: "Villa",
    development_stage: "ready_to_move",
    furnishing: "furnished",
    price: { asking: 52_000_000, commission: 1_000_000 },
    specifications: { bedrooms: 4, bathrooms: 4, builtUpArea: 3200 },
    description: "Approved public description",
    amenities: ["Pool", "Concierge"],
    note: "Never selected or returned",
    owner_contact: "Never selected or returned",
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  const property = query({ data: propertyRow(), error: null })
  const images = query({ data: [{ url: "https://example.com/property.jpg", is_cover: true, media_type: "image" }], error: null })
  const documents = query({ data: [], error: null })
  const admin = {
    from: vi.fn((table: string) => table === "properties" ? property : table === "property_images" ? images : documents),
    storage: { from: vi.fn(() => ({ createSignedUrl: vi.fn() })) },
  }
  supabase.createAdminSupabaseClient.mockReturnValue(admin)
})

describe("public property projection", () => {
  it("returns only the public-safe projection and hides price, exact address, advisor contact, and internal IDs by default", async () => {
    const share = await getPublicPropertyShare(token)

    expect(share).toEqual(expect.objectContaining({
      token,
      title: "Sea View Villa",
      location: "Assagao",
      price: null,
      advisor: null,
      images: [{ url: "https://example.com/property.jpg", isCover: true, mediaType: "image" }],
      documents: [],
    }))
    expect(JSON.stringify(share)).not.toContain("property-internal-id")
    expect(JSON.stringify(share)).not.toContain("Private Lane")
    expect(JSON.stringify(share)).not.toContain("commission")
    expect(JSON.stringify(share)).not.toContain("Internal advisor")
    expect(JSON.stringify(share)).not.toContain("owner_contact")
  })

  it("returns approved signed brochure URLs only when documents are enabled", async () => {
    const property = query({ data: propertyRow({ public_share_show_documents: true }), error: null })
    const images = query({ data: [], error: null })
    const documents = query({
      data: [
        {
          name: "Brochure",
          category: "brochure",
          file_url: "https://project.supabase.co/storage/v1/object/public/property-documents/property-internal-id/brochure.pdf",
          file_type: "application/pdf",
        },
        {
          name: "Private legal document",
          category: "legal",
          file_url: "https://project.supabase.co/storage/v1/object/public/property-documents/property-internal-id/deed.pdf",
          file_type: "application/pdf",
        },
      ],
      error: null,
    })
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://project.supabase.co/storage/v1/object/sign/property-documents/property-internal-id/brochure.pdf?token=signed" }, error: null })
    supabase.createAdminSupabaseClient.mockReturnValue({
      from: vi.fn((table: string) => table === "properties" ? property : table === "property_images" ? images : documents),
      storage: { from: vi.fn(() => ({ createSignedUrl })) },
    })

    const share = await getPublicPropertyShare(token)

    expect(share?.documents).toEqual([{
      name: "Brochure",
      category: "brochure",
      fileType: "application/pdf",
      url: expect.stringContaining("/object/sign/property-documents/"),
    }])
    expect(createSignedUrl).toHaveBeenCalledWith("property-internal-id/brochure.pdf", PUBLIC_SHARE_DOCUMENT_TTL_SECONDS)
    expect(createSignedUrl).toHaveBeenCalledTimes(1)
  })

  it("reveals price, exact address, and advisor contact only after their independent share settings are enabled", async () => {
    const property = query({ data: propertyRow({
      public_share_show_price: true,
      public_share_show_exact_address: true,
      public_share_show_advisor_contact: true,
    }), error: null })
    const images = query({ data: [], error: null })
    const documents = query({ data: [], error: null })
    supabase.createAdminSupabaseClient.mockReturnValue({
      from: vi.fn((table: string) => table === "properties" ? property : table === "property_images" ? images : documents),
      storage: { from: vi.fn() },
    })

    await expect(getPublicPropertyShare(token)).resolves.toMatchObject({
      location: "12 Private Lane, Assagao",
      price: 52_000_000,
      advisor: {
        name: "Internal advisor should not leak",
        phone: "+91 9999999999",
        email: "advisor@example.com",
      },
    })
  })

  it("does not resolve disabled or expired shares", async () => {
    const disabled = query({ data: propertyRow({ public_share_enabled: false }), error: null })
    supabase.createAdminSupabaseClient.mockReturnValue({
      from: vi.fn(() => disabled),
      storage: { from: vi.fn() },
    })

    await expect(getPublicPropertyShare(token)).resolves.toBeNull()

    const expired = query({ data: propertyRow({ public_share_expires_at: "2020-01-01T00:00:00.000Z" }), error: null })
    supabase.createAdminSupabaseClient.mockReturnValue({
      from: vi.fn(() => expired),
      storage: { from: vi.fn() },
    })
    await expect(getPublicPropertyShare(token)).resolves.toBeNull()
  })

  it("rejects predictable slugs before making a database request", async () => {
    await expect(getPublicPropertyShare("sea-view-villa")).resolves.toBeNull()
    expect(supabase.createAdminSupabaseClient).not.toHaveBeenCalled()
  })
})

describe("public enquiry guard", () => {
  it("rate limits repeated anonymous writes per token and caller", () => {
    resetPublicShareEnquiryRateLimitForTests()
    for (let index = 0; index < 5; index += 1) expect(takePublicShareEnquiryRequest("client:token", 10)).toBe(true)
    expect(takePublicShareEnquiryRequest("client:token", 10)).toBe(false)
    expect(takePublicShareEnquiryRequest("client:token", 10 + 15 * 60 * 1000)).toBe(true)
  })
})

describe("public-share browser boundary", () => {
  it("keeps CRM repositories and service-role configuration out of the public page and enquiry client", async () => {
    const root = process.cwd()
    const [page, enquiry] = await Promise.all([
      readFile(join(root, "app", "(public)", "share", "[slug]", "page.tsx"), "utf8"),
      readFile(join(root, "components", "public", "property-enquiry-form.tsx"), "utf8"),
    ])

    const publicClientSource = `${page}\n${enquiry}`
    expect(publicClientSource).not.toMatch(/lib\/supabase\/client|property-repository|property-image-repository|property-document-repository|ContactsRepository|createActivity/)
    expect(publicClientSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
    expect(page).toContain("getPublicPropertyShare")
    expect(page).toContain("await connection()")
    expect(page).not.toContain("searchParams")
    expect(page).not.toContain("?advisor=")
  })

  it("uses a server-only projection for every core CRM table dependency", async () => {
    const root = process.cwd()
    const projection = await readFile(join(root, "lib", "public", "property-share.ts"), "utf8")
    const publicPage = await readFile(join(root, "app", "(public)", "share", "[slug]", "page.tsx"), "utf8")

    expect(projection).toContain('createAdminSupabaseClient')
    expect(projection).toContain('.from("properties")')
    expect(projection).toContain('.from("property_images")')
    expect(projection).toContain('.from("property_documents")')
    expect(projection).not.toContain('.from("user_profiles")')
    expect(publicPage).not.toMatch(/\.from\(["'](properties|deals|activities|site_visits|contacts|commissions|expenses|property_contacts|property_commissions|property_documents|user_profiles)["']\)/)
  })
})
