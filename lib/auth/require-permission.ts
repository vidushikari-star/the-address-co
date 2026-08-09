import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
  isAdmin,
} from "@/lib/auth/permissions"



export async function requireAdmin(){


  const user =
    await getServerUserProfile()



  if(
    !isAdmin(user)
  ){

    throw new Error(
      "Unauthorized"
    )

  }



  return user

}
