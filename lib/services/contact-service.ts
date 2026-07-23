import {
  getDeals as getSupabaseDeals,
  getDealById as getSupabaseDealById,
  getDealsByContactId as getSupabaseDealsByContactId,
  getDealsByPropertyId as getSupabaseDealsByPropertyId,
} from "@/lib/repositories/deal-repository"


export async function getDeals() {
  return getSupabaseDeals()
}


export async function getDealById(
  id: string
) {
  return getSupabaseDealById(id)
}


export async function getDealsByContactId(
  contactId: string
) {
  return getSupabaseDealsByContactId(
    contactId
  )
}


export async function getDealsByPropertyId(
  propertyId: string
) {
  return getSupabaseDealsByPropertyId(
    propertyId
  )
}