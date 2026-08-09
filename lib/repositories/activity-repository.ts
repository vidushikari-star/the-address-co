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
    data: {
      user,
    },
  } = await supabase.auth.getUser()

  const actorId =
    activity.createdBy ??
    activity.userId ??
    user?.id ??
    null


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
    actorId,

  user_id:
    actorId,

})
      .select()
      .single()



  if(error){

    throw error

  }



  // Update last contact touchpoint + move lead stage

if(activity.contactId){

const updatePayload: {
  last_activity_at: string
  next_follow_up_at?: string
  lead_stage?: "contacted"
} = {

  last_activity_at:
    new Date().toISOString(),

}


if(
  activity.nextFollowUpAt
){

  updatePayload.next_follow_up_at =
    activity.nextFollowUpAt

}


if(
  activity.type === "property_shared" ||
  activity.type === "whatsapp" ||
  activity.type === "email" ||
  activity.type === "call"
){

  const {
    data: contact,
  } = await supabase
    .from("contacts")
    .select("lead_stage")
    .eq("id", activity.contactId)
    .maybeSingle()

  if(contact?.lead_stage === "new"){

    updatePayload.lead_stage =
      "contacted"

  }

}



await supabase
.from("contacts")
.update(
  updatePayload
)
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
