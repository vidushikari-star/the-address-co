import {
  redirect,
} from "next/navigation"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
  getCommissions,
} from "@/lib/repositories/commission-repository"

import {
  CommissionStats,
} from "@/components/finance/commission-stats"

import {
  CommissionTable,
} from "@/components/finance/commission-table"

import {
  getExpenses,
} from "@/lib/repositories/expense-repository"

import {
  ExpenseSection,
} from "@/components/finance/expense-section"

import {
  FinanceSummary,
} from "@/components/finance/finance-summary"

import {
  getAllCommissionDistributions,
} from "@/lib/repositories/commission-distribution-repository"


import {
  CommissionDistributionLedger,
} from "@/components/finance/commission-distribution-ledger"





export default async function FinancePage() {


  const user =
  await getServerUserProfile()

console.log(
  "FINANCE SERVER USER",
  user
)


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



  const expenses =
    await getExpenses()

    const distributions =
  await getAllCommissionDistributions()









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







  const totalExpenses =
    expenses.reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    )





  const netCash =
    received -
    totalExpenses







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
          Track commissions, collections and expenses.
        </p>

      </div>









      <FinanceSummary

        totalCommission={
          total
        }

        receivedCommission={
          received
        }

        pendingCommission={
          pending
        }

        totalExpenses={
          totalExpenses
        }

        netCash={
          netCash
        }

      />









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









      <ExpenseSection

 expenses={
  expenses
 }

/>

<div>

  <h2 className="mb-4 text-xl font-semibold">
    Commission Distribution Ledger
  </h2>


  <CommissionDistributionLedger

  distributions={
    distributions
  }

  commissions={
    commissions
  }

/>

</div>



    </div>

  )

}


