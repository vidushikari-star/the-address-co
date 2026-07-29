"use client"

import {
  CheckCircle2,
  MapPin,
  Clock,
  User,
  CalendarDays,
} from "lucide-react"

import Link from "next/link"

import type {
  CalendarItem,
} from "@/types/calendar"



type Props = {

  item: CalendarItem

  mobile?: boolean

}





function getTypeLabel(
  type:string
){

  switch(type){

    case "site_visit":
      return "Site Visit"

    case "task":
      return "Task"

    case "activity":
      return "Meeting"

    default:
      return type

  }

}








export function CalendarEvent({
  item,
  mobile = false,
}:Props){



  const isTask =
    item.type === "task"


  const isSiteVisit =
    item.type === "site_visit"







  return (

    <Link

      href={
        item.type === "activity"
          ? `/calendar/${item.id.replace("event-","")}`
          : item.url ?? "#"
      }

      className={`
        block
        rounded-xl
        border
        ${
          mobile
          ? "p-4"
          : "p-3"
        }
        space-y-2
        hover:bg-muted
        transition
      `}

    >



      <div className="
        flex
        items-center
        gap-2
        font-medium
      ">


        {
          isTask
          ?
          <CheckCircle2 className="h-4 w-4"/>
          :
          isSiteVisit
          ?
          <MapPin className="h-4 w-4"/>
          :
          <CalendarDays className="h-4 w-4"/>
        }



        <span className="truncate">

          {item.title}

        </span>


      </div>






      <div className="
        text-xs
        text-muted-foreground
        capitalize
      ">

        {
          getTypeLabel(
            item.type
          )
        }

      </div>








      {
        item.time && (

          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <Clock className="h-4 w-4"/>

            {item.time}

          </div>

        )

      }






      {
        item.contactName && (

          <div className="
            text-sm
            text-muted-foreground
          ">

            {item.contactName}

          </div>

        )

      }







      {
        item.assignedTo && (

          <div className="
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


    </Link>

  )

}