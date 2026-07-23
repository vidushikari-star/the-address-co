import {
  CircleDollarSign,
  FileText,
  Home,
  UserPlus,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"


type ActivityType =
  | "client"
  | "property"
  | "document"
  | "commission"



type Activity = {

  id?: string

  time: string

  title: string

  description: string

  type: ActivityType

}



type ActivityFeedProps = {

  activities: Activity[]

}



function ActivityIcon({
  type,
}: {
  type: ActivityType
}) {

  switch (type) {

    case "client":

      return (
        <UserPlus className="h-4 w-4" />
      )


    case "property":

      return (
        <Home className="h-4 w-4" />
      )


    case "document":

      return (
        <FileText className="h-4 w-4" />
      )


    case "commission":

      return (
        <CircleDollarSign className="h-4 w-4" />
      )

  }

}



export function ActivityFeed({
  activities,
}: ActivityFeedProps) {


  return (

    <DashboardCard className="h-full">


      <DashboardCardHeader>

        <div>

          <p className="text-sm font-medium tracking-wide text-muted-foreground">

            Recent Activity

          </p>


          <h3 className="mt-2 text-2xl font-semibold tracking-tight">

            Today

          </h3>


        </div>


      </DashboardCardHeader>




      <DashboardCardContent className="space-y-5">


        {
          activities.map(
            (
              activity,
              index
            ) => (


              <div

                key={
                  activity.id ??
                  `${activity.title}-${activity.time}-${index}`
                }

                className="flex gap-4"

              >


                <div className="flex flex-col items-center">


                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/40">

                    <ActivityIcon
                      type={
                        activity.type
                      }
                    />

                  </div>



                  {
                    index !== activities.length - 1 && (

                      <div className="mt-2 h-full w-px bg-border" />

                    )
                  }


                </div>





                <div className="flex-1 pb-6">


                  <div className="flex items-center justify-between">


                    <h4 className="font-medium">

                      {activity.title}

                    </h4>



                    <span className="text-xs text-muted-foreground">

                      {activity.time}

                    </span>


                  </div>





                  <p className="mt-1 text-sm text-muted-foreground">

                    {activity.description}

                  </p>


                </div>


              </div>


            )

          )
        }


      </DashboardCardContent>


    </DashboardCard>

  )

}