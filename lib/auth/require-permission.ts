import {
  getCurrentUser,
} from "@/lib/auth/current-user"

import {
  isAdmin,
} from "@/lib/auth/permissions"



export async function requireAdmin(){


  const user =
    await getCurrentUser()



  if(
    !isAdmin(user)
  ){

    throw new Error(
      "Unauthorized"
    )

  }



  return user

}