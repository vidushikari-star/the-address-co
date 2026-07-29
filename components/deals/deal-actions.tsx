"use client"

import {
  useState,
} from "react"

import {
  Plus,
  CalendarPlus,
  CheckCircle,
  MessageCircle,
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

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import type {
  Deal,
} from "@/types/deal"

import type {
  Contact,
} from "@/types/contact"



type Props = {
  deal: Deal
  contact: Contact
}





export function DealActions({
  deal,
  contact,
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






  const rawPhone =
  (
    contact?.whatsapp ??
    contact?.phone ??
    ""
  )
  .replace(
    /\D/g,
    ""
  )


  const phone =
    rawPhone.startsWith("91")
      ? rawPhone
      : `91${rawPhone}`





  const whatsappMessage =

`Hi ${contact?.name ?? ""},

Following up regarding your property requirement.

Please let me know if you would like to discuss the next steps.`






  async function openWhatsApp(){

    if(!phone){

      alert(
        "No WhatsApp number available"
      )

      return

    }



    try{


      await createActivity({

        type:
          "whatsapp",

        title:
          "WhatsApp opened",

        body:
          whatsappMessage,

        contactId:
          contact.id,

        dealId:
          deal.id,

        propertyId:
          deal.propertyId,

        date:
          new Date().toISOString(),

      })


    }catch(error){

      console.error(
        "Failed logging WhatsApp",
        error
      )

    }




    window.open(

      `https://wa.me/${phone}?text=${encodeURIComponent(
        whatsappMessage
      )}`,

      "_blank"

    )


  }







  return (

    <>

      <div className="
        grid
        w-full
        grid-cols-2
        gap-3
        md:flex
        md:w-auto
      ">



        {
          phone && (

            <Button

              onClick={openWhatsApp}

              className="
                h-12
                w-full
                md:w-auto
              "

            >

              <MessageCircle className="mr-2 h-4 w-4"/>

              WhatsApp

            </Button>

          )

        }






        <Button

          variant="outline"

          onClick={() =>
            setSiteVisitOpen(true)
          }

          className="
            h-12
            w-full
            md:w-auto
          "

        >

          <CalendarPlus className="mr-2 h-4 w-4"/>

          Site Visit

        </Button>







        <Button

          variant="outline"

          onClick={() =>
            setCloseDealOpen(true)
          }

          className="
            h-12
            w-full
            md:w-auto
          "

        >

          <CheckCircle className="mr-2 h-4 w-4"/>

          Close Deal

        </Button>







        <Button

          onClick={() =>
            setActivityOpen(true)
          }

          className="
            h-12
            w-full
            md:w-auto
          "

        >

          <Plus className="mr-2 h-4 w-4"/>

          Activity

        </Button>


      </div>








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