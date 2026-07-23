"use client"

import type {
  Deal,
} from "@/types/deal"



type Props = {
  deal: Deal
}





export function DealHealth({
  deal,
}: Props) {


  const lastActivity =
    new Date(
      deal.lastActivity
    )



  const daysSinceActivity =
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

    <div className="rounded-2xl border p-6 space-y-4">


      <h2 className="font-semibold">
        Deal Health
      </h2>



      <div className="flex justify-between">

        <span className="text-sm text-muted-foreground">
          Priority
        </span>


        <span className="capitalize font-medium">

          {deal.priority}

        </span>


      </div>





      <div className="flex justify-between">

        <span className="text-sm text-muted-foreground">
          Stage
        </span>


        <span className="capitalize font-medium">

          {
            deal.stage.replace(
              "_",
              " "
            )
          }

        </span>


      </div>





      <div className="flex justify-between">

        <span className="text-sm text-muted-foreground">
          Last Activity
        </span>


        <span className="font-medium">

          {
            daysSinceActivity === 0
              ? "Today"
              : `${daysSinceActivity} days ago`
          }

        </span>


      </div>





      {
        daysSinceActivity > 7 && (

          <div className="rounded-lg border p-3 text-sm">

            ⚠ No activity recorded for{" "}
            {daysSinceActivity} days

          </div>

        )

      }


    </div>

  )

}