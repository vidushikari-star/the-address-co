"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  Contact,
} from "@/types/contact"

import type {
  Activity,
} from "@/types/activity"

import {
  getActivitiesByContactId,
} from "@/lib/repositories/activity-repository"

import {
  Calendar,
  FileText,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  CheckCircle2,
  ClipboardList,
  HandCoins,
  UserPlus,
  CircleDollarSign,
  GitBranch,
  XCircle,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"



const activityIcons = {

  contact_created: UserPlus,
  call: Phone,
  meeting: Calendar,
  site_visit: MapPin,
  email: Mail,
  whatsapp: MessageCircle,
  note: FileText,
  task_created: ClipboardList,
  task_completed: CheckCircle2,
  task_removed: XCircle,
  property_shared: Home,
  property_viewed: Home,
  offer_made: HandCoins,
  deal_stage_changed: HandCoins,
  lead_stage_changed: GitBranch,
  deal_closed: CheckCircle2,
  commission_received: CircleDollarSign,
  commission: CircleDollarSign,

} satisfies Record<
  Activity["type"],
  React.ElementType
>



type Props = {
  contact: Contact
}





export function RelationshipTimeline({
  contact,
}: Props) {


  const [
    activities,
    setActivities,
  ] =
  useState<Activity[]>([])





  useEffect(() => {

    async function loadActivities(){

      try {

        const data =
          await getActivitiesByContactId(
            contact.id
          )

        setActivities(data)


      } catch(error){

        console.error(
          "Failed loading activities",
          error
        )

      }

    }


    loadActivities()


  },[
    contact.id
  ])







  const sortedActivities =
    activities
      .slice()
      .sort(
        (a,b)=>
          new Date(
            b.date ??
            b.createdAt
          ).getTime()
          -
          new Date(
            a.date ??
            a.createdAt
          ).getTime()
      )
      .slice(
        0,
        20
      )







  return (

    <Card>


      <CardHeader className="
        px-4
        py-3
      ">

        <CardTitle className="text-base">
          Activity Timeline
        </CardTitle>

      </CardHeader>






      <CardContent className="
        px-4
        pb-4
      ">


        {
          sortedActivities.length === 0 ? (

            <div className="
              py-8
              text-center
              text-sm
              text-muted-foreground
            ">

              No activity yet.

            </div>


          ) : (


            <div className="space-y-5">


              {
                sortedActivities.map(

                  activity => {


                    const Icon =
                      activityIcons[
                        activity.type
                      ] ?? FileText



                    const text =
                      (
                        activity.body ??
                        activity.description ??
                        ""
                      )





                    return (

                      <div

                        key={
                          activity.id
                        }

                        className="
                          flex
                          gap-3
                        "

                      >



                        <div className="
                          mt-1
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          border
                          bg-background
                        ">


                          <Icon className="
                            h-3.5
                            w-3.5
                          "/>


                        </div>





                        <div className="
                          min-w-0
                          flex-1
                        ">


                          <div className="
                            flex
                            flex-col
                            gap-1
                            sm:flex-row
                            sm:items-start
                            sm:justify-between
                          ">


                            <h4 className="
                              break-words
                              text-sm
                              font-medium
                            ">

                              {activity.title}

                            </h4>



                            <span className="
                              shrink-0
                              text-xs
                              text-muted-foreground
                            ">

                              {
                                new Date(
                                  activity.date ??
                                  activity.createdAt
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day:"numeric",
                                    month:"short",
                                  }
                                )
                              }

                            </span>


                          </div>





                          {
                            text && (

                              <p className="
                                mt-1
                                line-clamp-2
                                break-words
                                text-xs
                                text-muted-foreground
                              ">

                                {text}

                              </p>

                            )
                          }


                        </div>


                      </div>

                    )


                  }

                )

              }


            </div>


          )

        }


      </CardContent>


    </Card>

  )

}