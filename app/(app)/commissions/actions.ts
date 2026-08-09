"use server"

import {
  redirect,
} from "next/navigation"

import {
  requireAdmin,
} from "@/lib/auth/require-permission"


import {
  markCommissionInvoiced,
  markCommissionReceived,
  editCommission,
} from "@/lib/repositories/commission-server-repository"


import type {
  Commission,
} from "@/types/commission"





export async function invoiceCommission(
  id:string
){

  await requireAdmin()

  await markCommissionInvoiced(
    id
  )


  redirect(
    "/commissions"
  )

}









export async function receiveCommission(
  id:string
){

  await requireAdmin()

  await markCommissionReceived(
    id
  )


  redirect(
    "/commissions"
  )

}









export async function updateCommissionAction(
  id:string,
  updates:Partial<Commission>
){

  await requireAdmin()

  await editCommission(
    id,
    {

      amount:
        updates.amount,


      type:
        updates.type,


      commissionBasis:
        updates.commissionBasis,


      commissionPercentage:
        updates.commissionPercentage,


      advisorId:
        updates.advisorId,


      status:
        updates.status,


      dueDate:
        updates.dueDate,


      notes:
        updates.notes,


      invoiceNumber:
        updates.invoiceNumber,


      invoiceDate:
        updates.invoiceDate,


      paymentMode:
        updates.paymentMode,


      paymentReference:
        updates.paymentReference,


      paymentDate:
        updates.paymentDate,

    }
  )


  redirect(
    "/commissions"
  )

}
