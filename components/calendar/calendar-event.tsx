"use client"

import {
  CheckCircle2,
  MapPin,
  Clock,
  User,
} from "lucide-react"

import Link from "next/link"

import type {
  CalendarItem,
} from "@/types/calendar"



type Props = {

  item: CalendarItem

  mobile?: boolean

}





export function CalendarEvent({
  item,
  mobile = false,
}:Props){


  const isTask =
    item.type === "task"


  const isSiteVisit =
    item.type === "site_visit"





  if(
    !isTask &&
    !isSiteVisit
  ){

    return null

  }







  return (

    <Link

      href={
        item.url ?? "#"
      }

      className={`
        block
        rounded-xl
        border
        ${
          mobile
          ? "p-4"
          : "p-2"
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
          <MapPin className="h-4 w-4"/>
        }


        <span className="truncate">

          {item.title}

        </span>


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