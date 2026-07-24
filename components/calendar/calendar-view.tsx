"use client"

import {
  useState,
} from "react"

import {
  ChevronLeft,
  ChevronRight,
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
          item.type === "site_visit"
      )
      .reduce(

        (
          acc,
          item
        ) => {


          const key =
            new Date(
              item.date
            )
            .toISOString()
            .split("T")[0]


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





  function goToday(){

    setCurrentMonth(
      new Date()
    )

  }







  const cells =
    Array.from(
      {
        length:
          firstDay +
          daysInMonth
      }
    )







  return (

    <div className="space-y-6">


      <div className="flex items-center justify-between">


        <button

          onClick={() =>
            changeMonth(-1)
          }

          className="rounded-md border p-2"

        >

          <ChevronLeft className="h-5 w-5" />

        </button>






        <div className="flex items-center gap-4">


          <h2 className="text-2xl font-semibold capitalize">

            {monthName}

          </h2>



          <button

            onClick={goToday}

            className="rounded-md border px-3 py-1 text-sm"

          >

            Today

          </button>


        </div>






        <button

          onClick={() =>
            changeMonth(1)
          }

          className="rounded-md border p-2"

        >

          <ChevronRight className="h-5 w-5" />

        </button>


      </div>







      <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">

        {
          [
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ].map(
            day => (

              <div key={day}>
                {day}
              </div>

            )
          )
        }

      </div>








      <div className="grid grid-cols-7 gap-2">


        {
          cells.map(
            (_,index)=>{


              if(index < firstDay){

                return (

                  <div

                    key={index}

                    className="min-h-32 rounded-xl border bg-muted/20"

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



              const dateKey =
                date
                  .toISOString()
                  .split("T")[0]



              const isToday =
                today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year





              return (

                <div

                  key={index}

                  className={`
                    min-h-32
                    rounded-xl
                    border
                    p-2
                    space-y-2
                    ${
                      isToday
                      ? "ring-2 ring-primary"
                      : ""
                    }
                  `}

                >

                  <div className="text-sm font-semibold">

                    {day}

                  </div>





                  {
                    grouped[dateKey]?.map(
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

  )

}