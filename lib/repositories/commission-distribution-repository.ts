import {
  supabase,
} from "@/lib/supabase/client"


import type {
  CommissionDistribution,
} from "@/types/commission-distribution"





function mapRow(
  row:any
):CommissionDistribution {


  return {

    id:
      row.id,


    commissionId:
      row.commission_id,


    userId:
      row.user_id,


    userName:
      row.user?.name,


    role:
      row.role,


    percentage:
      row.percentage
        ? Number(row.percentage)
        : undefined,


    amount:
      Number(
        row.amount ?? 0
      ),


    status:
      row.status,


    paidDate:
      row.paid_date
        ?? undefined,


    notes:
      row.notes
        ?? undefined,


    createdAt:
      row.created_at,


    dealName:
      row.commissions?.deals?.name
        ?? undefined,


    commissionAmount:
      Number(
        row.commissions?.amount ?? 0
      ),

  }

}









export async function getCommissionDistributions(
  commissionId:string
)
:Promise<CommissionDistribution[]> {


  const {
    data,
    error,
  } =
  await supabase
    .from(
      "commission_distributions"
    )
    .select(`
      *,
      user:user_profiles(
        name
      )
    `)
    .eq(
      "commission_id",
      commissionId
    )


  if(error){

    throw error

  }


  return (
    data ?? []
  )
  .map(
    mapRow
  )

}









export async function createCommissionDistribution(
  distribution:Partial<CommissionDistribution>
){


  const {
    data,
    error,
  }
  =
  await supabase
    .from(
      "commission_distributions"
    )
    .insert({

      commission_id:
        distribution.commissionId,


      user_id:
        distribution.userId,


      role:
        distribution.role,


      percentage:
        distribution.percentage
          ?? null,


      amount:
        distribution.amount
          ?? 0,


      status:
        distribution.status
          ?? "pending",


      notes:
        distribution.notes
          ?? null,

    })
    .select()
    .single()



  if(error){

    throw error

  }


  return mapRow(data)

}









export async function updateCommissionDistributionStatus(
  id:string,
  status:"pending" | "paid"
){


  const {
    data,
    error,
  } =
  await supabase
    .from(
      "commission_distributions"
    )
    .update({

      status,


      paid_date:
        status === "paid"
          ? new Date().toISOString()
          : null,

    })
    .eq(
      "id",
      id
    )
    .select()
    .single()



  if(error){

    throw error

  }


  return data

}









export async function getPaidDistributionAmount(
  commissionIds:string[]
)
:Promise<number>{


  if(
    commissionIds.length === 0
  ){

    return 0

  }



  const {
    data,
    error,
  } =
  await supabase
    .from(
      "commission_distributions"
    )
    .select(
      "amount,status"
    )
    .in(
      "commission_id",
      commissionIds
    )



  if(error){

    throw error

  }



  return (
    data ?? []
  )
  .filter(
    item =>
      item.status === "paid"
  )
  .reduce(
    (
      sum,
      item
    ) =>
      sum + Number(item.amount),
    0
  )

}









export async function getAllCommissionDistributions()
:Promise<CommissionDistribution[]> {


  const {
    data,
    error,
  } =
  await supabase
    .from(
      "commission_distributions"
    )
    .select(`
      *,
      user:user_profiles(
        name
      ),
      commissions(
        amount,
        deals(
          name
        )
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
  )
  .map(
    mapRow
  )

}

export async function deleteCommissionDistributionGroup(
  commissionId:string
){

  const {
    error,
  } =
  await supabase
    .from(
      "commission_distributions"
    )
    .delete()
    .eq(
      "commission_id",
      commissionId
    )


  if(error){

    throw error

  }

}

export async function updateCommissionDistributionGroupStatus(
  commissionId:string,
  status:"pending"|"paid"
){

  const {
    error,
  } =
  await supabase
    .from(
      "commission_distributions"
    )
    .update({
      status,
      paid_date:
        status === "paid"
          ? new Date().toISOString()
          : null,
    })
    .eq(
      "commission_id",
      commissionId
    )


  if(error){
    throw error
  }

}