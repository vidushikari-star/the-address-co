import { z } from "zod"

export const TRANSACTION_TYPES = ["Sale", "Rental"] as const
export const DEVELOPMENT_STAGES = [
  "ready_to_move",
  "under_construction",
  "resale",
] as const
export const FURNISHING_TYPES = [
  "furnished",
  "semi_furnished",
  "unfurnished",
] as const

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().transform(value => value || undefined)

const optionalAmount = z.number().finite().nonnegative().optional()

export const PropertyCreateSchema = z.object({
  requestId: z.string().uuid(),
  name: z.string().trim().min(1, "Property name is required.").max(180),
  slug: optionalText(180),
  developer: optionalText(180),
  transactionType: z.enum(TRANSACTION_TYPES),
  listingType: z.enum(["Primary", "Resale"]),
  developmentStage: z.enum(DEVELOPMENT_STAGES),
  propertyType: z.enum(["Apartment", "Villa", "Plot", "Penthouse", "Commercial"]),
  status: z.enum(["available", "viewed", "shortlisted", "offer", "purchased", "rejected", "archived"]),
  location: optionalText(180),
  locality: optionalText(180),
  googleMapLink: optionalText(2_000),
  price: optionalAmount,
  rent: optionalAmount,
  securityDeposit: optionalAmount,
  bedrooms: optionalAmount,
  bathrooms: optionalAmount,
  carpetArea: optionalAmount,
  plotArea: optionalAmount,
  builtUpArea: optionalAmount,
  furnishing: z.enum(FURNISHING_TYPES).optional(),
  amenities: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  description: optionalText(20_000),
  tags: z.array(z.string().trim().min(1).max(80)).max(100).default([]),
  coverImage: optionalText(2_000),
  advisor: optionalText(180),
  note: optionalText(10_000),
  housingEnabled: z.boolean().default(false),
})

export type PropertyCreateInput = z.input<typeof PropertyCreateSchema>

export type ValidatedPropertyCreateInput = z.output<typeof PropertyCreateSchema>

export function toPropertyCreatePayload(input: ValidatedPropertyCreateInput) {
  const isRental = input.transactionType === "Rental"

  return {
    name: input.name,
    slug: input.slug,
    developer: input.developer,
    transaction_type: input.transactionType,
    listing_type: input.listingType,
    development_stage: input.developmentStage,
    property_type: input.propertyType,
    status: input.status,
    location: input.location,
    locality: input.locality,
    google_map_link: input.googleMapLink,
    price: isRental
      ? {
          ...(input.rent === undefined ? {} : { rent: input.rent }),
          ...(input.securityDeposit === undefined ? {} : { securityDeposit: input.securityDeposit }),
        }
      : input.price === undefined
        ? {}
        : { asking: input.price },
    specifications: {
      ...(input.bedrooms === undefined ? {} : { bedrooms: input.bedrooms }),
      ...(input.bathrooms === undefined ? {} : { bathrooms: input.bathrooms }),
      ...(input.carpetArea === undefined ? {} : { carpetArea: input.carpetArea }),
      ...(input.plotArea === undefined ? {} : { plotArea: input.plotArea }),
      ...(input.builtUpArea === undefined ? {} : { builtUpArea: input.builtUpArea }),
    },
    description: input.description,
    amenities: input.amenities,
    furnishing: input.furnishing,
    tags: input.tags,
    cover_image: input.coverImage,
    advisor: input.advisor,
    note: input.note,
    housing_enabled: input.housingEnabled,
  }
}

export function getCreatedPropertyPath(slug: string) {
  return `/properties/${encodeURIComponent(slug)}?created=true`
}
