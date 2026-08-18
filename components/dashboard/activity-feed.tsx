"use client"

import Link from "next/link"

import {
  Home,
  FileText,
  MessageCircle,
  Clock,
  Phone,
  CalendarDays,
  Handshake,
  ArrowRight,
} from "lucide-react"


import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"



type Activity = {

  id?: string

  time:string

  title:string

  description?:string

  type:
    | "client"
    | "property"
    | "document"
    | "commission"


  contactId?: string

  dealId?: string

  propertyId?: string

  actorName?: string

}





type Props = {

  activities:Activity[]

}







function getHref(
  activity:Activity
){

  if(
    activity.dealId
  ){

    return `/deals/${activity.dealId}`

  }


  if(
    activity.contactId
  ){

    return `/contacts/${activity.contactId}`

  }


  if(
    activity.propertyId
  ){

    return `/properties/${activity.propertyId}`

  }


  return null

}







function ActivityIcon({
  activity,
}:{
  activity:Activity
}){


  const title =
    activity.title.toLowerCase()



  if(
    title.includes("whatsapp")
  ){

    return (
      <MessageCircle className="h-4 w-4" />
    )

  }



  if(
    title.includes("call")
    ||
    title.includes("phone")
  ){

    return (
      <Phone className="h-4 w-4" />
    )

  }





  if(
    title.includes("visit")
    ||
    title.includes("meeting")
  ){

    return (
      <CalendarDays className="h-4 w-4" />
    )

  }





  if(
    title.includes("deal")
    ||
    activity.type === "commission"
  ){

    return (
      <Handshake className="h-4 w-4" />
    )

  }





  if(
    title.includes("document")
    ||
    activity.type === "document"
  ){

    return (
      <FileText className="h-4 w-4" />
    )

  }





  if(
    activity.type === "property"
  ){

    return (
      <Home className="h-4 w-4" />
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
            Latest updates
          </h3>


        </div>

        <Link
          href="/activities"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all activity
        </Link>


      </DashboardCardHeader>






      <DashboardCardContent>


        {
          activities.length === 0 ? (

            <p className="text-sm text-muted-foreground">
              No recent activity.
            </p>

          )

          :

          (

            <div className="space-y-4">


              {
                activities
                  .slice(0,8)
                  .map(
                    (activity,index)=>{


                      const href =
                        getHref(
                          activity
                        )



                      const content = (

                        <div

                          className="
                            flex
                            gap-3
                            rounded-xl
                            border
                            p-3
                            sm:p-4
                            transition
                            hover:border-primary/30
                            hover:bg-muted/30
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
                              activity={
                                activity
                              }
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

                            <p className="mt-2 text-xs text-muted-foreground">
                              {activity.actorName ?? "System"}
                            </p>





                            {
                              href && (

                                <div className="mt-2 flex justify-end">

                                  <ArrowRight className="h-4 w-4 text-muted-foreground"/>

                                </div>

                              )
                            }




                          </div>


                        </div>

                      )




                      return href ? (

                        <Link

                          key={`${activity.id ?? activity.title}-${index}`}

                          href={href}

                        >

                          {content}

                        </Link>

                      )


                      :

                      (

                        <div
                          key={`${activity.id ?? activity.title}-${index}`}
                        >

                          {content}

                        </div>

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
