"use client"

import {
  Calendar,
  CircleDot,
} from "lucide-react"

import type {
  Activity,
} from "@/types/activity"

import {
  formatIndiaDateTime,
} from "@/lib/utils/india-date"



type Props = {
  activities: Activity[]
}



export function DealActivityTimeline({
  activities,
}: Props) {


  if (!activities.length) {

    return (

      <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">

        No activity recorded yet.

      </div>

    )

  }



  return (

    <div className="space-y-5">

      {
        activities.map(
          (activity) => (

            <div

              key={activity.id}

              className="flex gap-4"

            >

              <div className="mt-1">

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">

                  <CircleDot className="h-4 w-4 text-primary" />

                </div>

              </div>



              <div className="flex-1 rounded-xl border p-4">

                <div className="flex items-center justify-between">

                  <p className="font-medium">

                    {activity.title}

                  </p>


                  <div className="flex items-center gap-1 text-xs text-muted-foreground">

                    <Calendar className="h-3 w-3" />

                    {activity.date ? formatIndiaDateTime(activity.date) : "-"}

                  </div>

                </div>


                <p className="mt-2 text-xs text-muted-foreground">
                  {activity.actorName ?? (activity.createdBy ? "Unknown user" : "System")}
                </p>



                {
                  activity.description && (

                    <p className="mt-2 text-sm text-muted-foreground">

                      {activity.description}

                    </p>

                  )
                }



                {
                  activity.body && (

                    <p className="mt-2 text-sm">

                      {activity.body}

                    </p>

                  )
                }


              </div>

            </div>

          )
        )
      }

    </div>

  )

}
