"use client"

import type {
  Commission,
} from "@/types/commission"

import {
  invoiceCommission,
  receiveCommission,
} from "@/app/(app)/commissions/actions"

import {
  useTransition,
} from "react"

import {
  useRouter,
} from "next/navigation"

import Link from "next/link"


type Props = {
  commissions: Commission[]
  role?: string
}









function formatCurrency(
  value:number
) {

  return `₹${value.toLocaleString(
    "en-IN"
  )}`

}









function formatDate(
  date?:string
) {

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









export function CommissionTable({
  commissions,
  role,
}:Props) {


  const router =
    useRouter()



  const [
    isPending,
    startTransition,
  ] =
  useTransition()





  const canManage =
    role === "admin"









  if(
    commissions.length === 0
  ){

    return (

      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">

        No commissions found.

      </div>

    )

  }









  return (

    <div className="rounded-2xl border overflow-hidden">


      <table className="w-full text-sm">


        <thead className="bg-muted">


          <tr>


            <th className="p-4 text-left">
              Deal
            </th>


            <th className="p-4 text-left">
              Type
            </th>


            <th className="p-4 text-left">
              Advisor
            </th>


            <th className="p-4 text-left">
              Amount
            </th>


            <th className="p-4 text-left">
              Status
            </th>


            <th className="p-4 text-left">
              Due Date
            </th>


            {
              canManage && (

                <th className="p-4 text-left">
                  Actions
                </th>

              )
            }


          </tr>


        </thead>









        <tbody>


        {
          commissions.map(
            commission => (

              <tr

                key={
                  commission.id
                }

                className="border-t"

              >





                <td className="p-4 font-medium">


                  <Link

                    href={`/commissions/${commission.id}`}

                    className="hover:underline"

                  >

                    {
                      commission.dealName ??
                      "-"
                    }

                  </Link>


                </td>









                <td className="p-4 capitalize">

                  {
                    commission.type
                  }

                </td>









                <td className="p-4">

                  {
                    commission.advisorName ??
                    "Unassigned"
                  }

                </td>









                <td className="p-4 font-semibold">

                  {
                    formatCurrency(
                      commission.amount
                    )
                  }

                </td>









                <td className="p-4 capitalize">

                  {
                    commission.status
                  }

                </td>









                <td className="p-4">

                  {
                    formatDate(
                      commission.dueDate
                    )
                  }

                </td>









                {
                  canManage && (

                    <td className="p-4">


                      <div className="flex gap-2">


                        {
                          commission.status === "pending" && (

                            <button

                              disabled={
                                isPending
                              }

                              className="rounded-md bg-primary px-3 py-1 text-xs text-white"

                              onClick={() => {

                                startTransition(
                                  async () => {

                                    await invoiceCommission(
                                      commission.id
                                    )

                                    router.refresh()

                                  }
                                )

                              }}

                            >

                              Mark Invoiced

                            </button>

                          )
                        }









                        {
                          commission.status === "invoiced" && (

                            <button

                              disabled={
                                isPending
                              }

                              className="rounded-md bg-primary px-3 py-1 text-xs text-white"

                              onClick={() => {

                                startTransition(
                                  async () => {

                                    await receiveCommission(
                                      commission.id
                                    )

                                    router.refresh()

                                  }
                                )

                              }}

                            >

                              Mark Received

                            </button>

                          )
                        }









                        {
                          commission.status === "received" && (

                            <span className="text-xs text-muted-foreground">

                              Completed

                            </span>

                          )
                        }


                      </div>


                    </td>

                  )
                }





              </tr>

            )
          )
        }


        </tbody>


      </table>


    </div>

  )

}