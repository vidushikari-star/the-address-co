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


function formatCurrency(value:number){

  return `₹${value.toLocaleString("en-IN")}`

}


function formatDate(date?:string){

  if(!date)
    return "-"

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day:"2-digit",
      month:"short",
      year:"numeric",
    }
  )

}


function Status({
  status,
}:{
  status:string
}){

  return (

    <span className="
      rounded-full
      bg-muted
      px-3
      py-1
      text-xs
      capitalize
    ">

      {status}

    </span>

  )

}



export function CommissionTable({
  commissions,
  role,
}:Props){


  const router =
    useRouter()


  const [
    pending,
    startTransition,
  ] =
  useTransition()



  const canManage =
    role === "admin"





  function action(
    commission:Commission
  ){

    if(!canManage)
      return null



    if(
      commission.status === "pending"
    ){

      return (

        <button

          disabled={pending}

          className="
            rounded-lg
            bg-primary
            px-3
            py-2
            text-xs
            text-primary-foreground
          "

          onClick={()=>{

            startTransition(
              async()=>{

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




    if(
      commission.status === "invoiced"
    ){

      return (

        <button

          disabled={pending}

          className="
            rounded-lg
            bg-primary
            px-3
            py-2
            text-xs
            text-primary-foreground
          "

          onClick={()=>{

            startTransition(
              async()=>{

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


    return (

      <span className="text-xs text-muted-foreground">
        Completed
      </span>

    )

  }





  if(commissions.length === 0){

    return (

      <div className="
        rounded-2xl
        border
        border-dashed
        p-10
        text-center
        text-muted-foreground
      ">

        No commissions found.

      </div>

    )

  }






  return (

    <>

      {/* MOBILE */}

      <div className="
        space-y-4
        md:hidden
      ">

        {
          commissions.map(
            commission => (

              <div

                key={commission.id}

                className="
                  rounded-2xl
                  border
                  bg-card
                  p-4
                  space-y-4
                "

              >

                <div className="
                  flex
                  justify-between
                  gap-3
                ">


                  <Link

                    href={`/commissions/${commission.id}`}

                    className="
                      font-semibold
                    "

                  >

                    {
                      commission.dealName ?? "-"
                    }

                  </Link>


                  <Status
                    status={commission.status}
                  />

                </div>



                <div className="
                  space-y-2
                  text-sm
                  text-muted-foreground
                ">

                  <p>
                    Type: {commission.type}
                  </p>

                  <p>
                    Advisor: {commission.advisorName ?? "Unassigned"}
                  </p>

                  <p>
                    Due: {formatDate(commission.dueDate)}
                  </p>

                </div>



                <div className="
                  flex
                  items-center
                  justify-between
                  border-t
                  pt-3
                ">

                  <span className="
                    font-semibold
                  ">

                    {formatCurrency(commission.amount)}

                  </span>


                  {action(commission)}

                </div>


              </div>

            )
          )

        }

      </div>







      {/* DESKTOP */}

      <div className="
        hidden
        overflow-hidden
        rounded-2xl
        border
        md:block
      ">


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
                    key={commission.id}
                    className="border-t"
                  >

                    <td className="p-4 font-medium">

                      <Link
                        href={`/commissions/${commission.id}`}
                      >

                        {commission.dealName ?? "-"}

                      </Link>

                    </td>


                    <td className="p-4 capitalize">
                      {commission.type}
                    </td>


                    <td className="p-4">
                      {commission.advisorName ?? "Unassigned"}
                    </td>


                    <td className="p-4 font-semibold">
                      {formatCurrency(commission.amount)}
                    </td>


                    <td className="p-4">
                      <Status status={commission.status}/>
                    </td>


                    <td className="p-4">
                      {formatDate(commission.dueDate)}
                    </td>


                    {
                      canManage && (

                        <td className="p-4">

                          {action(commission)}

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


    </>

  )

}