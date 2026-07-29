import Link from "next/link"

import {
  Plus,
} from "lucide-react"


import {
  getCalendarItems,
} from "@/lib/services/calendar-service"


import {
  CalendarView,
} from "@/components/calendar/calendar-view"



export const dynamic = "force-dynamic"





export default async function CalendarPage(){


  const items =
    await getCalendarItems()



  return (

    <div className="
      space-y-8
      p-4
      md:p-8
    ">



      <div className="
        flex
        items-start
        justify-between
        gap-4
      ">



        <div>

          <h1 className="
            text-2xl
            font-semibold
            md:text-3xl
          ">

            Calendar

          </h1>


          <p className="
            text-sm
            text-muted-foreground
            md:text-base
          ">

            Team events, tasks, site visits and activities.

          </p>


        </div>





        <Link

          href="/calendar/new"

          className="
            flex
            items-center
            gap-2
            rounded-xl
            bg-primary
            px-4
            py-2
            text-sm
            font-medium
            text-primary-foreground
          "

        >

          <Plus className="h-4 w-4"/>


          <span className="
            hidden
            sm:inline
          ">

            New Event

          </span>


        </Link>



      </div>







      {
        items.length === 0 ? (

          <div className="
            rounded-2xl
            border
            border-dashed
            p-10
            text-center
            text-muted-foreground
          ">

            No upcoming events.

          </div>

        ) : (

          <CalendarView

            items={
              items
            }

          />

        )

      }



    </div>

  )

}