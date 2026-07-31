import {
  Home,
  FileText,
  MessageCircle,
  Clock,
} from "lucide-react"


import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"



type Activity = {

  time:string

  title:string

  description?:string

  type:
    | "client"
    | "property"
    | "document"
    | "commission"

}



type Props = {

  activities:Activity[]

}





function ActivityIcon({
  title
}:{
  title:string
}){


  if(
    title.toLowerCase().includes("whatsapp")
  ){

    return (
      <MessageCircle className="h-4 w-4" />
    )

  }



  if(
    title.toLowerCase().includes("deal")
    ||
    title.toLowerCase().includes("document")
  ){

    return (
      <FileText className="h-4 w-4" />
    )

  }



  return (
    <Home className="h-4 w-4" />
  )

}







export function ActivityFeed({
  activities,
}:Props){


  return (

    <DashboardCard>


      <DashboardCardHeader>


        <div>


          <p className="text-sm text-muted-foreground">
            Recent Activity
          </p>


          <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
            Today
          </h3>


        </div>


      </DashboardCardHeader>






      <DashboardCardContent>


        {
          activities.length === 0 ? (

            <p className="text-sm text-muted-foreground">
              No recent activity.
            </p>

          ) : (


            <div className="space-y-4">


              {
                activities
                  .slice(0,8)
                  .map(
  (activity, index) => (


                      <div

                        key={`${activity.title}-${activity.time}-${index}`}

                        className="
                          flex
                          gap-3
                          rounded-xl
                          border
                          p-3
                          sm:p-4
                        "

                      >


                        <div className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-muted
                        ">


                          <ActivityIcon
                            title={activity.title}
                          />


                        </div>






                        <div className="min-w-0 flex-1">


                          <div className="flex items-start justify-between gap-3">


                            <h4 className="truncate text-sm font-medium">

                              {activity.title}

                            </h4>





                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">

                              <Clock className="h-3 w-3"/>

                              {activity.time}

                            </span>


                          </div>






                          {
                            activity.description && (

                              <p className="mt-1 text-sm text-muted-foreground">

                                {activity.description}

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


      </DashboardCardContent>


    </DashboardCard>

  )

}