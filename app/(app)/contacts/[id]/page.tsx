import { notFound } from "next/navigation"

import { RelationshipDetail } from "@/components/contacts/detail/relationship-detail"
import { PageContainer } from "@/components/layout/page-container"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAuthenticatedCrmReadRepository } from "@/lib/repositories/authenticated-crm-read-repository"
import { loadAuthenticatedCrmData } from "@/lib/observability/crm-server-diagnostics"

import {
  isInventoryContact,
} from "@/lib/utils/is-inventory-contact"


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



  const crm = createAuthenticatedCrmReadRepository(await createServerSupabaseClient())

  const contact =
    await loadAuthenticatedCrmData(
      { route: "/contacts/[id]", area: "contact detail" },
      () => crm.getContactById(id),
    )



  if (!contact) {

    notFound()

  }



  const inventoryContact =
    isInventoryContact(contact)



  const [
    summary,
    siteVisits,
  ] =
  await loadAuthenticatedCrmData(
    { route: "/contacts/[id]", area: "contact detail related data" },
    () => Promise.all([

    crm.getContactSummary(
      contact.id,
      {
        useLinkedPropertyData:
          inventoryContact,
      }
    ),

    crm.getSiteVisitsByContactId(
      contact.id
    ),

    ]),
  )



  const siteVisitProperties =
    await loadAuthenticatedCrmData(
      { route: "/contacts/[id]", area: "contact site-visit properties" },
      () => crm.getPropertiesByIds(
      [
        ...new Set(
          siteVisits.map(
            visit =>
              visit.propertyId
          )
        ),
      ]
      ),
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
