"use client"

import Link from "next/link"

import {
  AlertTriangle,
  ArrowRight,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"

import type {
  Deal,
} from "@/types/deal"



type Props = {
  deals: Deal[]
}





export function NeedsAttention({
  deals,
}: Props) {


  const attentionDeals =
    deals
      .filter(
        (deal) => {

          const lastActivity =
            new Date(
              deal.lastActivity
            )


          const days =
            Math.floor(
              (
                Date.now()
                -
                lastActivity.getTime()
              )
              /
              (
                1000 *
                60 *
                60 *
                24
              )
            )


          return (
            deal.priority === "high"
            ||
            days > 7
          )

        }
      )
      .slice(0,5)





  return (

    <DashboardCard>


      <DashboardCardHeader>


        <div>


          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            Attention Required
          </p>



          <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
            Deals to Follow Up
          </h3>


        </div>


      </DashboardCardHeader>






      <DashboardCardContent>


        {
          attentionDeals.length === 0 ? (

            <p className="text-sm text-muted-foreground">
              No deals need attention.
            </p>


          ) : (


            <div className="space-y-3">


              {
                attentionDeals.map(
                  deal => {


                    const daysSinceActivity =
                      Math.floor(
                        (
                          Date.now()
                          -
                          new Date(
                            deal.lastActivity
                          ).getTime()
                        )
                        /
                        (
                          1000 *
                          60 *
                          60 *
                          24
                        )
                      )



                    return (

                      <Link

                        key={deal.id}

                        href={`/deals/${deal.id}`}

                        className="block"

                      >


                        <div

                          className="
                            flex
items-start
justify-between
gap-3
                            rounded-xl
                            border
                            p-4
                            transition
                            hover:border-primary/30
                            hover:bg-muted/40
                          "

                        >



                          <div className="flex min-w-0 items-center gap-3">


                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">


                              <AlertTriangle className="h-4 w-4" />


                            </div>





                            <div className="min-w-0">


                              <p className="truncate font-medium">

                                {deal.name}

                              </p>



                              <p className="mt-1 text-sm capitalize text-muted-foreground">

                                {
                                  deal.stage.replace(
                                    "_",
                                    " "
                                  )
                                }

                              </p>




                              <p className="mt-1 text-xs text-muted-foreground">

                                {
                                  daysSinceActivity > 0
                                  ? `No activity for ${daysSinceActivity} days`
                                  : "Active today"
                                }

                              </p>


                            </div>


                          </div>






                          <div className="flex shrink-0 items-center gap-2">


                            {
                              deal.priority === "high" && (

                                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">

                                  High

                                </span>

                              )
                            }



                            <ArrowRight className="h-4 w-4 text-muted-foreground" />


                          </div>



                        </div>


                      </Link>

                    )


                  }

                )

              }


            </div>


          )

        }


      </DashboardCardContent>


    </DashboardCard>

  )

}