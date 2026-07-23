import Link from "next/link"

import {
  CalendarDays,
  MapPin,
  Phone,
  Users,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"


type AgendaItem = {
  time: string
  title: string
  description: string
  type: "meeting" | "call" | "visit"
  contactId?: string
}


type AgendaCardProps = {
  items: AgendaItem[]
}



function TypeBadge({
  type,
}: {
  type: AgendaItem["type"]
}) {

  const label =
    type === "meeting"
      ? "Meeting"
      : type === "call"
      ? "Call"
      : "Site Visit"


  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  )

}



function EventIcon({
  type,
}: {
  type: AgendaItem["type"]
}) {

  if (type === "meeting") {
    return <Users className="h-4 w-4" />
  }


  if (type === "call") {
    return <Phone className="h-4 w-4" />
  }


  return <MapPin className="h-4 w-4" />

}



export function AgendaCard({
  items,
}: AgendaCardProps) {


  return (

    <DashboardCard className="h-full">

      <DashboardCardHeader>

        <div>

          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            Today&apos;s Agenda
          </p>


          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            {items.length} Upcoming Events
          </h3>

        </div>


        <CalendarDays className="h-5 w-5 text-muted-foreground" />

      </DashboardCardHeader>





      <DashboardCardContent className="space-y-6">


        {items.map(
          (
            item,
            index
          ) => (

            <Link

              key={`${item.time}-${item.title}`}

              href={
                item.contactId
                  ? `/contacts/${item.contactId}`
                  : "#"
              }

              className="block"

            >

              <div className="relative flex gap-5 rounded-2xl transition-colors hover:bg-muted/40 p-2">


                <div className="flex w-14 flex-col items-center">

                  <p className="text-sm font-semibold">
                    {item.time}
                  </p>


                  <div className="mt-3 h-2.5 w-2.5 rounded-full bg-primary" />


                  {index !== items.length - 1 && (
                    <div className="mt-2 h-full w-px bg-border" />
                  )}

                </div>





                <div className="flex-1 rounded-2xl border border-border/60 p-4">


                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h4 className="font-medium">
                        {item.title}
                      </h4>


                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">

                        <EventIcon type={item.type} />

                        <span>
                          {item.description}
                        </span>

                      </div>

                    </div>


                    <TypeBadge type={item.type} />

                  </div>


                </div>


              </div>


            </Link>

          )
        )}


      </DashboardCardContent>

    </DashboardCard>

  )

}