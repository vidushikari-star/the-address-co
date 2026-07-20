import type { Contact } from "@/types/contact"
import type { Property } from "@/types/property"

export interface BuyerMatch {
  contact: Contact
  score: number
  reasons: string[]
}

export function getBuyerMatches(
  property: Property,
  buyers: Contact[]
): BuyerMatch[] {
  const matches: BuyerMatch[] = buyers.map((contact) => {
    const requirements =
      contact.buyerProfile?.requirements ??
      contact.buyerRequirements

    if (!requirements) {
      return {
        contact,
        score: 0,
        reasons: [],
      }
    }

    let score = 0
    const reasons: string[] = []

    const minBudget =
      requirements.budget?.min ?? 0

    const maxBudget =
      requirements.budget?.max ??
      Number.MAX_SAFE_INTEGER


    // Budget
    if (
      property.price.asking >= minBudget &&
      property.price.asking <= maxBudget
    ) {
      score += 35
      reasons.push("Within budget range")
    }


    // Location
    if (
      requirements.preferredLocations?.some(
        (location) =>
          location.toLowerCase() ===
          property.location.toLowerCase()
      )
    ) {
      score += 25
      reasons.push("Preferred location")
    }


    // Property Type
    const propertyType =
      (property as any).propertyType ??
      (property as any).type ??
      ""

    if (
      requirements.propertyTypes?.some(
        (type) =>
          type.toLowerCase() ===
          propertyType.toLowerCase()
      )
    ) {
      score += 20
      reasons.push("Property type match")
    }


    // Bedrooms
    if (
      requirements.bedrooms &&
      property.specifications?.bedrooms >=
        requirements.bedrooms
    ) {
      score += 10
      reasons.push("Bedroom requirement met")
    }


    // Features (safe fallback)
    const features =
      (property as any).features ?? []

    if (
      requirements.privatePool &&
      features.includes("private_pool")
    ) {
      score += 5
      reasons.push("Private pool")
    }

    if (
      requirements.staffQuarters &&
      features.includes("staff_quarters")
    ) {
      score += 5
      reasons.push("Staff quarters")
    }


    return {
      contact,
      score,
      reasons,
    }
  })

  return matches
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score
    )
}