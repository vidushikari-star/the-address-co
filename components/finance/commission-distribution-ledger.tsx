"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  AddDistributionDrawer,
} from "@/components/finance/add-distribution-drawer"

import type {
  CommissionDistribution,
} from "@/types/commission-distribution"

import type {
  Commission,
} from "@/types/commission"

import {
  updateCommissionDistributionGroupStatus,
  deleteCommissionDistributionGroup,
} from "@/lib/repositories/commission-distribution-repository"





type Props = {

  distributions: CommissionDistribution[]

  commissions: Commission[]

}





function money(
  value:number
){

  return `₹${value.toLocaleString("en-IN")}`

}







export function CommissionDistributionLedger({

  distributions,

  commissions,

}:Props){


  const [
  open,
  setOpen,
] =
useState(false)


const [
  editingCommissionId,
  setEditingCommissionId,
] =
useState<string | undefined>()


const [
  editingDistributions,
  setEditingDistributions,
] =
useState<CommissionDistribution[]>([])



  const router =
    useRouter()





  const grouped =
    distributions.reduce(
      (
        groups,
        item
      ) => {


        if(
          !groups[item.commissionId]
        ){

          groups[item.commissionId] = []

        }


        groups[item.commissionId].push(
          item
        )


        return groups

      },
      {} as Record<
        string,
        CommissionDistribution[]
      >

    )





  const rows =
    Object.entries(
      grouped
    )





  async function deleteSplit(
    commissionId:string
  ){

    const confirmed =
      window.confirm(
        "Delete this commission split?"
      )


    if(!confirmed){

      return

    }


    await deleteCommissionDistributionGroup(
      commissionId
    )


    router.refresh()

  }




function editSplit(
  commissionId:string,
  items:CommissionDistribution[]
){

  setEditingCommissionId(
    commissionId
  )


  setEditingDistributions(
    items
  )


  setOpen(true)

}




  return (

    <div className="rounded-2xl border p-6 space-y-5">


      <div className="flex items-center justify-between">


        <div>

          <h2 className="text-xl font-semibold">
            Commission Distribution Ledger
          </h2>


          <p className="text-sm text-muted-foreground">
            Track internal commission splits.
          </p>


        </div>





        <button

          onClick={
  () => {

    setEditingCommissionId(
      undefined
    )

    setEditingDistributions(
      []
    )

    setOpen(true)

  }
}

          className="rounded-md bg-primary px-4 py-2 text-sm text-white"

        >

          + Record Commission Split

        </button>


      </div>









      {
        rows.length === 0 ? (

          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">

            No commission splits recorded.

          </div>

        ) : (


          <div className="rounded-xl border overflow-hidden">


            <table className="w-full text-sm">


              <thead className="bg-muted">

                <tr>

                  <th className="p-4 text-left">
                    Deal
                  </th>


                  <th className="p-4 text-left">
                    Total Commission
                  </th>


                  <th className="p-4 text-left">
                    Split
                  </th>


                  <th className="p-4 text-left">
                    Status
                  </th>


                  <th className="p-4 text-left">
                    Actions
                  </th>

                </tr>


              </thead>





              <tbody>


              {
                rows.map(
                  (
                    [
                      commissionId,
                      items
                    ]
                  ) => {


                    const commission =
                      commissions.find(
                        item =>
                          item.id === commissionId
                      )



                    const complete =
                      items.every(
                        item =>
                          item.status === "paid"
                      )





                    return (

                      <tr

                        key={
                          commissionId
                        }

                        className="border-t align-top"

                      >


                        <td className="p-4 font-medium">

                          {
                            commission?.dealName ??
                            items[0]?.dealName ??
                            "-"
                          }

                        </td>





                        <td className="p-4 font-semibold">

                          {
                            money(
                              commission?.amount ?? 0
                            )
                          }

                        </td>





                        <td className="p-4">

                          <div className="flex flex-wrap gap-2">

                            {
                              items.map(
                                item => (

                                  <span

                                    key={
                                      item.id
                                    }

                                    className="rounded-md bg-muted px-3 py-1 text-sm"

                                  >

                                    {
                                      item.userName ??
                                      "-"
                                    }

                                    {" "}

                                    {
                                      money(
                                        item.amount
                                      )
                                    }

                                  </span>

                                )
                              )
                            }

                          </div>

                        </td>





                        <td className="p-4">

                          <select

                            className="rounded-md border px-3 py-1 text-sm"

                            value={
                              complete
                                ? "complete"
                                : "pending"
                            }

                            onChange={
                              async e => {

                                await updateCommissionDistributionGroupStatus(
                                  commissionId,
                                  e.target.value === "complete"
                                    ? "paid"
                                    : "pending"
                                )

                                router.refresh()

                              }
                            }

                          >

                            <option value="pending">
                              Pending
                            </option>


                            <option value="complete">
                              Complete
                            </option>


                          </select>

                        </td>





                        <td className="p-4">

                          <div className="flex gap-2">


                            <button

  onClick={
    () =>
      editSplit(
        commissionId,
        items
      )
  }

  className="rounded-md border px-3 py-1 text-sm"

>

  Edit

</button>



                            <button

                              onClick={
                                () =>
                                  deleteSplit(
                                    commissionId
                                  )
                              }

                              className="rounded-md bg-destructive px-3 py-1 text-sm text-white"

                            >

                              Delete

                            </button>


                          </div>

                        </td>


                      </tr>

                    )

                  }

                )
              }


              </tbody>


            </table>


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

  commissions={
    commissions
  }

  editingCommissionId={
    editingCommissionId
  }

  editingDistributions={
    editingDistributions
  }

/>


    </div>

  )

}