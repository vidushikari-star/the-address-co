import { properties } from "@/lib/mock-data/properties/properties"

export function getProperties() {
  return properties
}

export function getPropertyById(id: string) {
  return properties.find((property) => property.id === id)
}

export function getPropertyBySlug(slug: string) {
  return properties.find((property) => property.slug === slug)
}

export function getPropertiesByIds(ids: string[]) {
  return properties.filter((property) =>
    ids.includes(property.id)
  )
}