"use client"

import {
  useState,
} from "react"

import type {
  SiteVisit,
  SiteVisitStatus,
} from "@/types/site-visit"

import type {
  Property,
} from "@/types/property"

import {
  updateSiteVisitStatus,
} from "@/lib/repositories/site-visit-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  updateDeal,
} from "@/lib/repositories/deal-repository"

import {
  Button,
} from "@/components/ui/button"



type Props = {

  visits: SiteVisit[]

  properties: Property[]

  dealStage?: string

}





export function SiteVisits({
  visits,
  properties,
  dealStage,
}: Props) {


  const [
    updates,
    setUpdates,
  ] = useState<
    Record<
      string,
      {
        status: SiteVisitStatus
        feedback:string
      }
    >
  >({})





  function currentValue(
    visit:SiteVisit
  ){

    return (

      updates[visit.id] ??

      {

        status:
          visit.status,

        feedback:
          visit.buyerFeedback ?? "",

      }

    )

  }





  function updateField(
  id: string,
  field: "status" | "feedback",
  value: string | SiteVisitStatus
){


    const visit =
      visits.find(
        item =>
          item.id === id
      )



    if(!visit){

      return

    }



    setUpdates(
      current => ({

        ...current,

        [id]:{

          ...currentValue(
            visit
          ),

          [field]:
            value,

        }

      })
    )


  }





  async function save(
    visit:SiteVisit
  ){


    const value =
      currentValue(
        visit
      )



    const property =
      properties.find(
        item =>
          item.id === visit.propertyId
      )



    await updateSiteVisitStatus(

      visit.id,

      value.status,

      value.feedback

    )



    if(
      value.status === "completed" &&
      dealStage !== "negotiation"
    ){

      await updateDeal(

        visit.dealId,

        {

          stage:
            "negotiation",

        }

      )

    }





    await createActivity({

      type:
        "site_visit",


      title:

        value.status === "completed"

          ? "Site visit completed"

          : value.status === "cancelled"

          ? "Site visit cancelled"

          : value.status === "rescheduled"

          ? "Site visit rescheduled"

          : "Site visit updated",



      description:
        property?.name ??
        "Property",



      body:
        `Site visit status:
${value.status.replace(
  /_/g,
  " "
)}

Buyer Feedback:
${value.feedback || "No feedback added"}`,



      dealId:
        visit.dealId,


      contactId:
        visit.contactId,


      propertyId:
        visit.propertyId,


      date:
        new Date().toISOString(),

    })


  }





  if(!visits.length){

    return (

      <p className="text-sm text-muted-foreground">

        No site visits scheduled yet.

      </p>

    )

  }





  return (

    <div className="space-y-4">


      {
        visits.map(

          visit => {


            const property =
              properties.find(
                item =>
                  item.id === visit.propertyId
              )


            const value =
              currentValue(
                visit
              )



            return (

              <div

                key={
                  visit.id
                }

                className="rounded-xl border p-5 space-y-4"

              >


                <div>

                  <h3 className="font-semibold">

                    {
                      property?.name ??
                      "Property"
                    }

                  </h3>


                  <p className="text-sm text-muted-foreground">

                    {
                      property?.locality ??
                      ""
                    }

                  </p>

                </div>





                <div className="text-sm">

                  <p>

                    Date:
                    {" "}
                    {visit.scheduledDate}

                  </p>


                  <p>

                    Time:
                    {" "}
                    {visit.scheduledTime}

                  </p>

                </div>





                <select

                  className="w-full rounded-md border p-2"

                  value={
                    value.status
                  }

                  onChange={
                    e =>
                      updateField(
                        visit.id,
                        "status",
                        e.target.value as SiteVisitStatus
                      )
                  }

                >

                  <option value="scheduled">
                    Scheduled
                  </option>


                  <option value="completed">
                    Completed
                  </option>


                  <option value="cancelled">
                    Cancelled
                  </option>


                  <option value="rescheduled">
                    Rescheduled
                  </option>


                </select>





                <textarea

                  className="w-full rounded-md border p-2"

                  placeholder="Buyer feedback..."

                  value={
                    value.feedback
                  }

                  onChange={
                    e =>
                      updateField(
                        visit.id,
                        "feedback",
                        e.target.value
                      )
                  }

                />





                <Button

                  onClick={() =>
                    save(
                      visit
                    )
                  }

                >

                  Update Visit

                </Button>


              </div>

            )


          }

        )

      }


    </div>

  )

}