"use server"

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function createCalendarEvent(
  formData: FormData
){


  const supabase =
    await createServerSupabaseClient()



  const {
    data:{
      user
    }
  } =
    await supabase.auth.getUser()



  if(!user){

    throw new Error(
      "Unauthorized"
    )

  }





  const {
    error,
  } =
    await supabase
      .from("calendar_events")
      .insert({

        title:
          formData.get(
            "title"
          ) as string,


        event_type:
          formData.get(
            "eventType"
          ) as string,


        start_time:
          formData.get(
            "startTime"
          ) as string,


        assigned_to:
          formData.get(
            "assignedTo"
          ) as string
          ||
          user.id,


        created_by:
          user.id,


        status:
          "scheduled",

      })



  if(error){

    throw error

  }


}