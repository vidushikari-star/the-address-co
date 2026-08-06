"use client"

import {
  useRouter,
} from "next/navigation"


import {
  CalendarDays,
  Clock,
  User,
  Trash2,
  Pencil,
} from "lucide-react"


import {
  deleteCalendarEvent,
} from "@/lib/repositories/calendar-event-repository"


import type {
  CalendarEvent,
} from "@/types/calendar-event"





type Props = {

  event:CalendarEvent

  assignedUser?:string

  createdUser?:string

}





function formatDate(
  value:string
){

  return new Date(
    value
  )
  .toLocaleDateString(
    "en-IN",
    {
      timeZone:"Asia/Kolkata",
      day:"2-digit",
      month:"short",
      year:"numeric",
    }
  )

}





function formatTime(
  value:string
){

  return new Date(
    value
  )
  .toLocaleTimeString(
    "en-IN",
    {
      timeZone:"Asia/Kolkata",
      hour:"2-digit",
      minute:"2-digit",
      hour12:true,
    }
  )

}







export function CalendarEventDetail({
  event,
  assignedUser,
  createdUser,
}:Props){


  const router =
    useRouter()






  async function remove(){


    const confirmed =
      window.confirm(
        "Delete this event?"
      )


    if(!confirmed){

      return

    }



    await deleteCalendarEvent(
      event.id
    )


    router.push(
      "/calendar"
    )


    router.refresh()

  }







  return (

    <div className="
      space-y-6
      max-w-3xl
    ">



      <div className="
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-start
        sm:justify-between
      ">


        <div>

          <h1 className="
            text-2xl
            font-semibold
            md:text-3xl
          ">

            {event.title}

          </h1>


          <div className="
            mt-3
            inline-flex
            rounded-full
            bg-muted
            px-3
            py-1
            text-sm
            capitalize
          ">

            {event.status}

          </div>

        </div>





        <button

          onClick={() =>
            router.push(
              `/calendar/${event.id}/edit`
            )
          }

          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            px-4
            py-2
            text-sm
          "

        >

          <Pencil className="h-4 w-4"/>

          Edit Event

        </button>



      </div>







      <div className="
        grid
        gap-4
        sm:grid-cols-2
      ">


        <div className="
          rounded-2xl
          border
          p-4
        ">


          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <CalendarDays className="h-4 w-4"/>

            Date

          </div>



          <p className="
            mt-2
            font-medium
          ">

            {formatDate(
              event.startTime
            )}

          </p>


        </div>







        <div className="
          rounded-2xl
          border
          p-4
        ">


          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <Clock className="h-4 w-4"/>

            Time

          </div>



          <p className="
            mt-2
            font-medium
          ">

            {formatTime(
              event.startTime
            )}

          </p>


        </div>






        <div className="
          rounded-2xl
          border
          p-4
        ">


          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <User className="h-4 w-4"/>

            Assigned To

          </div>



          <p className="
            mt-2
            font-medium
          ">

            {
              assignedUser ??
              "Unassigned"
            }

          </p>


        </div>






        <div className="
          rounded-2xl
          border
          p-4
        ">


          <p className="
            text-sm
            text-muted-foreground
          ">

            Created By

          </p>


          <p className="
            mt-2
            font-medium
          ">

            {
              createdUser ??
              "-"
            }

          </p>


        </div>



      </div>







      {
        event.description && (

          <section className="
            rounded-2xl
            border
            p-5
          ">

            <h2 className="
              font-semibold
            ">

              Notes

            </h2>


            <p className="
              mt-2
              text-muted-foreground
            ">

              {event.description}

            </p>


          </section>

        )
      }









      <button

        onClick={remove}

        className="
          flex
          items-center
          gap-2
          rounded-xl
          border
          px-4
          py-3
          text-sm
          text-destructive
        "

      >

        <Trash2 className="h-4 w-4"/>

        Delete Event

      </button>



    </div>

  )

}