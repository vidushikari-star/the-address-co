import {
  CalendarDays,
  Clock,
  User,
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

        <div className="flex items-start justify-between w-full">

          <div>

            <p className="text-sm text-muted-foreground">
              Today's Agenda
            </p>

            <h3 className="mt-2 text-2xl font-semibold">
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

            <div className="space-y-5">

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
                          index !== items.length-1 &&
                          <div className="mt-2 h-full w-px bg-border"/>
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


                          <div className="text-sm text-muted-foreground flex items-center gap-1">

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

          )
        }


      </DashboardCardContent>

    </DashboardCard>

  )
}