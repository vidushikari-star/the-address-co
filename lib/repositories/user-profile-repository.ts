import {
  supabase,
} from "@/lib/supabase/client"


import type {
  UserProfile,
} from "@/types/user"





function mapUser(

  row:any

):UserProfile {


  return {

    id:
      row.id,


    name:
      row.name,


    email:
      row.email ?? undefined,


    role:
      row.role,


    createdAt:
      row.created_at,


    updatedAt:
      row.updated_at,


  }

}







export async function getAllUserProfiles()
:Promise<UserProfile[]> {


  const {
    data,
    error,
  } =
  await supabase
    .from(
      "user_profiles"
    )
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
  )
  .map(
    mapUser
  )

}