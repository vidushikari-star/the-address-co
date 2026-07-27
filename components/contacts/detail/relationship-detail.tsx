"use client"

import type { Contact } from "@/types"

import {
  RelationshipHeader,
} from "./relationship-header"

import {
  RelationshipSnapshot,
} from "./relationship-snapshot"

import {
  RelationshipTimeline,
} from "./relationship-timeline"

import {
  RelationshipProperties,
} from "./relationship-properties"

import {
  RelationshipTasks,
} from "./relationship-tasks"

import {
  RelationshipDeals,
} from "./relationship-deals"



type RelationshipDetailProps = {
  contact: Contact
}



export function RelationshipDetail({
  contact,
}: RelationshipDetailProps) {


  return (

    <div className="flex min-h-0 flex-col">


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
          xl:grid-cols-[280px_minmax(0,1fr)_360px]
        "
      >





        {/* CLIENT SNAPSHOT */}

        <section
          className="
            order-1
            min-w-0
          "
        >

          <RelationshipSnapshot
            contact={contact}
          />

        </section>







        {/* ACTIVITY TIMELINE */}

        <section
          className="
            order-5
            min-w-0
            xl:order-2
          "
        >

          <RelationshipTimeline
            contact={contact}
          />

        </section>







        {/* CRM ACTIONS */}

        <section
          className="
            order-2
            min-w-0
            space-y-4
            sm:space-y-6
            xl:order-3
          "
        >


          <RelationshipDeals
            contact={contact}
          />



          <RelationshipProperties
            contact={contact}
          />



          <RelationshipTasks
            contact={contact}
          />


        </section>



      </div>


    </div>

  )

}