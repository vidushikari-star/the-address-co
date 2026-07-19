import { Property } from "@/types/property"

export const properties: Property[] = [
  {
    id: "1",

    name: "108 Horizon",

    developer: "Sankalp",

    listingType: "Primary",

    propertyType: "Apartment",

    status: "available",

    location: "Dona Paula",

    price: {
      asking: 78000000,
      commission: 2,
    },

    specifications: {
      bedrooms: 3,
      bathrooms: 4,
      carpetArea: 3400,
    },

    advisor: "Vidushi Kari",

    buyerMatches: 8,

    lastShared: "2 days ago",
  },

  {
    id: "2",

    name: "Casa Ekam",

    developer: "Ekam Developers",

    listingType: "Primary",

    propertyType: "Villa",

    status: "available",

    location: "Parra",

    price: {
      asking: 105000000,
      commission: 2,
    },

    specifications: {
      bedrooms: 4,
      bathrooms: 5,
      carpetArea: 4200,
    },

    advisor: "Vidushi Kari",

    buyerMatches: 4,

    lastShared: "Yesterday",
  },
]