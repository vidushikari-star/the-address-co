import { supabase } from "@/lib/supabase/client"

import { mapDealRow } from "@/lib/mappers/deal.mapper"

import type {
  Deal,
} from "@/types/deal"


type DealUpdate = Partial<
  Deal & {
    closedAt: string | null
    closingPrice: number | null
    finalCommission: number | null
    lostReason: string | null
    lostNotes: string | null
  }
>


export async function getDeals(): Promise<Deal[]> {

  const {
    data,
    error,
  } =
    await supabase
      .from("deals")
      .select(`
        *,
        advisor:user_profiles (
          name
        )
      `)
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
  ).map(
    mapDealRow
  )

}






export async function getDealById(
  id:string
):Promise<Deal | undefined>{


  const {
    data,
    error,
  } =
    await supabase
      .from("deals")
      .select(`
        *,
        advisor:user_profiles (
          name
        )
      `)
      .eq(
        "id",
        id
      )
      .single()



  if(error){

    if(
      error.code === "PGRST116"
    ){

      return undefined

    }


    throw error

  }



  return mapDealRow(data)

}







export async function getDealsByContactId(
  contactId:string
):Promise<Deal[]>{


  const {
    data,
    error,
  } =
    await supabase
      .from("deals")
      .select(`
        *,
        advisor:user_profiles (
          name
        )
      `)
      .eq(
        "contact_id",
        contactId
      )



  if(error){

    throw error

  }



  return (
    data ?? []
  ).map(
    mapDealRow
  )

}







export async function getDealsByPropertyId(
  propertyId:string
):Promise<Deal[]>{


  const {
    data,
    error,
  } =
    await supabase
      .from("deals")
      .select(`
        *,
        advisor:user_profiles (
          name
        )
      `)
      .eq(
        "property_id",
        propertyId
      )



  if(error){

    throw error

  }



  return (
    data ?? []
  ).map(
    mapDealRow
  )

}








export async function createDeal(
  deal:Partial<Deal>
):Promise<Deal>{


  const {
    data,
    error,
  } =
    await supabase
      .from("deals")
      .insert({

        name:
          deal.name ??
          "Untitled Deal",


        contact_id:
          deal.contactId,


        property_id:
          deal.propertyId,

          housing_lead_id:
  deal.housingLeadId ?? null,


        stage:
          deal.stage ??
          "lead",


        probability:
          deal.probability ??
          10,


        advisor_id:
          deal.advisorId ??
          null,


        expected_close_date:
          deal.expectedCloseDate ??
          null,



        property_price:
          deal.value?.propertyPrice ??
          0,



        commission_percentage:
          deal.value?.commissionPercentage ??
          null,



        commission_amount:
          deal.value?.commissionAmount ??
          0,



        notes:
          deal.notes?.join("\n") ??
          null,


        priority:
          deal.priority ??
          "medium",


        tasks:
          deal.tasks ??
          [],


        last_activity:
          deal.lastActivity ??
          new Date().toISOString(),

      })
      .select()
      .single()



  if(error){

    throw error

  }



  return mapDealRow(data)

}









export async function updateDeal(
  id:string,
  updates:DealUpdate
):Promise<Deal>{


  const payload:Record<string,unknown> = {}



  if(updates.name !== undefined){

    payload.name =
      updates.name

  }



  if(updates.stage !== undefined){

    payload.stage =
      updates.stage

  }



  if(updates.probability !== undefined){

    payload.probability =
      updates.probability

  }



  if(updates.advisorId !== undefined){

    payload.advisor_id =
      updates.advisorId

  }



  if(
    updates.expectedCloseDate !== undefined
  ){

    payload.expected_close_date =
      updates.expectedCloseDate

  }



  if(
    updates.value?.propertyPrice !== undefined
  ){

    payload.property_price =
      updates.value.propertyPrice

  }



  if(
    updates.value?.commissionAmount !== undefined
  ){

    payload.commission_amount =
      updates.value.commissionAmount

  }



  if(
    updates.value?.commissionPercentage !== undefined
  ){

    payload.commission_percentage =
      updates.value.commissionPercentage

  }



  if(updates.notes !== undefined){

    payload.notes =
      updates.notes.join("\n")

  }



  if(updates.priority !== undefined){

    payload.priority =
      updates.priority

  }



  if(updates.tasks !== undefined){

    payload.tasks =
      updates.tasks

  }



  if(updates.closedAt !== undefined){

    payload.closed_at =
      updates.closedAt

  }



  if(updates.closingPrice !== undefined){

    payload.closing_price =
      updates.closingPrice

  }



  if(updates.finalCommission !== undefined){

    payload.final_commission =
      updates.finalCommission

  }



  if(updates.lostReason !== undefined){

    payload.lost_reason =
      updates.lostReason

  }



  if(updates.lostNotes !== undefined){

    payload.lost_notes =
      updates.lostNotes

  }



  payload.updated_at =
    new Date().toISOString()





  const {
    data,
    error,
  } =
    await supabase
      .from("deals")
      .update(payload)
      .eq(
        "id",
        id
      )
      .select(`
        *,
        advisor:user_profiles (
          name
        )
      `)
      .single()



  if(error){

    throw error

  }



  return mapDealRow(data)

}

export async function attachPropertyToDeal(
  dealId:string,
  propertyId:string
){

  const {
    data,
    error,
  } =
  await supabase
    .from("deals")
    .update({

      property_id:
        propertyId,

    })
    .eq(
      "id",
      dealId
    )
    .select()
    .single()



  if(error){

    throw error

  }



  return data

}