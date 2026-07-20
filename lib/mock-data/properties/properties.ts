import type { Property } from "@/types/property"

export const properties: Property[] = [
  {
    id: "1",
    slug: "casa-ekam",
    name: "Casa Ekam",
    developer: "Ekam Developers",

    listingType: "Primary",
    developmentStage: "under_construction",
    propertyType: "Villa",

    status: "available",

    locality: "Parra",
    location: "North Goa",

    coverImage:
      "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff",

    price: {
      asking: 82500000,
      commission: 2,
    },

    specifications: {
      bedrooms: 4,
      bathrooms: 5,
      carpetArea: 4200,
    },

    tags: [
      "Private Pool",
      "Gated Community",
      "Staff Quarters",
    ],

    advisor: "Vidushi Kari",

    buyerMatches: 8,

    lastShared: "2026-07-16",

    note: "Best suited for NRI families.",
  },

  {
    id: "2",
    slug: "108-horizon",
    name: "108 Horizon",
    developer: "Vianaar",

    listingType: "Primary",
    developmentStage: "under_construction",
    propertyType: "Apartment",

    status: "available",

    locality: "Dona Paula",
    location: "Goa",

    coverImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0",

    price: {
      asking: 48000000,
    },

    specifications: {
      bedrooms: 3,
      bathrooms: 4,
      carpetArea: 2350,
    },

    tags: [
      "Sea View",
      "Staff Quarters",
      "Walking Distance To Beach",
    ],

    advisor: "Vidushi Kari",

    buyerMatches: 12,

    lastShared: "2026-07-15",
  },

  {
    id: "3",
    slug: "alma-forma",
    name: "Alma & Forma",
    developer: "Alcon",

    listingType: "Primary",
    developmentStage: "under_construction",
    propertyType: "Villa",

    status: "available",

    locality: "Verla",
    location: "North Goa",

    coverImage:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",

    price: {
      asking: 69500000,
    },

    specifications: {
      bedrooms: 4,
      bathrooms: 5,
      carpetArea: 3400,
    },

    tags: [
      "Private Pool",
      "Garden",
      "Corner Plot",
    ],

    advisor: "Vidushi Kari",

    buyerMatches: 6,

    lastShared: "2026-07-18",
  },
]