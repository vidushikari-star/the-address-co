"use client"

import type {
  Deal,
} from "@/types/deal"

import {
  calculateDealHealth,
} from "@/lib/services/deal-health-service"



type Props = {
  deal: Deal
}





export function DealHealth({
  deal,
}: Props) {


  const health =
    calculateDealHealth(
      deal
    )





  const statusConfig = {


    healthy: {

      label:
        "Healthy",

      icon:
        "🟢",

      className:
        "border-green-200 bg-green-50 text-green-700",

    },


    attention: {

      label:
        "Needs Attention",

      icon:
        "🟡",

      className:
        "border-yellow-200 bg-yellow-50 text-yellow-700",

    },


    risk: {

      label:
        "At Risk",

      icon:
        "🔴",

      className:
        "border-red-200 bg-red-50 text-red-700",

    },


  }





  const config =
    statusConfig[
      health.status
    ]





  return (

    <div className="rounded-2xl border p-6 space-y-5">


      <div className="flex items-center justify-between">


        <h2 className="font-semibold">
          Deal Health
        </h2>



        <span
          className={`
            rounded-full
            border
            px-3
            py-1
            text-sm
            font-medium
            ${config.className}
          `}
        >

          {config.icon} {config.label}

        </span>


      </div>







      <div className="flex items-end justify-between">


        <div>

          <p className="text-sm text-muted-foreground">
            Health Score
          </p>


          <p className="mt-1 text-4xl font-bold">
            {health.score}
          </p>

        </div>



        <p className="text-sm text-muted-foreground">
          / 100
        </p>


      </div>







      <div className="space-y-3">


        <p className="text-sm font-medium">
          Insights
        </p>



        {
          health.reasons.map(

            (reason,index)=>(

              <div

                key={index}

                className="rounded-lg border bg-muted/20 p-3 text-sm"

              >

                {reason}

              </div>

            )

          )

        }


      </div>


    </div>

  )

}