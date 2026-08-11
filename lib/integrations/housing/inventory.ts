import { createHash } from "node:crypto"
import { z } from "zod"

export const HOUSING_INVENTORY_MAX_BODY_BYTES = 1_000_000
export const HOUSING_INVENTORY_MAX_IMAGES = 50

const propertyTypes = [
  "apartment", "independent_house", "duplex", "independent_floor", "villa",
  "penthouse", "studio", "plot", "farm_house", "agricultural_land",
] as const

const AreaSchema = z.object({
  value: z.number().finite().positive(),
  unit: z.enum(["sqft", "sqm", "sqyd", "acre", "hectare"]),
})

const MoneySchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.literal("INR"),
})

const ImageSchema = z.object({
  url: z.string().url().refine(value => new URL(value).protocol === "https:", "Image URLs must use HTTPS."),
  position: z.number().int().min(1).max(HOUSING_INVENTORY_MAX_IMAGES).optional(),
  is_cover: z.boolean().optional(),
})

const AddressSchema = z.object({
  address_line: z.string().trim().max(500).nullable().optional(),
  locality: z.string().trim().min(1).max(160).nullable().optional(),
  sub_locality: z.string().trim().max(160).nullable().optional(),
  city: z.string().trim().min(1).max(160).nullable().optional(),
  state: z.string().trim().max(160).nullable().optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must contain 6 digits.").nullable().optional(),
  latitude: z.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.number().finite().min(-180).max(180).nullable().optional(),
}).optional()

export const HousingInventorySubmissionSchema = z.object({
  external_id: z.string().trim().min(1, "external_id is required.").max(180),
  property_category: z.enum(["residential", "commercial"]),
  listing_intent: z.enum(["sell", "rent", "pg_coliving"]),
  building_or_society_name: z.string().trim().max(250).nullable().optional(),
  property_type: z.enum(propertyTypes),
  built_up_area: AreaSchema.nullable().optional(),
  carpet_area: AreaSchema.nullable().optional(),
  plot_area: AreaSchema.nullable().optional(),
  transaction_type: z.enum(["new_booking", "resale"]).nullable().optional(),
  construction_status: z.enum(["ready_to_move", "under_construction"]),
  property_age_years: z.number().int().min(0).max(250).nullable().optional(),
  bedrooms: z.number().int().min(0).max(50).nullable().optional(),
  bathrooms: z.number().int().min(0).max(50).nullable().optional(),
  balconies: z.number().int().min(0).max(50).nullable().optional(),
  furnishing_status: z.enum(["fully_furnished", "semi_furnished", "unfurnished"]).nullable().optional(),
  furnishings: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  covered_parking: z.number().int().min(0).max(100).nullable().optional(),
  open_parking: z.number().int().min(0).max(100).nullable().optional(),
  price: MoneySchema.nullable().optional(),
  monthly_rent: MoneySchema.nullable().optional(),
  maintenance_monthly: z.number().finite().nonnegative().nullable().optional(),
  brokerage: z.object({
    applicable: z.boolean(),
    amount: z.number().finite().nonnegative().nullable().optional(),
    negotiable: z.boolean().optional(),
  }).nullable().optional(),
  floor_number: z.number().int().min(-10).max(300).nullable().optional(),
  total_floors: z.number().int().min(1).max(300).nullable().optional(),
  facing: z.enum(["north", "east", "west", "south", "north_east", "north_west", "south_east", "south_west"]).nullable().optional(),
  servant_room: z.boolean().nullable().optional(),
  description: z.string().trim().max(20_000).nullable().optional(),
  address: AddressSchema,
  images: z.array(ImageSchema).max(HOUSING_INVENTORY_MAX_IMAGES, `A maximum of ${HOUSING_INVENTORY_MAX_IMAGES} images is allowed.`).default([]),
  property_highlights: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
}).passthrough().superRefine((submission, context) => {
  const landListing = submission.property_type === "plot" || submission.property_type === "agricultural_land"
  const buildingListing = !landListing

  if (buildingListing && !submission.built_up_area) {
    context.addIssue({ code: "custom", path: ["built_up_area", "value"], message: "Built-up area is required for this property type." })
  }

  if (landListing && !submission.plot_area) {
    context.addIssue({ code: "custom", path: ["plot_area", "value"], message: "Plot area is required for plot and agricultural-land listings." })
  }

  if (submission.listing_intent === "sell") {
    if (!submission.price) {
      context.addIssue({ code: "custom", path: ["price", "amount"], message: "Price is required for sell listings." })
    }
    if (!submission.transaction_type) {
      context.addIssue({ code: "custom", path: ["transaction_type"], message: "Transaction type is required for sell listings." })
    }
  }

  if (submission.listing_intent === "rent" && !submission.monthly_rent && !submission.price) {
    context.addIssue({ code: "custom", path: ["monthly_rent", "amount"], message: "Monthly rent is required for rent listings." })
  }
})

export type HousingInventorySubmission = z.output<typeof HousingInventorySubmissionSchema>

export type HousingValidationField = {
  field: string
  message: string
}

export type HousingInventoryInboxRow = {
  id: string
  external_id: string
  payload: HousingInventorySubmission
  payload_hash: string
  version: number
  status: "received" | "validated" | "invalid" | "ready_for_mapping" | "processed" | "rejected"
  validation_errors: HousingValidationField[]
  received_at: string
  updated_at: string
  processed_at: string | null
  crm_property_id: string | null
}

type InboxQueryResult = {
  data: unknown
  error: { code?: string; message?: string } | null
}

type InboxQuery = PromiseLike<InboxQueryResult> & {
  eq: (column: string, value: string) => InboxQuery
  order: (column: string, options: { ascending: boolean }) => InboxQuery
  limit: (count: number) => InboxQuery
  maybeSingle: () => PromiseLike<InboxQueryResult>
  select: (columns: string) => InboxQuery
  upsert: (value: Record<string, unknown>, options: { onConflict: string }) => InboxQuery
  single: () => PromiseLike<InboxQueryResult>
}

export type HousingInventoryInboxAdmin = {
  from: (table: string) => unknown
  rpc: (functionName: string, args: Record<string, unknown>) => PromiseLike<InboxQueryResult>
}

function inboxQuery(admin: HousingInventoryInboxAdmin) {
  return admin.from("housing_inventory_submissions") as InboxQuery
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`
  const object = value as Record<string, unknown>
  return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`
}

export function hashHousingInventoryPayload(payload: unknown) {
  return createHash("sha256").update(stableJson(payload)).digest("hex")
}

export function validationFields(error: z.ZodError): HousingValidationField[] {
  return error.issues.map(issue => ({
    field: issue.path.length ? issue.path.join(".") : "payload",
    message: issue.message,
  }))
}

export function externalIdFromPayload(payload: unknown) {
  const candidate = typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>).external_id
    : undefined
  const parsed = z.string().trim().min(1).max(180).safeParse(candidate)
  return parsed.success ? parsed.data : undefined
}

export function validateHousingInventoryPayload(payload: unknown):
  | { ok: true; submission: HousingInventorySubmission }
  | { ok: false; fields: HousingValidationField[] } {
  const parsed = HousingInventorySubmissionSchema.safeParse(payload)
  return parsed.success
    ? { ok: true, submission: parsed.data }
    : { ok: false, fields: validationFields(parsed.error) }
}

export async function storeHousingInventorySubmission(
  admin: HousingInventoryInboxAdmin,
  input: {
    externalId: string
    payload: Record<string, unknown>
    status: HousingInventoryInboxRow["status"]
    validationErrors: HousingValidationField[]
  }
): Promise<{ submission: HousingInventoryInboxRow; updated: boolean }> {
  const { data, error } = await admin.rpc("upsert_housing_inventory_submission", {
    p_external_id: input.externalId,
    p_payload: input.payload,
    p_payload_hash: hashHousingInventoryPayload(input.payload),
    p_status: input.status,
    p_validation_errors: input.validationErrors,
  })
  if (error) throw error

  const row = (data as Array<HousingInventoryInboxRow & { was_updated: boolean }> | null)?.[0]
  if (!row) throw new Error("Housing inventory submission was not returned.")

  return {
    submission: row,
    updated: row.was_updated,
  }
}

export async function listHousingInventorySubmissions(
  admin: HousingInventoryInboxAdmin,
  limit = 25
): Promise<HousingInventoryInboxRow[]> {
  const { data, error } = await inboxQuery(admin)
    .select("id,external_id,payload,payload_hash,version,status,validation_errors,received_at,updated_at,processed_at,crm_property_id")
    .order("received_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as HousingInventoryInboxRow[]
}

export async function readHousingInventoryRequestBody(request: Request): Promise<
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; status: 400 | 413 | 415; error: string }
> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
  if (!contentType.includes("application/json")) {
    return { ok: false, status: 415, error: "Content-Type must be application/json." }
  }

  const declaredLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(declaredLength) && declaredLength > HOUSING_INVENTORY_MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: "Payload is too large." }
  }

  const reader = request.body?.getReader()
  if (!reader) return { ok: false, status: 400, error: "Invalid JSON payload." }

  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > HOUSING_INVENTORY_MAX_BODY_BYTES) {
      await reader.cancel()
      return { ok: false, status: 413, error: "Payload is too large." }
    }
    chunks.push(value)
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)))
    if (!payload || Array.isArray(payload) || typeof payload !== "object") {
      return { ok: false, status: 400, error: "JSON payload must be an object." }
    }
    return { ok: true, payload: payload as Record<string, unknown> }
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON payload." }
  }
}
