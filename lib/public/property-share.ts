import { createAdminSupabaseClient } from "@/lib/supabase/admin"

const SIGNED_DOCUMENT_TTL_SECONDS = 5 * 60

const PUBLIC_DOCUMENT_CATEGORIES = ["brochure", "floor_plan"] as const

type PublicPropertyRow = {
  id: string
  public_share_token: string | null
  public_share_enabled: boolean | null
  public_share_show_price: boolean | null
  public_share_show_advisor_contact: boolean | null
  public_share_show_documents: boolean | null
  public_share_show_exact_address: boolean | null
  public_share_expires_at: string | null
  public_share_advisor_name: string | null
  public_share_advisor_phone: string | null
  public_share_advisor_whatsapp: string | null
  public_share_advisor_email: string | null
  name: string | null
  locality: string | null
  location: string | null
  listing_type: string | null
  transaction_type: "Sale" | "Rental" | null
  property_type: string | null
  development_stage: string | null
  furnishing: string | null
  price: { asking?: number | string | null; rent?: number | string | null } | null
  specifications: {
    bedrooms?: number | null
    bathrooms?: number | null
    carpetArea?: number | null
    plotArea?: number | null
    builtUpArea?: number | null
  } | null
  description: string | null
  amenities: string[] | null
}

type PublicImageRow = {
  url: string
  is_cover: boolean | null
  media_type: "image" | "video" | null
}

type PublicDocumentRow = {
  name: string
  category: string
  file_url: string
  file_type: string | null
}

export type PublicPropertyShare = {
  token: string
  title: string
  location: string | null
  listingType: string | null
  transactionType: "Sale" | "Rental"
  propertyType: string | null
  developmentStage: string | null
  furnishing: string | null
  specifications: {
    bedrooms: number | null
    bathrooms: number | null
    carpetArea: number | null
    plotArea: number | null
    builtUpArea: number | null
  }
  price: number | null
  description: string | null
  amenities: string[]
  advisor: {
    name: string | null
    phone: string | null
    whatsapp: string | null
    email: string | null
  } | null
  images: Array<{
    url: string
    isCover: boolean
    mediaType: "image" | "video"
  }>
  documents: Array<{
    name: string
    category: "brochure" | "floor_plan"
    fileType: string | null
    url: string
  }>
}

type PublicPropertyShareRecord = {
  propertyId: string
  share: PublicPropertyShare
}

const PROPERTY_PROJECTION = [
  "id",
  "public_share_token",
  "public_share_enabled",
  "public_share_show_price",
  "public_share_show_advisor_contact",
  "public_share_show_documents",
  "public_share_show_exact_address",
  "public_share_expires_at",
  "public_share_advisor_name",
  "public_share_advisor_phone",
  "public_share_advisor_whatsapp",
  "public_share_advisor_email",
  "name",
  "locality",
  "location",
  "listing_type",
  "transaction_type",
  "property_type",
  "development_stage",
  "furnishing",
  "price",
  "specifications",
  "description",
  "amenities",
].join(",")

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

function asFiniteNumber(value: number | string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function propertyDocumentStoragePath(fileUrl: string) {
  try {
    const pathname = new URL(fileUrl).pathname
    const prefix = "/storage/v1/object/public/property-documents/"

    if (!pathname.startsWith(prefix)) return null

    const path = decodeURIComponent(pathname.slice(prefix.length))
    return path && !path.includes("..") ? path : null
  } catch {
    return null
  }
}

async function createSignedPublicDocumentUrl(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  fileUrl: string,
) {
  const path = propertyDocumentStoragePath(fileUrl)
  if (!path) return null

  const { data, error } = await admin.storage
    .from("property-documents")
    .createSignedUrl(path, SIGNED_DOCUMENT_TTL_SECONDS)

  if (error || !data?.signedUrl || !isSafeHttpUrl(data.signedUrl)) return null
  return data.signedUrl
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false
  const timestamp = Date.parse(expiresAt)
  return Number.isFinite(timestamp) && timestamp <= Date.now()
}

function publicAdvisor(row: PublicPropertyRow): PublicPropertyShare["advisor"] {
  if (!row.public_share_show_advisor_contact) return null

  const advisor = {
    name: row.public_share_advisor_name?.trim() || null,
    phone: row.public_share_advisor_phone?.trim() || null,
    whatsapp: row.public_share_advisor_whatsapp?.trim() || null,
    email: row.public_share_advisor_email?.trim() || null,
  }

  return Object.values(advisor).some(Boolean) ? advisor : null
}

/**
 * Resolves a public-share token with service-role access, then returns only the
 * explicit public projection. The private property ID is retained server-side
 * for the enquiry endpoint and is never returned to the page.
 */
export async function getPublicPropertyShareRecord(
  token: string,
): Promise<PublicPropertyShareRecord | null> {
  if (!isUuid(token)) return null

  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from("properties")
    .select(PROPERTY_PROJECTION)
    .eq("public_share_token", token)
    .eq("public_share_enabled", true)
    .maybeSingle()

  if (error) throw error
  const property = data as PublicPropertyRow | null

  if (
    !property ||
    !property.public_share_enabled ||
    !property.public_share_token ||
    isExpired(property.public_share_expires_at)
  ) {
    return null
  }

  const [imageResult, documentResult] = await Promise.all([
    admin
      .from("property_images")
      .select("url,is_cover,media_type")
      .eq("property_id", property.id)
      .eq("public_share_allowed", true)
      .order("created_at", { ascending: true }),
    property.public_share_show_documents
      ? admin
          .from("property_documents")
          .select("name,category,file_url,file_type")
          .eq("property_id", property.id)
          .eq("public_share_allowed", true)
          .in("category", PUBLIC_DOCUMENT_CATEGORIES)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  if (imageResult.error) throw imageResult.error
  if (documentResult.error) throw documentResult.error

  const images: PublicPropertyShare["images"] = ((imageResult.data ?? []) as PublicImageRow[])
    .filter(image => isSafeHttpUrl(image.url))
    .map(image => ({
      url: image.url,
      isCover: image.is_cover ?? false,
      mediaType: image.media_type === "video" ? "video" : "image",
    }))

  const signedDocuments = await Promise.all(
    ((documentResult.data ?? []) as PublicDocumentRow[]).map(async document => {
      if (!PUBLIC_DOCUMENT_CATEGORIES.includes(document.category as typeof PUBLIC_DOCUMENT_CATEGORIES[number])) {
        return null
      }

      const url = await createSignedPublicDocumentUrl(admin, document.file_url)
      if (!url) return null

      return {
        name: document.name,
        category: document.category as "brochure" | "floor_plan",
        fileType: document.file_type,
        url,
      }
    }),
  )

  const transactionType = property.transaction_type === "Rental" ? "Rental" : "Sale"
  const price = property.public_share_show_price
    ? asFiniteNumber(transactionType === "Rental" ? property.price?.rent : property.price?.asking)
    : null

  return {
    propertyId: property.id,
    share: {
      token: property.public_share_token,
      title: property.name?.trim() || "Property",
      // Exact address is an explicit opt-in. Never fall back to it when only a
      // locality was requested.
      location: property.public_share_show_exact_address
        ? property.location?.trim() || property.locality?.trim() || null
        : property.locality?.trim() || null,
      listingType: property.listing_type,
      transactionType,
      propertyType: property.property_type,
      developmentStage: property.development_stage,
      furnishing: property.furnishing,
      specifications: {
        bedrooms: property.specifications?.bedrooms ?? null,
        bathrooms: property.specifications?.bathrooms ?? null,
        carpetArea: property.specifications?.carpetArea ?? null,
        plotArea: property.specifications?.plotArea ?? null,
        builtUpArea: property.specifications?.builtUpArea ?? null,
      },
      price,
      description: property.description?.trim() || null,
      amenities: Array.isArray(property.amenities)
        ? property.amenities.filter(item => typeof item === "string" && item.trim()).map(item => item.trim())
        : [],
      advisor: publicAdvisor(property),
      images,
      documents: signedDocuments.filter((document): document is NonNullable<typeof document> => Boolean(document)),
    },
  }
}

export async function getPublicPropertyShare(token: string) {
  const result = await getPublicPropertyShareRecord(token)
  return result?.share ?? null
}

export const PUBLIC_SHARE_DOCUMENT_TTL_SECONDS = SIGNED_DOCUMENT_TTL_SECONDS
