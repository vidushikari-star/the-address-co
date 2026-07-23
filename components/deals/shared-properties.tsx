"use client"

import {
  useState,
} from "react"

import type {
  PropertyShare,
} from "@/lib/repositories/property-share-repository"

import type {
  Property,
} from "@/types/property"

import {
  updatePropertyShareStatus,
} from "@/lib/repositories/property-share-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  Button,
} from "@/components/ui/button"



type Props = {

  shares: PropertyShare[]

  properties: Property[]

}





export function SharedProperties({
  shares,
  properties,
}: Props) {


  const [
    updates,
    setUpdates,
  ] = useState<
    Record<
      string,
      {
        status:string
        feedback:string
      }
    >
  >({})





  function getCurrentValue(
    share:PropertyShare
  ){

    return (

      updates[share.id] ??

      {

        status:
          share.status,

        feedback:
          share.buyerFeedback ?? "",

      }

    )

  }





  function updateField(
    id:string,
    field:"status"|"feedback",
    value:string
  ){


    const existing =
      shares.find(
        item =>
          item.id === id
      )



    if(!existing){

      return

    }



    setUpdates(
      current => ({

        ...current,

        [id]:{

          ...getCurrentValue(
            existing
          ),

          [field]:
            value,

        }

      })
    )

  }





  async function save(
    share:PropertyShare
  ){


    const value =
      getCurrentValue(
        share
      )


    const property =
      properties.find(
        item =>
          item.id === share.propertyId
      )



    const propertyName =
      property?.name ??
      "Property"



    await updatePropertyShareStatus(

      share.id,

      value.status as any,

      value.feedback

    )



    await createActivity({

      type:
        "property_viewed",



      title:

        value.status === "interested"

          ? "Buyer interested in property"

          : value.status === "site_visit"

          ? "Site visit requested"

          : value.status === "rejected"

          ? "Buyer rejected property"

          : value.status === "viewed"

          ? "Buyer viewed property"

          : "Property status updated",





      description:
        propertyName,




      body:
        `Property status changed to ${value.status.replace(
          /_/g,
          " "
        )}

Feedback:
${value.feedback || "No feedback added"}`,




      dealId:
        share.dealId,



      contactId:
        share.contactId,



      propertyId:
        share.propertyId,



      date:
        new Date().toISOString(),

    })


  }





  if(!shares.length){

    return (

      <p className="text-sm text-muted-foreground">

        No properties shared yet.

      </p>

    )

  }





  return (

    <div className="space-y-4">


      {
        shares.map(

          share => {


            const property =
              properties.find(
                item =>
                  item.id === share.propertyId
              )



            const value =
              getCurrentValue(
                share
              )



            return (

              <div

                key={share.id}

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





                <select

                  className="w-full rounded-md border p-2"

                  value={
                    value.status
                  }

                  onChange={
                    e =>
                      updateField(
                        share.id,
                        "status",
                        e.target.value
                      )
                  }

                >

                  <option value="shared">
                    Shared
                  </option>

                  <option value="viewed">
                    Viewed
                  </option>

                  <option value="interested">
                    Interested
                  </option>

                  <option value="site_visit">
                    Site Visit
                  </option>

                  <option value="rejected">
                    Rejected
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
                        share.id,
                        "feedback",
                        e.target.value
                      )
                  }

                />





                <Button

                  onClick={() =>
                    save(
                      share
                    )
                  }

                >

                  Update

                </Button>


              </div>

            )


          }

        )

      }


    </div>

  )

}