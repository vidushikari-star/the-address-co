"use client"

import {
  useState,
  useTransition,
} from "react"

import {
  useRouter,
} from "next/navigation"


import {
  updateCommissionDistributionStatus,
} from "@/lib/repositories/commission-distribution-repository"


import {
  AddDistributionDrawer,
} from "@/components/finance/add-distribution-drawer"


import type {
  CommissionDistribution,
} from "@/types/commission-distribution"





type Props = {

  distributions: CommissionDistribution[]

  commissionId:string

}





function formatCurrency(
  value:number
){

  return `₹${value.toLocaleString(
    "en-IN"
  )}`

}







export function CommissionDistributionCard({

  distributions,

  commissionId,

}:Props){


  const router =
    useRouter()



  const [
    isPending,
    startTransition,
  ] =
  useTransition()



  const [
    open,
    setOpen,
  ] =
  useState(false)







  const totalDistributed =
    distributions.reduce(
      (
        sum,
        item
      ) =>
        sum + item.amount,
      0
    )








  function changeStatus(
    id:string,
    status:"pending"|"paid"
  ){


    startTransition(
      async()=>{


        await updateCommissionDistributionStatus(
          id,
          status
        )


        router.refresh()


      }
    )

  }









  return (

    <div className="rounded-2xl border p-6 space-y-5">



      <div className="flex items-center justify-between">


        <div>

          <h2 className="text-xl font-semibold">
            Commission Distribution
          </h2>


          <p className="text-sm text-muted-foreground">

            Manually recorded commission split

          </p>

        </div>




        <button

          onClick={
            () =>
              setOpen(true)
          }

          className="rounded-md bg-primary px-4 py-2 text-sm text-white"

        >

          + Add Distribution

        </button>



      </div>









      <div className="rounded-xl bg-muted p-4">

        <p className="text-sm text-muted-foreground">
          Distributed
        </p>


        <p className="text-xl font-semibold">

          {
            formatCurrency(
              totalDistributed
            )
          }

        </p>


      </div>









      {
        distributions.length === 0 ? (

          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">

            No distribution entries yet.

          </div>


        ) : (


          <div className="space-y-3">


            {
              distributions.map(
                item => (

                  <div

                    key={
                      item.id
                    }

                    className="flex items-center justify-between rounded-xl border p-4"

                  >



                    <div>


                      <p className="font-medium">

                        {
                          item.userName ??
                          "Unknown"
                        }

                      </p>



                      <p className="text-sm text-muted-foreground capitalize">

                        {
                          item.role.replace(
                            "_",
                            " "
                          )
                        }

                      </p>


                    </div>









                    <div className="text-right space-y-2">


                      <p className="font-semibold">

                        {
                          formatCurrency(
                            item.amount
                          )
                        }

                      </p>







                      <select

                        disabled={
                          isPending
                        }

                        value={
                          item.status
                        }

                        onChange={
                          e =>
                            changeStatus(
                              item.id,
                              e.target.value as "pending"|"paid"
                            )
                        }

                        className="rounded-md border px-3 py-1 text-sm"

                      >


                        <option value="pending">
                          Pending
                        </option>


                        <option value="paid">
                          Received
                        </option>


                      </select>



                    </div>



                  </div>


                )

              )

            }


          </div>


        )

      }









      <AddDistributionDrawer

        open={
          open
        }

        onOpenChange={
          setOpen
        }

        commissionId={
          commissionId
        }

      />



    </div>

  )

}