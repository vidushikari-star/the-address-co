import type {
  Contact,
} from "@/types/contact"



const inventoryRelationshipTypes = new Set([
  "owner",
  "developer",
  "mou holder",
  "broker",
])



export function isInventoryContact(
  contact: Pick<
    Contact,
    "relationshipTypes"
  >
){


  return (
    contact.relationshipTypes?.some(
      relationship =>
        inventoryRelationshipTypes.has(
          relationship
            .toLowerCase()
            .replaceAll(
              "_",
              " "
            )
        )
    )
    ?? false
  )

}
