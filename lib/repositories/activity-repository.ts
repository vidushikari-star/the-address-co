import { supabase } from "@/lib/supabase/client"

import {
  mapActivityRow,
} from "@/lib/mappers/activity.mapper"

import type { Activity } from "@/types/activity"



export async function getActivitiesByContactId(
  contactId: string
): Promise<Activity[]> {

  const {
    data,
    error,
  } =
    await supabase
      .from("activities")
      .select("*")
      .eq(
        "contact_id",
        contactId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )


  if (error) {
    throw error
  }


  return (data ?? []).map(
    mapActivityRow
  )
}





export async function getActivitiesByDealId(
  dealId: string
): Promise<Activity[]> {

  const {
    data,
    error,
  } =
    await supabase
      .from("activities")
      .select("*")
      .eq(
        "deal_id",
        dealId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )


  if (error) {
    throw error
  }


  return (data ?? []).map(
    mapActivityRow
  )
}


export async function getActivitiesByPropertyId(
  propertyId: string
): Promise<Activity[]> {

  const {
    data,
    error,
  } =
    await supabase
      .from("activities")
      .select("*")
      .eq(
        "property_id",
        propertyId
      )
      .order(
        "created_at",
        {
          ascending:false,
        }
      )


  if(error){

    throw error

  }


  return (
    data ?? []
  ).map(
    mapActivityRow
  )

}


export async function createActivity(
  activity:
    Partial<Activity>
    & {
      nextFollowUpAt?: string
    }
): Promise<Activity> {


  const {
    data,
    error,
  } =
    await supabase
      .from("activities")
      .insert({

  contact_id:
    activity.contactId,

  deal_id:
    activity.dealId,

  property_id:
    activity.propertyId,

  type:
    activity.type,

  title:
    activity.title,

  description:
    activity.description,

  body:
    activity.body,

  activity_date:
    activity.date,

  created_by:
    activity.createdBy,

  user_id:
    activity.userId,

})
      .select()
      .single()



  if(error){

    throw error

  }



  // Update contact touchpoints and lead stage

if(activity.contactId){


const {
data: contact,
error: contactError,
} =
await supabase
.from("contacts")
.select(
`
lead_stage
`
)
.eq(
"id",
activity.contactId
)
.single()



if(contactError){

throw contactError

}



await supabase
.from("contacts")
.update({

  last_activity_at:
    new Date().toISOString(),


  last_contacted_at:
    new Date().toISOString(),


  ...(contact?.lead_stage === "new" && {

    lead_stage:
      "contacted",

  }),


  ...(activity.nextFollowUpAt && {

    next_follow_up_at:
      activity.nextFollowUpAt,

  }),

})
.eq(
"id",
activity.contactId
)


}




  return mapActivityRow(data)

}

export async function getAllActivities():Promise<Activity[]> {


  const {
    data,
    error,
  } =
    await supabase
      .from("activities")
      .select("*")
      .order(
        "created_at",
        {
          ascending:false,
        }
      )


  if(error){

    throw error

  }



  return (
    data ?? []
  ).map(
    mapActivityRow
  )

}