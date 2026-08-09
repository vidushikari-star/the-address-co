"use server"

import {
  syncHousingLeads,
} from "@/lib/integrations/housing/sync"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"



export async function runHousingSync(){

  const user = await getServerUserProfile()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return await syncHousingLeads()

}
