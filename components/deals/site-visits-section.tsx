"use client"

import {
  useState,
} from "react"

import {
  Button,
} from "@/components/ui/button"

import {
  SiteVisitDrawer,
} from "./site-visit-drawer"

import {
  SiteVisits,
} from "./site-visits"

import type {
  SiteVisit,
} from "@/types/site-visit"

import type {
  Property,
} from "@/types/property"



type Props = {

  visits: SiteVisit[]

  properties: Property[]

  dealId:string

  contactId:string

  dealStage?:string

}




export function SiteVisitsSection({

  visits,

  properties,

  dealId,

  contactId,

  dealStage,

}:Props){


  const [
    open,
    setOpen,
  ] =
  useState(false)



  return (

    <section className="rounded-2xl border p-6 space-y-4">


      <div className="flex items-center justify-between">


        <h2 className="text-xl font-semibold">

          Site Visits

        </h2>



        <Button

          size="sm"

          onClick={() =>
            setOpen(true)
          }

        >

          + Schedule Site Visit

        </Button>


      </div>





      <SiteVisitDrawer

        open={
          open
        }

        onOpenChange={
          setOpen
        }

        dealId={
          dealId
        }

        contactId={
          contactId
        }

      />





      <SiteVisits

        visits={
          visits
        }

        properties={
          properties
        }

        dealStage={
          dealStage
        }

      />


    </section>

  )

}