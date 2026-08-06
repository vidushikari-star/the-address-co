"use client"

import Link from "next/link"

import {
  CalendarDays,
  Clock,
  User,
  ArrowRight,
  AlertCircle,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"



type AgendaItem = {

  id?: string

  title?: string

  type?: string

  time?: string

  assignedTo?: string

  contactId?: string

  dealId?: string

  propertyId?: string

  isOverdue?: boolean

}



type Props = {

  items: AgendaItem[]

}





function getHref(
  item:AgendaItem
){

  if(
    item.dealId
  ){

    return `/deals/${item.dealId}`

  }


  if(
    item.contactId
  ){

    return `/contacts/${item.contactId}`

  }


  if(
    item.propertyId
  ){

    return `/properties/${item.propertyId}`

  }


  return null

}







export function AgendaCard({
  items,
}: Props) {


  return (

    <DashboardCard>


      <DashboardCardHeader>


        <div className="flex w-full items-start justify-between">


          <div>

            <p className="text-sm text-muted-foreground">
              Today&apos;s Agenda
            </p>


            <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
              {items.length} Upcoming Events
            </h3>


          </div>



          <CalendarDays
            className="h-5 w-5 text-muted-foreground"
          />


        </div>


      </DashboardCardHeader>






      <DashboardCardContent>


        {
          items.length === 0 ? (

            <p className="text-sm text-muted-foreground">
              No upcoming events today.
            </p>

          )

          :

          (

            <div className="space-y-4">


              {
                items.map(
                  (item,index)=>{


                    const href =
                      getHref(
                        item
                      )



                    const content = (

                      <div

                        className="
                          flex
                          gap-4
                          rounded-2xl
                          border
                          p-4
                          transition
                          hover:border-primary/30
                          hover:bg-muted/30
                        "

                      >


                        <div className="flex flex-col items-center">


                          <div
                            className={`
                              h-3
                              w-3
                              rounded-full
                              ${
                                item.isOverdue
                                ? "bg-destructive"
                                : "bg-primary"
                              }
                            `}
                          />


                          {
                            index !== items.length - 1 && (

                              <div className="
                                mt-2
                                h-full
                                w-px
                                bg-border
                              "/>

                            )
                          }


                        </div>





                        <div className="flex-1">


                          <div className="flex items-start justify-between gap-3">


                            <div>


                              <h4 className="font-medium">

                                {item.title ?? "Event"}

                              </h4>




                              <p className="
                                mt-1
                                text-sm
                                text-muted-foreground
                              ">

                                {item.type ?? "Meeting"}

                              </p>


                            </div>





                            <div className="
                              flex
                              items-center
                              gap-2
                              text-sm
                              text-muted-foreground
                            ">


                              {
                                item.isOverdue && (

                                  <AlertCircle
                                    className="
                                      h-4
                                      w-4
                                      text-destructive
                                    "
                                  />

                                )
                              }



                              <Clock className="h-4 w-4"/>

                              {item.time ?? "-"}


                            </div>


                          </div>






                          {
                            item.assignedTo && (

                              <div className="
                                mt-3
                                flex
                                items-center
                                gap-2
                                text-sm
                                text-muted-foreground
                              ">


                                <User className="h-4 w-4"/>

                                {item.assignedTo}


                              </div>

                            )
                          }





                          {
                            href && (

                              <div className="
                                mt-3
                                flex
                                justify-end
                              ">

                                <ArrowRight className="
                                  h-4
                                  w-4
                                  text-muted-foreground
                                "/>

                              </div>

                            )
                          }


                        </div>


                      </div>

                    )




                    return href ? (

                      <Link

                        key={`${item.id ?? item.title}-${index}`}

                        href={href}

                      >

                        {content}

                      </Link>


                    )

                    :


                    (

                      <div
                        key={`${item.id ?? item.title}-${index}`}
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