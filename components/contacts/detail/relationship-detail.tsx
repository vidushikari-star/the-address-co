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

import {
  RelationshipNotes,
} from "./relationship-notes"


type RelationshipDetailProps = {
  contact: Contact
}


export function RelationshipDetail({
  contact,
}: RelationshipDetailProps) {

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

          <RelationshipDeals
            contact={contact}
          />


          <RelationshipProperties
            contact={contact}
          />


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