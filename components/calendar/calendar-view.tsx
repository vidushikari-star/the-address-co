"use client"

import {
  useState,
} from "react"

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react"

import {
  CalendarEvent,
} from "./calendar-event"

import type {
  CalendarItem,
} from "@/types/calendar"



type Props = {
  items: CalendarItem[]
}





function formatDateKey(
  date: Date
){

  return (
    `${date.getFullYear()}-${
      String(date.getMonth() + 1)
        .padStart(2,"0")
    }-${
      String(date.getDate())
        .padStart(2,"0")
    }`
  )

}





export function CalendarView({
  items,
}: Props){


  const [
    currentMonth,
    setCurrentMonth,
  ] =
  useState(
    new Date()
  )



  const today =
    new Date()



  const year =
    currentMonth.getFullYear()


  const month =
    currentMonth.getMonth()



  const monthName =
    currentMonth.toLocaleDateString(
      "en-IN",
      {
        month:"long",
        year:"numeric",
      }
    )





  const grouped =
    items
      .filter(
        item =>
          item.type === "task" ||
          item.type === "site_visit" ||
          item.type === "activity"
      )
      .reduce(

        (
          acc,
          item
        ) => {


          const eventDate =
            new Date(
              item.date
            )


          const key =
            formatDateKey(
              eventDate
            )


          if(!acc[key]){

            acc[key] = []

          }


          acc[key].push(
            item
          )


          return acc


        },

        {} as Record<string, CalendarItem[]>

      )







  const upcoming =
    items
      .filter(
        item =>
          new Date(item.date) >= today
      )
      .slice(
        0,
        10
      )







  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay()



  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate()



  const cells =
    Array.from(
      {
        length:
          firstDay +
          daysInMonth
      }
    )






  function changeMonth(
    amount:number
  ){

    setCurrentMonth(
      new Date(
        year,
        month + amount,
        1
      )
    )

  }






  return (

    <div className="space-y-8">





      {/* MOBILE UPCOMING VIEW */}

      <div className="
        space-y-4
        md:hidden
      ">


        <div className="
          flex
          items-center
          gap-2
        ">

          <CalendarDays className="h-5 w-5"/>

          <h2 className="
            text-lg
            font-semibold
          ">

            Upcoming

          </h2>

        </div>



        {
          upcoming.length === 0 ? (

            <div className="
              rounded-xl
              border
              p-6
              text-center
              text-muted-foreground
            ">

              No upcoming events.

            </div>

          ) : (

            <div className="space-y-3">

              {
                upcoming.map(
                  item => (

                    <CalendarEvent
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                      mobile
                    />

                  )
                )

              }

            </div>

          )

        }


      </div>









      {/* DESKTOP MONTH VIEW */}

      <div className="
        hidden
        space-y-6
        md:block
      ">



        <div className="
          flex
          items-center
          justify-between
        ">


          <button

            onClick={() =>
              changeMonth(-1)
            }

            className="
              rounded-lg
              border
              p-2
            "

          >

            <ChevronLeft />

          </button>




          <h2 className="
            text-2xl
            font-semibold
            capitalize
          ">

            {monthName}

          </h2>




          <button

            onClick={() =>
              changeMonth(1)
            }

            className="
              rounded-lg
              border
              p-2
            "

          >

            <ChevronRight />

          </button>


        </div>






        <div className="
          grid
          grid-cols-7
          gap-2
          text-center
          text-sm
          text-muted-foreground
        ">

          {
            [
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ]
            .map(
              day => (

                <div key={day}>
                  {day}
                </div>

              )
            )

          }

        </div>







        <div className="
          grid
          grid-cols-7
          gap-2
        ">


          {
            cells.map(
              (_,index)=>{


                if(
                  index < firstDay
                ){

                  return (

                    <div
                      key={index}
                      className="
                        min-h-32
                        rounded-xl
                        border
                        bg-muted/20
                      "
                    />

                  )

                }




                const day =
                  index -
                  firstDay +
                  1




                const date =
                  new Date(
                    year,
                    month,
                    day
                  )



                const key =
                  formatDateKey(
                    date
                  )



                return (

                  <div

                    key={index}

                    className="
                      min-h-32
                      rounded-xl
                      border
                      p-2
                      space-y-2
                    "

                  >

                    <div className="
                      text-sm
                      font-semibold
                    ">

                      {day}

                    </div>



                    {
                      grouped[key]?.map(
                        item => (

                          <CalendarEvent
                            key={
                              item.id
                            }
                            item={
                              item
                            }
                          />

                        )
                      )
                    }


                  </div>

                )

              }

            )

          }


        </div>


      </div>


    </div>

  )

}