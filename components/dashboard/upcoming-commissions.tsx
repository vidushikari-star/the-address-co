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
}: Props){


  const total =
    commissions.reduce(
      (sum, commission) =>
        sum + commission.amount,
      0
    )




  return (

    <DashboardCard className="h-full">


      <DashboardCardHeader>


        <div>


          <p className="
            text-sm
            font-medium
            tracking-wide
            text-muted-foreground
          ">

            Revenue Forecast

          </p>




          <h3 className="
            mt-2
            text-xl
            font-semibold
            tracking-tight
            sm:text-2xl
          ">

            Upcoming Commissions

          </h3>





          {
            commissions.length > 0 && (

              <p className="
                mt-2
                text-sm
                text-muted-foreground
              ">

                Expected:

                {" "}

                <span className="
                  font-semibold
                  text-foreground
                ">

                  ₹{total.toLocaleString("en-IN")}

                </span>


              </p>

            )
          }


        </div>


      </DashboardCardHeader>







      <DashboardCardContent className="
        space-y-3
      ">



        {
          commissions.length === 0

          ?

          (

            <p className="
              text-sm
              text-muted-foreground
            ">

              No upcoming commission payments.

            </p>

          )


          :

          commissions.map(
            commission => (

              <div

                key={
                  commission.id
                }

                className="
                  flex
                  items-start
                  justify-between
                  gap-3
                  rounded-xl
                  border
                  p-4
                "

              >



                <div className="
                  flex
                  min-w-0
                  items-center
                  gap-3
                ">


                  <div className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-muted
                  ">


                    <CircleDollarSign className="
                      h-5
                      w-5
                    "/>


                  </div>






                  <div className="
                    min-w-0
                  ">


                    <p className="
                      truncate
                      font-medium
                    ">

                      {
                        commission.dealName
                        ??
                        "Unnamed Deal"
                      }

                    </p>





                    <p className="
                      text-sm
                      capitalize
                      text-muted-foreground
                    ">

                      {
                        commission.type
                      }

                      {" "}
                      commission

                    </p>





                    {
                      commission.dueDate && (

                        <p className="
                          mt-1
                          text-xs
                          text-muted-foreground
                        ">

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







                <p className="
                  shrink-0
                  text-right
                  text-sm
                  font-semibold
                  sm:text-base
                ">

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


        }


      </DashboardCardContent>


    </DashboardCard>

  )

}