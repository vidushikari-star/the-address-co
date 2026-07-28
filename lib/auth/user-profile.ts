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


  try {


    const {
      data:sessionData,
    } =
      await supabase.auth.getSession()



    const user =
      sessionData.session?.user



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



    if(
      !error &&
      data
    ){

      return mapUserProfile(
        data
      )

    }





    /*
      Offline fallback
    */


    if(
      !navigator.onLine
    ){

      console.warn(
        "Offline: using cached session profile"
      )


      return {

        id:
          user.id,


        name:
          user.email?.split("@")[0] ??
          "User",


        email:
          user.email ?? undefined,


        role:
  "user" as UserProfile["role"],


        createdAt:
          new Date().toISOString(),


        updatedAt:
          new Date().toISOString(),

      } as UserProfile


    }





    console.error(
      "Failed loading user profile",
      error
    )


    return null



  }
  catch(error){


    console.warn(
      "Auth/profile unavailable offline"
    )



    return null


  }


}