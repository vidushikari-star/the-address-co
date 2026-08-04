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
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  GitBranch,
  HandCoins,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  UserPlus,
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

  deal_stage_changed: GitBranch,

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
}:Props){



  const [
    activities,
    setActivities,
  ] =
  useState<Activity[]>([])



  const [
    loading,
    setLoading,
  ] =
  useState(true)



  const [
    showAll,
    setShowAll,
  ] =
  useState(false)







  useEffect(()=>{


    async function loadActivities(){


      try{


        const data =
          await getActivitiesByContactId(
            contact.id
          )


        setActivities(
          data
        )


      }
      finally{

        setLoading(false)

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
          )
          .getTime()

          -

          new Date(
            a.date ??
            a.createdAt
          )
          .getTime()

      )





  const visibleActivities =
    showAll
      ? sortedActivities
      : sortedActivities.slice(0,5)








  return (

    <Card className="
      rounded-2xl
    ">



      <CardHeader className="
        px-4
        py-3
      ">


        <CardTitle className="
          text-base
        ">

          Activity Timeline

        </CardTitle>


      </CardHeader>








      <CardContent className="
        px-4
        pb-5
      ">






        {
          loading ? (

            <p className="
              py-6
              text-center
              text-sm
              text-muted-foreground
            ">

              Loading activity...

            </p>

          )

          :

          sortedActivities.length === 0 ? (

            <div className="
              rounded-xl
              border
              border-dashed
              py-8
              text-center
              text-sm
              text-muted-foreground
            ">

              No activity yet.

            </div>

          )


          :

          (

            <>

              <div className="
                space-y-6
              ">


                {
                  visibleActivities.map(
                    activity => {


                      const Icon =
                        activityIcons[
                          activity.type
                        ]
                        ??
                        FileText





                      const text =
                        activity.body
                        ??
                        activity.description
                        ??
                        ""





                      return (

                        <div

                          key={
                            activity.id
                          }

                          className="
                            flex
                            gap-4
                          "

                        >


                          <div className="
                            relative
                            flex
                            shrink-0
                            flex-col
                            items-center
                          ">


                            <div className="
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-full
                              border
                              bg-background
                            ">


                              <Icon className="
                                h-4
                                w-4
                              "/>


                            </div>


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
                                font-semibold
                              ">

                                {activity.title}

                              </h4>





                              <span className="
                                text-xs
                                text-muted-foreground
                              ">

                                {
                                  new Date(
                                    activity.date ??
                                    activity.createdAt
                                  )
                                  .toLocaleDateString(
                                    "en-IN",
                                    {
                                      day:"numeric",
                                      month:"short",
                                      year:"numeric",
                                    }
                                  )
                                }

                              </span>


                            </div>






                            {
                              text && (

                                <p className="
                                  mt-2
                                  break-words
                                  rounded-lg
                                  bg-muted/40
                                  p-2
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





              {
                sortedActivities.length > 5 && (

                  <button

                    className="
                      mt-5
                      text-sm
                      font-medium
                      text-muted-foreground
                      hover:underline
                    "

                    onClick={() =>
                      setShowAll(
                        current =>
                          !current
                      )
                    }

                  >

                    {
                      showAll
                        ? "Show less"
                        : `View all ${sortedActivities.length} activities`
                    }


                  </button>

                )
              }


            </>

          )

        }



      </CardContent>


    </Card>

  )

}