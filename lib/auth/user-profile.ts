import {
  supabase,
} from "@/lib/supabase/client"

import type {
  UserProfile,
} from "@/types/user"





function mapUserProfile(
  row:any
):UserProfile {

  return {

    id:
      row.id,

    name:
      row.name,

    email:
      row.email ?? undefined,


    phone:
      row.phone ?? undefined,


    whatsapp:
      row.whatsapp ?? undefined,


    role:
      row.role,


    createdAt:
      row.created_at,


    updatedAt:
      row.updated_at,

  }

}






export async function getCurrentUserProfile()
: Promise<UserProfile | null> {


  const {
    data:userData,
  } =
    await supabase.auth.getUser()



  const user =
    userData.user



  if(!user){

    return null

  }





  const {
    data,
    error,
  } =
    await supabase
      .from("user_profiles")
      .select("*")
      .eq(
        "id",
        user.id
      )
      .single()



  if(error){

    console.error(
      "Failed loading user profile",
      error
    )

    return null

  }





  return mapUserProfile(
    data
  )

}