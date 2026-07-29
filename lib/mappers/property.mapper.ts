import type { Property } from "@/types/property"

type PropertyPrice = {
  asking?: number | string | null
}

type PropertySpecifications = {
  bedrooms?: number | null
  bathrooms?: number | null
  carpetArea?: number | null
  plotArea?: number | null
  builtUpArea?: number | null
}

type PropertyRow = {
  id: string
  name: string | null
  slug: string | null

  property_type: string | null
  propertyType: string | null

  developer: string | null

  listing_type: string | null
  listingType: string | null

  transaction_type: string | null
  transactionType: string | null

  development_stage: string | null
  developmentStage: string | null

  status: Property["status"] | null

  location: string | null
  locality: string | null
  google_map_link: string | null

  cover_image: string | null
  coverImage: string | null

  public_link: string | null

  price: number | PropertyPrice | null

  specifications: PropertySpecifications | null

  bedrooms: number | null
  bathrooms: number | null
  carpet_area: number | null
  plot_area: number | null
  built_up_area: number | null

  description: string | null
  amenities: string[] | null
  furnishing: Property["furnishing"] | null
  tags: string[] | null

  advisor: string | null

  buyer_matches: number | null
  last_shared: string | null

  note: string | null
}

function toPropertyType(value: string | null | undefined): Property["propertyType"] {
  switch (value) {
    case "Apartment":
    case "Villa":
    case "Plot":
    case "Penthouse":
    case "Commercial":
      return value
    default:
      return "Villa"
  }
}

function toListingType(value: string | null | undefined): Property["listingType"] {
  switch (value) {
    case "Primary":
    case "Resale":
      return value
    default:
      return "Primary"
  }
}

function toTransactionType(
  value: string | null | undefined
): Property["transactionType"] {
  switch (value) {
    case "Sale":
    case "Rental":
      return value
    default:
      return "Sale"
  }
}

function toDevelopmentStage(
  value: string | null | undefined
): Property["developmentStage"] {
  switch (value) {
    case "under_construction":
    case "ready_to_move":
    case "resale":
      return value
    default:
      return "ready_to_move"
  }
}

export function mapPropertyRow(
  row: PropertyRow
): Property {
  return {
    id: row.id,

    name: row.name ?? "",

    slug: row.slug ?? "",

    propertyType: toPropertyType(
      row.property_type ??
      row.propertyType
    ),

    developer: row.developer ?? "",

    listingType: toListingType(
      row.listing_type ??
      row.listingType
    ),

    transactionType: toTransactionType(
      row.transaction_type ??
      row.transactionType
    ),

    developmentStage: toDevelopmentStage(
      row.development_stage ??
      row.developmentStage
    ),

    status:
      row.status ??
      "available",

    location:
      row.location ??
      "",

    locality:
      row.locality ??
      "",

    googleMapLink:
      row.google_map_link ??
      "",

    coverImage:
      row.cover_image ??
      row.coverImage ??
      "",

    publicLink:
      row.public_link ??
      "",

    price: {
      asking:
        row.price !== null &&
        typeof row.price === "object"
          ? Number(row.price.asking ?? 0)
          : Number(row.price ?? 0),
    },

    specifications: {
      bedrooms:
        row.specifications?.bedrooms ??
        row.bedrooms ??
        0,

      bathrooms:
        row.specifications?.bathrooms ??
        row.bathrooms ??
        0,

      carpetArea:
        row.specifications?.carpetArea ??
        row.carpet_area ??
        0,

      plotArea:
        row.specifications?.plotArea ??
        row.plot_area ??
        0,

      builtUpArea:
        row.specifications?.builtUpArea ??
        row.built_up_area ??
        0,
    },

    description:
      row.description ??
      "",

    amenities:
      row.amenities ??
      [],

    furnishing:
      row.furnishing ??
      undefined,

    tags:
      row.tags ??
      [],

    advisor:
      row.advisor ??
      "",

    buyerMatches:
      row.buyer_matches ??
      0,

    lastShared:
      row.last_shared ??
      "",

    note:
      row.note ??
      "",
  }
}