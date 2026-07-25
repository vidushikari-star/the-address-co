import {
  redirect,
} from "next/navigation"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"



export async function requireAdmin(){


  const user =
    await getServerUserProfile()



  if(
    !user ||
    user.role !== "admin"
  ){

    redirect(
      "/dashboard"
    )

  }


  return user

}