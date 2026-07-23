"use client"

import {
  useState,
} from "react"

import {
  Plus,
  CalendarPlus,
  CheckCircle,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  ActivityDrawer,
} from "@/components/forms/activity-drawer"

import {
  SiteVisitDrawer,
} from "@/components/deals/site-visit-drawer"

import {
  CloseDealDrawer,
} from "@/components/deals/close-deal-drawer"



type Props = {

  deal:any

}





export function DealActions({
  deal,
}:Props) {


  const [
    activityOpen,
    setActivityOpen,
  ] = useState(false)



  const [
    siteVisitOpen,
    setSiteVisitOpen,
  ] = useState(false)



  const [
    closeDealOpen,
    setCloseDealOpen,
  ] = useState(false)





  return (

    <>


      <Button

        variant="outline"

        onClick={() =>
          setSiteVisitOpen(true)
        }

      >

        <CalendarPlus className="mr-2 h-4 w-4" />

        Site Visit

      </Button>





      <Button

        variant="outline"

        onClick={() =>
          setCloseDealOpen(true)
        }

      >

        <CheckCircle className="mr-2 h-4 w-4" />

        Close Deal

      </Button>





      <Button

        onClick={() =>
          setActivityOpen(true)
        }

      >

        <Plus className="mr-2 h-4 w-4" />

        Add Activity

      </Button>





      <ActivityDrawer

        open={
          activityOpen
        }

        onOpenChange={
          setActivityOpen
        }

        dealId={
          deal.id
        }

        contactId={
          deal.contactId
        }

        propertyId={
          deal.propertyId
        }

      />





      <SiteVisitDrawer

        open={
          siteVisitOpen
        }

        onOpenChange={
          setSiteVisitOpen
        }

        dealId={
          deal.id
        }

        contactId={
          deal.contactId
        }

      />





      <CloseDealDrawer

        open={
          closeDealOpen
        }

        onOpenChange={
          setCloseDealOpen
        }

        deal={
          deal
        }

      />


    </>

  )

}