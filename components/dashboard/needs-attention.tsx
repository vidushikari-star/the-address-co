"use client"

import Link from "next/link"

import {
  AlertTriangle,
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
      .slice(
        0,
        5
      )





  return (

    <DashboardCard>


      <DashboardCardHeader>

        <div>

          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            Attention Required
          </p>


          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            Deals to Follow Up
          </h3>


        </div>


      </DashboardCardHeader>





      <DashboardCardContent className="space-y-4">


        {
          attentionDeals.length === 0 ? (

            <p className="text-sm text-muted-foreground">

              No deals need attention.

            </p>

          ) : (


            attentionDeals.map(

              deal => (

                <Link

                  key={
                    deal.id
                  }

                  href={
                    `/deals/${deal.id}`
                  }

                  className="block"

                >

                  <div

                    className="flex items-start gap-3 rounded-xl border p-4 hover:bg-muted/40 transition"

                  >

                    <AlertTriangle className="mt-1 h-4 w-4" />



                    <div>


                      <p className="font-medium">

                        {deal.name}

                      </p>



                      <p className="text-sm text-muted-foreground capitalize">

                        {
                          deal.stage.replace(
                            "_",
                            " "
                          )
                        }

                      </p>



                      <p className="text-xs text-muted-foreground">

                        Priority:
                        {" "}
                        {deal.priority}

                      </p>


                    </div>


                  </div>


                </Link>

              )

            )

          )

        }


      </DashboardCardContent>


    </DashboardCard>

  )

}