export type PropertyStatus =
  | "available"
  | "viewed"
  | "shortlisted"
  | "rejected"
  | "offer"
  | "purchased"

export type ListingType =
  | "Primary"
  | "Resale"
  | "Rental"

export type PropertyType =
  | "Apartment"
  | "Villa"
  | "Plot"
  | "Penthouse"
  | "Commercial"

export interface PropertyPrice {
  asking: number
  commission?: number
}

export interface PropertySpecifications {
  bedrooms: number
  bathrooms: number
  carpetArea: number
}

export interface Property {
  id: string

  name: string

  developer: string

  listingType: ListingType

  propertyType: PropertyType

  status: PropertyStatus

  locality?: string
  location: string

  coverImage?: string

  price: PropertyPrice

  specifications: PropertySpecifications

  advisor: string

  buyerMatches: number

  lastShared: string

  note?: string
}