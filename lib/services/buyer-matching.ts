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

  const matches: BuyerMatch[] =
    buyers.map((contact) => {

      let score = 0
      const reasons:string[] = []


      const minBudget =
        contact.budgetMin ??
        contact.buyerRequirements?.budget.min ??
        0


      const maxBudget =
        contact.budgetMax ??
        contact.buyerRequirements?.budget.max ??
        Number.MAX_SAFE_INTEGER



      const propertyPrice =
        property.transactionType === "Rental"
          ? property.price.rent
          : property.price.asking



      // Budget match
      if(
        propertyPrice !== undefined &&
        propertyPrice >= minBudget &&
        propertyPrice <= maxBudget
      ){

        score += 35

        reasons.push(
          "Within budget"
        )

      }



      // Location match
      const locations =
        contact.locations ??
        contact.buyerRequirements?.preferredLocations ??
        []


      if(
        locations.some(
          location =>
            location.toLowerCase() ===
            property.location.toLowerCase()
        )
      ){

        score += 25

        reasons.push(
          "Preferred location"
        )

      }



      // Property type match
      const propertyTypes =
        contact.propertyTypes ??
        contact.buyerRequirements?.propertyTypes ??
        []


      if(
        propertyTypes.some(
          type =>
            type.toLowerCase() ===
            property.propertyType.toLowerCase()
        )
      ){

        score += 20

        reasons.push(
          "Property type"
        )

      }



      // Bedrooms
      if(
        contact.buyerRequirements?.bedrooms &&
        property.specifications.bedrooms &&
        property.specifications.bedrooms >=
          contact.buyerRequirements.bedrooms
      ){

        score += 10

        reasons.push(
          "Bedroom match"
        )

      }



      // Amenities
      const amenities =
        property.amenities ?? []


      if(
        contact.buyerRequirements?.privatePool &&
        amenities.includes("private_pool")
      ){

        score += 5

        reasons.push(
          "Private pool"
        )

      }


      if(
        contact.buyerRequirements?.staffQuarters &&
        amenities.includes("staff_quarters")
      ){

        score += 5

        reasons.push(
          "Staff quarters"
        )

      }



      return {
        contact,
        score,
        reasons,
      }

    })


  return matches
    .filter(
      match =>
        match.score > 0
    )
    .sort(
      (a,b)=>
        b.score-a.score
    )

}