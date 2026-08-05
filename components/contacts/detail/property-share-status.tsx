"use client"

import {
  useState,
} from "react"

import {
  updatePropertyShareStatus,
} from "@/lib/repositories/property-share-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import type {
  PropertyShareStatus,
} from "@/lib/repositories/property-share-repository"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"



type Props = {

  shareId: string

  contactId: string

  propertyId: string

  propertyName: string

  status: PropertyShareStatus

}





const statuses: {
  value: PropertyShareStatus
  label: string
}[] = [

  {
    value: "shared",
    label: "Shared",
  },

  {
    value: "viewed",
    label: "Viewed",
  },

  {
    value: "interested",
    label: "Interested",
  },

  {
    value: "site_visit",
    label: "Site Visit",
  },

  {
    value: "rejected",
    label: "Rejected",
  },

]





export function PropertyShareStatus({
  shareId,
  contactId,
  propertyId,
  propertyName,
  status,
}: Props) {


  const [
    currentStatus,
    setCurrentStatus,
  ] =
  useState(status)



  const [
    updating,
    setUpdating,
  ] =
  useState(false)





  async function update(
  value: PropertyShareStatus | null
) {

  if (!value) {
    return
  }


  setUpdating(true)


  try {


    await updatePropertyShareStatus(
      shareId,
      value
    )



    setCurrentStatus(
      value
    )



    await createActivity({

      contactId,

      propertyId,

      type:
        value === "viewed"
          ? "property_viewed"
          : value === "site_visit"
            ? "site_visit"
            : "note",


      title:
        `Property status updated: ${value}`,


      body:
        `${propertyName} marked as ${value.replace("_"," ")}`,


      date:
        new Date().toISOString(),

    })



  }
  finally {

    setUpdating(false)

  }

}




  return (

    <Select

      value={
        currentStatus
      }

      disabled={
        updating
      }

      onValueChange={
        update
      }

    >

      <SelectTrigger
        className="
          h-7
          w-fit
          text-xs
        "
      >

        <SelectValue />

      </SelectTrigger>


      <SelectContent>

        {
          statuses.map(
            item => (

              <SelectItem
                key={
                  item.value
                }
                value={
                  item.value
                }
              >

                {item.label}

              </SelectItem>

            )
          )
        }

      </SelectContent>


    </Select>

  )

}