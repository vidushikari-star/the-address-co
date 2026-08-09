"use client"

import type {
  Contact,
} from "@/types"

import {
  RelationshipHeader,
} from "./relationship-header"

import {
  RelationshipSnapshot,
} from "./relationship-snapshot"

import {
  LeadIntentCard,
} from "./lead-intent-card"

import {
  RelationshipTimeline,
} from "./relationship-timeline"

import {
  RelationshipProperties,
} from "./relationship-properties"

import {
  RelationshipInventory,
} from "./relationship-inventory"

import {
  RelationshipTasks,
} from "./relationship-tasks"

import {
  SiteVisitsSection,
} from "@/components/deals/site-visits-section"

import {
  RelationshipDeals,
} from "./relationship-deals"

import {
  RelationshipNotes,
} from "./relationship-notes"

import {
  NextFollowUpCard,
} from "./next-follow-up-card"

import {
  ContactFinancialSnapshot,
} from "./contact-financial-snapshot"

import {
  ContactCrmCard,
} from "./contact-crm-card"

import type {
  ContactSummary,
} from "@/lib/repositories/contact-summary-repository"

import {
  isInventoryContact,
} from "@/lib/utils/is-inventory-contact"

import type {
  SiteVisit,
} from "@/types/site-visit"

import type {
  Property,
} from "@/types/property"



type RelationshipDetailProps = {
  contact: Contact
  summary: ContactSummary
  siteVisits: SiteVisit[]
  siteVisitProperties: Property[]
}


export function RelationshipDetail({
contact,
summary,
siteVisits,
siteVisitProperties,
}: RelationshipDetailProps) {


  const inventoryContact =
    isInventoryContact(contact)

  return (

    <div
      className="
        flex
        min-h-0
        flex-col
      "
    >

      <RelationshipHeader
        contact={contact}
      />



      <div
        className="
          grid
          gap-4
          p-4
          sm:gap-6
          sm:p-6
          xl:grid-cols-[320px_minmax(0,1fr)_360px]
        "
      >


        {/* LEFT - CLIENT PROFILE */}

        <aside
          className="
            order-1
            min-w-0
            space-y-4
            xl:row-span-2
          "
        >

         <RelationshipSnapshot
            contact={contact}
            showRequirements={!inventoryContact}
            showCrm={!inventoryContact}
          />


          {
            inventoryContact && (

              <RelationshipInventory
                contact={contact}
              />

            )
          }


          {
            inventoryContact && (

              <ContactCrmCard
                contact={contact}
              />

            )
          }


<ContactFinancialSnapshot
  summary={summary}
  linkedPropertyScope={inventoryContact}
/>


<LeadIntentCard
  contact={contact}
  inventoryContact={inventoryContact}
/>

        </aside>





        {/* CENTER - SALES JOURNEY */}

        <main
          className="
            order-2
            min-w-0
            space-y-4
          "
        >

          <NextFollowUpCard
            contact={contact}
          />


          <SiteVisitsSection
            visits={siteVisits}
            properties={siteVisitProperties}
            contactId={contact.id}
          />


          <RelationshipDeals
            contact={contact}
            matchLinkedProperties={inventoryContact}
          />


          {
            !inventoryContact && (

              <RelationshipProperties
                contact={contact}
              />

            )
          }


          <RelationshipTasks
            contact={contact}
          />

        </main>





        {/* RIGHT - TIMELINE + NOTES */}

        <aside
          className="
            order-3
            min-w-0
            space-y-4
          "
        >

          <RelationshipTimeline
            contact={contact}
          />


          <RelationshipNotes
            contact={contact}
          />

        </aside>


      </div>

    </div>

  )

}
