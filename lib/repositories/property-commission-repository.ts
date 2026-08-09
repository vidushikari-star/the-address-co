import {
  supabase,
} from "@/lib/supabase/client"


import type {
  CommissionSourceType,
  CommissionType,
} from "@/types/property"





export interface PropertyCommission {

  id:string

  propertyId:string

  contactId?:string

  transactionType:
    | "Sale"
    | "Rental"

  sourceType:
    CommissionSourceType

  commissionType:
    CommissionType

  percentage?:number

  amount?:number

  notes?:string

  createdAt:string

  updatedAt:string

}





type PropertyCommissionRow = {

  id:string

  property_id:string

  contact_id:string | null

  transaction_type:
    | "Sale"
    | "Rental"

  source_type:
    CommissionSourceType

  commission_type:
    CommissionType

  percentage:number | null

  amount:number | null

  notes:string | null

  created_at:string

  updated_at:string

}








function mapPropertyCommission(
  row:PropertyCommissionRow
):PropertyCommission {


  return {

    id:
      row.id,


    propertyId:
      row.property_id,


    contactId:
      row.contact_id ?? undefined,


    transactionType:
      row.transaction_type,


    sourceType:
      row.source_type,


    commissionType:
      row.commission_type,


    percentage:
      row.percentage ?? undefined,


    amount:
      row.amount ?? undefined,


    notes:
      row.notes ?? undefined,


    createdAt:
      row.created_at,


    updatedAt:
      row.updated_at,

  }


}









export async function getPropertyCommissions(
  propertyId:string
):Promise<PropertyCommission[]> {


  const {
    data,
    error,
  } =
  await supabase
    .from("property_commissions")
    .select("*")
    .eq(
      "property_id",
      propertyId
    )
    .order(
      "created_at",
      {
        ascending:true,
      }
    )



  if(error){

    throw error

  }



  return (

    data ?? []

  )
  .map(
    row =>
      mapPropertyCommission(
        row as PropertyCommissionRow
      )
  )


}









export async function addPropertyCommission({

  propertyId,

  contactId,

  transactionType,

  sourceType,

  commissionType,

  percentage,

  amount,

  notes,

}:{

  propertyId:string

  contactId?:string

  transactionType:
    | "Sale"
    | "Rental"

  sourceType:
    CommissionSourceType

  commissionType:
    CommissionType

  percentage?:number

  amount?:number

  notes?:string

}):Promise<PropertyCommission>{



  const {
    data,
    error,
  } =
  await supabase
    .from("property_commissions")
    .insert({

      property_id:
        propertyId,


      contact_id:
        contactId ?? null,


      transaction_type:
        transactionType,


      source_type:
        sourceType,


      commission_type:
        commissionType,


      percentage:
        percentage ?? null,


      amount:
        amount ?? null,


      notes:
        notes ?? null,

    })
    .select()
    .single()



  if(error){

    throw error

  }



  return mapPropertyCommission(
    data as PropertyCommissionRow
  )


}









export async function updatePropertyCommission({

  id,

  percentage,

  amount,

  notes,

  contactId,

  sourceType,

}:{

  id:string

  percentage?:number | null

  amount?:number | null

  notes?:string | null

  contactId?:string

  sourceType?:CommissionSourceType

}):Promise<PropertyCommission>{


  const updates:{
    percentage?:number | null
    amount?:number | null
    notes?:string | null
    contact_id?:string
    source_type?:CommissionSourceType
  } = {}



  if(percentage !== undefined){

    updates.percentage = percentage

  }



  if(amount !== undefined){

    updates.amount = amount

  }



  if(notes !== undefined){

    updates.notes = notes

  }



  if(contactId !== undefined){

    updates.contact_id = contactId

  }



  if(sourceType !== undefined){

    updates.source_type = sourceType

  }



  const {
    data,
    error,
  } =
  await supabase
    .from("property_commissions")
    .update(updates)
    .eq(
      "id",
      id
    )
    .select()
    .single()



  if(error){

    throw error

  }



  return mapPropertyCommission(
    data as PropertyCommissionRow
  )


}









export async function deletePropertyCommission(
  id:string
){


  const {
    error,
  } =
  await supabase
    .from("property_commissions")
    .delete()
    .eq(
      "id",
      id
    )



  if(error){

    throw error

  }


}
