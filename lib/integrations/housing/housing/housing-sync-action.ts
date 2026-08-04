"use server"

import {
  syncHousingLeads,
} from "@/lib/integrations/housing/sync"



export async function runHousingSync(){

  return await syncHousingLeads()

}