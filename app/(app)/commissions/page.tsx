import {
  getCommissions,
} from "@/lib/repositories/commission-server-repository"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
  CommissionStats,
} from "@/components/finance/commission-stats"

import {
  CommissionFilters,
} from "@/components/finance/commission-filters"









export default async function CommissionsPage() {


  const user =
    await getServerUserProfile()





  const commissions =
    await getCommissions()





  const total =
    commissions.reduce(
      (
        sum,
        commission
      ) =>
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
        (
          sum,
          commission
        ) =>
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
        (
          sum,
          commission
        ) =>
          sum + commission.amount,
        0
      )








  const receivedThisMonth =
    commissions
      .filter(
        commission => {


          if(
            commission.status !== "received" ||
            !commission.paymentDate
          ){

            return false

          }



          const paymentDate =
            new Date(
              commission.paymentDate
            )


          const today =
            new Date()



          return (

            paymentDate.getMonth() ===
            today.getMonth()

            &&

            paymentDate.getFullYear() ===
            today.getFullYear()

          )

        }
      )
      .reduce(
        (
          sum,
          commission
        ) =>
          sum + commission.amount,
        0
      )









  return (

    <div className="space-y-8 p-8">





      <div>


        <h1 className="text-3xl font-semibold">

          {
            user?.role === "sales"
              ? "My Commissions"
              : "Commission Overview"
          }

        </h1>



        <p className="text-muted-foreground">

          {
            user?.role === "sales"
              ? "Track your commission earnings and payments."
              : "Track team commissions and collections."
          }

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

          Commission History

        </h2>





        <CommissionFilters

          commissions={
            commissions
          }

          role={
            user?.role
          }

        />



      </div>





    </div>

  )

}