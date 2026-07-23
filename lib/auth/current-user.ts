import {
  getCurrentUserProfile,
} from "@/lib/auth/user-profile"

import type {
  UserProfile,
} from "@/types/user"



export async function getCurrentUser()
: Promise<UserProfile | null> {


  const user =
    await getCurrentUserProfile()



  return user

}