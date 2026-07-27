"use client"

import {
  Calendar,
  CircleDot,
} from "lucide-react"

import type {
  Activity,
} from "@/types/activity"



type Props = {
  activities: Activity[]
}





export function PropertyActivityTimeline({
  activities,
}: Props){


  if(!activities.length){

    return (

      <div className="
        rounded-2xl
        border
        border-dashed
        p-6
        text-center
        text-sm
        text-muted-foreground
      ">

        No activity recorded yet.

      </div>

    )

  }





  return (

    <div className="space-y-4">


      {
        activities.map(

          activity => (

            <div

              key={
                activity.id
              }

              className="
                flex
                gap-3
                sm:gap-4
              "

            >



              <div className="mt-1 shrink-0">


                <div className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  bg-primary/10
                ">


                  <CircleDot
                    className="
                      h-4
                      w-4
                      text-primary
                    "
                  />


                </div>


              </div>







              <div className="
                min-w-0
                flex-1
                rounded-xl
                border
                p-3
                sm:p-4
              ">


                <div className="
                  flex
                  flex-col
                  gap-2
                  sm:flex-row
                  sm:items-start
                  sm:justify-between
                ">


                  <p className="
                    font-medium
                    break-words
                  ">

                    {activity.title}

                  </p>





                  <div className="
                    flex
                    shrink-0
                    items-center
                    gap-1
                    text-xs
                    text-muted-foreground
                  ">


                    <Calendar className="h-3 w-3"/>



                    {
                      activity.date
                      ?
                      new Date(
                        activity.date
                      ).toLocaleDateString(
                        "en-IN"
                      )
                      :
                      "-"
                    }


                  </div>


                </div>







                {
                  activity.description && (

                    <p className="
                      mt-2
                      break-words
                      text-sm
                      text-muted-foreground
                    ">

                      {
                        activity.description
                      }

                    </p>

                  )

                }








                {
                  activity.body && (

                    <p className="
                      mt-2
                      break-words
                      text-sm
                    ">

                      {
                        activity.body
                      }

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