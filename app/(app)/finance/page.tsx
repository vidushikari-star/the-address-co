import {
  redirect,
} from "next/navigation"

import {
  getCurrentUser,
} from "@/lib/auth/current-user"

import {
  getCommissions,
} from "@/lib/repositories/commission-repository"

import {
  CommissionStats,
} from "@/components/finance/commission-stats"

import {
  CommissionTable,
} from "@/components/finance/commission-table"



export default async function FinancePage() {


  const user =
    await getCurrentUser()



  if(
    !user ||
    user.role !== "admin"
  ){

    redirect(
      "/dashboard"
    )

  }





  const commissions =
    await getCommissions()





  const total =
    commissions.reduce(
      (sum, commission) =>
        sum + commission.amount,
      0
    )





  const pending =
    commissions
      .filter(
        commission =>
          commission.status === "pending" ||
          commission.status === "invoiced"
      )
      .reduce(
        (sum, commission) =>
          sum + commission.amount,
        0
      )





  const received =
    commissions
      .filter(
        commission =>
          commission.status === "received"
      )
      .reduce(
        (sum, commission) =>
          sum + commission.amount,
        0
      )





  const now =
    new Date()



  const receivedThisMonth =
    commissions
      .filter(
        commission =>
          commission.status === "received" &&
          commission.receivedDate &&
          new Date(
            commission.receivedDate
          ).getMonth()
          ===
          now.getMonth()
          &&
          new Date(
            commission.receivedDate
          ).getFullYear()
          ===
          now.getFullYear()
      )
      .reduce(
        (sum, commission) =>
          sum + commission.amount,
        0
      )







  return (

    <div className="space-y-8 p-8">


      <div>

        <h1 className="text-3xl font-semibold">
          Finance
        </h1>


        <p className="text-muted-foreground">
          Track commissions and collections.
        </p>


      </div>





      <CommissionStats

        total={
          total
        }

        pending={
          pending
        }

        received={
          received
        }

        receivedThisMonth={
          receivedThisMonth
        }

      />





      <div>


        <h2 className="mb-4 text-xl font-semibold">
          Commission Ledger
        </h2>


        <CommissionTable

          commissions={
            commissions
          }

        />


      </div>


    </div>

  )

}