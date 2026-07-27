import {
  CalendarDays,
  Clock,
  User,
  ArrowRight,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"



type AgendaItem = {
  title?: string
  type?: string
  time?: string
  assignedTo?: string
}


type Props = {
  items: AgendaItem[]
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
              Today's Agenda
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

          ) : (


            <>


              {/* MOBILE */}

              <div className="space-y-3 md:hidden">


                {
                  items.map(
                    (item,index)=>(


                      <div

                        key={`${item.title}-${item.time}-${index}`}

                        className="flex items-center justify-between rounded-xl border p-4"

                      >


                        <div className="flex items-center gap-3">


                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">

                            <Clock className="h-5 w-5 text-muted-foreground" />

                          </div>




                          <div>


                            <p className="font-medium">

                              {item.title ?? "Event"}

                            </p>



                            <p className="text-sm text-muted-foreground">

                              {item.time ?? "-"}

                              {
                                item.type &&
                                ` • ${item.type}`
                              }

                            </p>




                            {
                              item.assignedTo && (

                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">

                                  <User className="h-3 w-3"/>

                                  {item.assignedTo}

                                </p>

                              )
                            }


                          </div>


                        </div>





                        <ArrowRight className="h-4 w-4 text-muted-foreground"/>


                      </div>


                    )

                  )


                }


              </div>







              {/* DESKTOP */}

              <div className="hidden space-y-5 md:block">


                {
                  items.map(
                    (item,index)=>(


                      <div

                        key={`${item.title}-${item.time}-${index}`}

                        className="flex gap-4"

                      >


                        <div className="flex flex-col items-center">


                          <div className="h-3 w-3 rounded-full bg-primary"/>



                          {
                            index !== items.length - 1 && (

                              <div className="mt-2 h-full w-px bg-border"/>

                            )
                          }


                        </div>





                        <div className="flex-1 rounded-2xl border p-4">


                          <div className="flex justify-between">


                            <div>


                              <h4 className="font-medium">

                                {item.title ?? "Event"}

                              </h4>



                              <p className="mt-1 text-sm text-muted-foreground">

                                {item.type ?? "Meeting"}

                              </p>


                            </div>




                            <div className="flex items-center gap-1 text-sm text-muted-foreground">

                              <Clock className="h-4 w-4"/>

                              {item.time ?? "-"}

                            </div>


                          </div>





                          {
                            item.assignedTo && (

                              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">


                                <User className="h-4 w-4"/>

                                {item.assignedTo}


                              </div>

                            )
                          }


                        </div>


                      </div>


                    )

                  )


                }


              </div>


            </>

          )
        }


      </DashboardCardContent>


    </DashboardCard>

  )

}