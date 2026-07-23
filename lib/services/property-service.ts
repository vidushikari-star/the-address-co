import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"

import {
  getDealsByContactId,
  getDealsByPropertyId,
} from "@/lib/repositories/deal-repository"

import {
  getPropertiesByIds,
  getProperties,
  getPropertyBySlug,
} from "@/lib/repositories/property-repository"

import { getPropertyMatches } from "@/lib/services/property-matching"



export async function getContactDetail(
  contactId: string
) {

  const contact =
    await ContactsRepository.getByIdWithRelations(
      contactId
    )


  if (!contact) {
    return null
  }


  const [
    deals,
    linkedProperties,
    properties,
  ] = await Promise.all([

    getDealsByContactId(
      contact.id
    ),

    getPropertiesByIds(
      contact.propertyIds ?? []
    ),

    getProperties(),

  ])


  const recommendedProperties =
    getPropertyMatches(
      contact,
      properties
    )


  return {
    contact,

    deals,

    linkedProperties,

    recommendedProperties,

    activities:
      contact.activities ?? [],

    tasks:
      contact.tasks ?? [],

    notes:
      contact.notes ?? [],
  }
}



export async function getPropertyDetail(
  slug: string
) {

  const property =
    await getPropertyBySlug(
      slug
    )


  if (!property) {
    return null
  }


  const relatedDeals =
    property.id
      ? await getDealsByPropertyId(
          property.id
        )
      : []


  return {
    property,

    relatedDeals,
  }
}