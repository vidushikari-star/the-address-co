import type { Contact } from "@/types/contact"
import type { Property } from "@/types/property"


export interface PropertyMatch {
  property: Property
  score: number
  reasons: string[]
}



export function getPropertyMatches(
  contact: Contact,
  properties: Property[]
): PropertyMatch[] {


  const requirements =
    contact.buyerProfile?.requirements ??
    contact.buyerRequirements



  if (!requirements) {

    return []

  }





  return properties

    .map((property) => {


      let score = 0

      const reasons: string[] = []





      const minBudget =
        requirements.budget?.min ?? 0



      const maxBudget =
        requirements.budget?.max ??
        Number.MAX_SAFE_INTEGER





      // Budget

      const propertyPrice =
        property.transactionType === "Rental"
          ? property.price.rent
          : property.price.asking



      if (
        propertyPrice !== undefined &&
        propertyPrice >= minBudget &&
        propertyPrice <= maxBudget
      ) {

        score += 35

        reasons.push(
          "Within budget"
        )

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

        reasons.push(
          "Preferred location"
        )

      }







      // Property type

      if (
        requirements.propertyTypes?.some(
          (type) =>
            type.toLowerCase() ===
            property.propertyType.toLowerCase()
        )
      ) {

        score += 20

        reasons.push(
          "Property type match"
        )

      }







      // Bedrooms

      if (
        requirements.bedrooms &&
        property.specifications.bedrooms >=
          requirements.bedrooms
      ) {

        score += 10

        reasons.push(
          "Bedroom match"
        )

      }







      // Features

      const features =
        (property.amenities ?? [])
          .map(
            (feature) =>
              feature.trim().toLowerCase()
          )



      if (
        requirements.privatePool &&
        features.includes("private pool")
      ) {

        score += 5

        reasons.push(
          "Private pool"
        )

      }





      if (
        requirements.staffQuarters &&
        features.includes("staff quarters")
      ) {

        score += 5

        reasons.push(
          "Staff quarters"
        )

      }







      return {

        property,

        score,

        reasons,

      }


    })

    .filter(
      (match) =>
        match.score > 0
    )

    .sort(
      (a, b) =>
        b.score - a.score
    )

}