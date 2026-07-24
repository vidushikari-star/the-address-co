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

    <div className="space-y-8 p-8">


      <div>

        <h1 className="text-3xl font-semibold">
          Calendar
        </h1>


        <p className="text-muted-foreground">
          Tasks, site visits, activities and commissions.
        </p>

      </div>



      {
        items.length === 0 ? (

          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">

            No upcoming events.

          </div>

        ) : (

          <CalendarView
            items={items}
          />

        )
      }



    </div>

  )

}