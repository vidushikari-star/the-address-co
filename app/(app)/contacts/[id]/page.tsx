import { notFound } from "next/navigation"

import { RelationshipDetail } from "@/components/contacts/detail/relationship-detail"
import { PageContainer } from "@/components/layout/page-container"

import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"

import {
  getContactSummary,
} from "@/lib/repositories/contact-summary-repository"

import {
  isInventoryContact,
} from "@/lib/utils/is-inventory-contact"

import {
  getSiteVisitsByContactId,
} from "@/lib/repositories/site-visit-repository"

import {
  getPropertiesByIds,
} from "@/lib/repositories/property-repository"


type ContactDetailPageProps = {
  params: Promise<{
    id: string
  }>
}



export default async function ContactDetailPage({
  params,
}: ContactDetailPageProps) {


  const {
    id,
  } =
  await params



  const contact =
    await ContactsRepository.getById(id)



  if (!contact) {

    notFound()

  }



  const inventoryContact =
    isInventoryContact(contact)



  const [
    summary,
    siteVisits,
  ] =
  await Promise.all([

    getContactSummary(
      contact.id,
      {
        useLinkedPropertyData:
          inventoryContact,
      }
    ),

    getSiteVisitsByContactId(
      contact.id
    ),

  ])



  const siteVisitProperties =
    await getPropertiesByIds(
      [
        ...new Set(
          siteVisits.map(
            visit =>
              visit.propertyId
          )
        ),
      ]
    )



  return (

    <PageContainer>

      <RelationshipDetail

        contact={
          contact
        }

        summary={
          summary
        }

        siteVisits={
          siteVisits
        }

        siteVisitProperties={
          siteVisitProperties
        }

      />

    </PageContainer>

  )

}
