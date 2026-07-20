import { deals } from "@/lib/mock-data/deals/deals"

export function getDeals() {
  return deals
}

export function getDealById(id: string) {
  return deals.find((deal) => deal.id === id)
}

export function getDealsByContactId(contactId: string) {
  return deals.filter(
    (deal) => deal.contactId === contactId
  )
}

export function getDealsByPropertyId(propertyId: string) {
  return deals.filter(
    (deal) => deal.propertyId === propertyId
  )
}