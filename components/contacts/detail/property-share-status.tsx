"use client"

import {
  useState,
} from "react"

import {
  supabase,
} from "@/lib/supabase/client"

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



const stageMap = {

  shared:
    "contacted",

  viewed:
    "qualified",

  interested:
    "active",

  site_visit:
    "viewing",

  rejected:
    null,

} as const



const activityTypeMap = {

  shared:
    "property_shared",

  viewed:
    "property_viewed",

  interested:
    "note",

  site_visit:
    "site_visit",

  rejected:
    "note",

} as const



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


if(!value){

  return

}



setUpdating(true)


try {


await updatePropertyShareStatus(
  shareId,
  value
)



const nextStage =
stageMap[value]



if(nextStage){


await supabase
.from("contacts")
.update({

  lead_stage:
    nextStage,

})
.eq(
"id",
contactId
)


}



setCurrentStatus(
value
)



await createActivity({

contactId,

propertyId,

type:
activityTypeMap[value],

title:
`Property status updated: ${value}`,

body:
`${propertyName} marked as ${value.replace("_"," ")}`,

date:
new Date().toISOString(),

})


}
catch(error){

console.error(
"Failed updating property share status",
error
)

}
finally{

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
        (item)=>(
          
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