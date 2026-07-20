import { deals } from "@/lib/mock-data/deals/deals"

import type { Deal } from "@/types/deal"

export function getDeals(): Deal[] {
  return deals
}

export function getDealById(
  id: string
): Deal | undefined {
  return deals.find(
    (deal) => deal.id === id
  )
}

export function getDealsByContactId(
  contactId: string
): Deal[] {
  return deals.filter(
    (deal) =>
      deal.contactId === contactId
  )
}

export function getDealsByPropertyId(
  propertyId: string
): Deal[] {
  return deals.filter(
    (deal) =>
      deal.propertyId === propertyId
  )
}