import {
  CircleDollarSign,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"

import type {
  Commission,
} from "@/types/commission"



type Props = {

  commissions: Commission[]

}





export function UpcomingCommissions({

  commissions,

}:Props){



  return (

    <DashboardCard className="h-full">


      <DashboardCardHeader>

        <div>

          <p className="text-sm font-medium tracking-wide text-muted-foreground">

            Upcoming Payments

          </p>


          <h3 className="mt-2 text-2xl font-semibold tracking-tight">

            Commission Due

          </h3>

        </div>


      </DashboardCardHeader>





      <DashboardCardContent className="space-y-4">


        {
          commissions.length === 0 ? (

            <p className="text-sm text-muted-foreground">

              No upcoming commission payments.

            </p>

          ) : (


            commissions.map(

              commission => (

                <div

                  key={
                    commission.id
                  }

                  className="flex items-center justify-between rounded-xl border p-4"

                >

                  <div className="flex items-center gap-3">


                    <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted/40">

                      <CircleDollarSign className="h-4 w-4" />

                    </div>



                    <div>

                      <p className="font-medium capitalize">

                        {commission.type}

                      </p>


                      {
                        commission.dueDate && (

                          <p className="text-xs text-muted-foreground">

                            Due:

                            {" "}

                            {
                              new Date(
                                commission.dueDate
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            }

                          </p>

                        )
                      }

                    </div>


                  </div>





                  <p className="font-semibold">

                    ₹
                    {
                      commission.amount.toLocaleString(
                        "en-IN"
                      )
                    }

                  </p>


                </div>

              )

            )

          )
        }


      </DashboardCardContent>


    </DashboardCard>

  )

}