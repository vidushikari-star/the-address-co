import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"

import {
  notFound,
} from "next/navigation"

import Link from "next/link"

import type {
  ReactNode,
} from "react"

import {
  formatCommissionRole,
} from "@/lib/utils/format-commission-role"





function formatCurrency(
  value:number
){

  return `₹${value.toLocaleString(
    "en-IN"
  )}`

}





function formatDate(
  date?:string
){

  if(!date){

    return "-"

  }


  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day:"2-digit",
      month:"short",
      year:"numeric",
    }
  )

}





function DetailRow(
{
  label,
  value,
}:{
  label:string
  value:ReactNode
}
){

  return (

    <div className="flex justify-between gap-4 border-b pb-3">

      <span className="text-muted-foreground">
        {label}
      </span>


      <p className="font-medium text-right">
        {value ?? "-"}
      </p>

    </div>

  )

}







export default async function CommissionDetailPage(
{
  params,
}:{
  params:Promise<{
    id:string
  }>
}
){


  const {
    id,
  } =
  await params





  const supabase =
    await createServerSupabaseClient()





  const {
    data:commission,
    error,
  } =
  await supabase
    .from("commissions")
    .select(`
      *,
      deals(
        name
      ),
      commission_distributions(
        *,
        user:user_profiles(
          name
        )
      )
    `)
    .eq(
      "id",
      id
    )
    .single()





  if(
    error ||
    !commission
  ){

    console.error(
      "COMMISSION DETAIL ERROR:",
      error
    )

    notFound()

  }







  let advisorName =
    "Unassigned"





  if(
    commission.advisor_id
  ){

    const {
      data:advisor,
    } =
    await supabase
      .from("user_profiles")
      .select(
        "name"
      )
      .eq(
        "id",
        commission.advisor_id
      )
      .single()



    advisorName =
      advisor?.name ??
      "Unassigned"

  }







  return (

    <div className="space-y-8 p-8">






      <div className="flex justify-between items-center">


        <div>


          <h1 className="text-3xl font-semibold">
            Commission Details
          </h1>


          <p className="text-muted-foreground">
            View commission, invoice and payment information.
          </p>


        </div>





        <div className="flex gap-3">


          <Link

            href="/commissions"

            className="rounded-md border px-4 py-2 text-sm"

          >

            Back

          </Link>





          <Link

            href={`/commissions/${id}/edit`}

            className="rounded-md bg-primary px-4 py-2 text-white"

          >

            Edit Commission

          </Link>


        </div>


      </div>








      <div className="grid gap-6 md:grid-cols-2">





        <div className="rounded-2xl border p-6 space-y-5">


          <h2 className="text-xl font-semibold">
            Commission Summary
          </h2>




          <DetailRow

            label="Deal"

            value={
              commission.deals?.name
            }

          />





          <DetailRow

            label="Advisor"

            value={
              advisorName
            }

          />





          <DetailRow

            label="Commission Role"

            value={
              formatCommissionRole(
                commission.commission_role
              )
            }

          />





          <DetailRow

            label="Commission Type"

            value={
              commission.commission_type
            }

          />





          <DetailRow

            label="Commission Basis"

            value={
              commission.commission_basis === "percentage"
                ? "Percentage"
                : "Fixed Amount"
            }

          />






          {
            commission.commission_basis === "percentage" && (

              <DetailRow

                label="Commission Percentage"

                value={
                  commission.commission_percentage
                    ? `${commission.commission_percentage}%`
                    : "-"
                }

              />

            )
          }






          <DetailRow

            label="Amount"

            value={
              formatCurrency(
                Number(
                  commission.amount
                )
              )
            }

          />





          <DetailRow

            label="Status"

            value={
              commission.status
            }

          />





          <DetailRow

            label="Due Date"

            value={
              formatDate(
                commission.due_date
              )
            }

          />


        </div>









        <div className="rounded-2xl border p-6 space-y-5">


          <h2 className="text-xl font-semibold">
            Invoice Details
          </h2>





          <DetailRow

            label="Invoice Number"

            value={
              commission.invoice_number
            }

          />





          <DetailRow

            label="Invoice Date"

            value={
              formatDate(
                commission.invoice_date
              )
            }

          />







          <h2 className="text-xl font-semibold pt-4">
            Payment Details
          </h2>





          <DetailRow

            label="Payment Mode"

            value={
              commission.payment_mode
            }

          />





          <DetailRow

            label="Payment Reference"

            value={
              commission.payment_reference
            }

          />





          <DetailRow

            label="Payment Date"

            value={
              formatDate(
                commission.payment_date
              )
            }

          />


        </div>


      </div>









      <div className="rounded-2xl border p-6">


        <h2 className="text-xl font-semibold mb-3">
          Notes
        </h2>


        <p className="text-muted-foreground">

          {
            commission.notes ??
            "-"
          }

        </p>


      </div>





    </div>

  )

}