import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"

import { getDealsByContactId } from "@/lib/repositories/deal-repository"
import {
  getPropertiesByIds,
  getProperties,
} from "@/lib/repositories/property-repository"

import { getPropertyMatches } from "@/lib/services/property-matching"

export async function getContactDetail(
  contactId: string
) {
  const contact =
    await ContactsRepository.getById(contactId)

  if (!contact) {
    return null
  }

  const deals = getDealsByContactId(contact.id)

  const linkedProperties =
    getPropertiesByIds(contact.propertyIds)

  const recommendedProperties =
    getPropertyMatches(
      contact,
      getProperties()
    )

  return {
    contact,
    deals,
    linkedProperties,
    recommendedProperties,
    activities: contact.activities,
    tasks: contact.tasks,
    notes: contact.notes,
  }
}


export async function getPropertyDetail(
  slug: string
) {
  const properties = getProperties()

  const property = properties.find(
    (item) => item.slug === slug
  )

  if (!property) {
    return null
  }

  const relatedDeals =
    property.id
      ? getDealsByContactId(property.id)
      : []

  return {
    property,
    relatedDeals,
  }
}