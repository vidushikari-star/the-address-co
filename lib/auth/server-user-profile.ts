import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"

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

    role:
      row.role,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

  }

}






export async function getServerUserProfile()
: Promise<UserProfile | null> {


  const supabase =
    await createServerSupabaseClient()





  const {
    data:userData,
    error:userError,
  } =
  await supabase.auth.getUser()





  if(
    userError ||
    !userData.user
  ){

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
      userData.user.id
    )
    .single()





  if(error){

    return null

  }





  return mapUserProfile(
    data
  )

}