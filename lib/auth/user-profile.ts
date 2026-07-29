import {
  supabase,
} from "@/lib/supabase/client"

import type {
  UserProfile,
} from "@/types/user"





type UserProfileRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  role: UserProfile["role"]
  created_at: string
  updated_at: string
}

function mapUserProfile(
  row: UserProfileRow
): UserProfile {

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
  data as UserProfileRow
)

}