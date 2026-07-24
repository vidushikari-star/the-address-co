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
}





export function CalendarEvent({
  item,
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
        rounded-md
        border
        p-2
        text-xs
        space-y-1
        hover:bg-muted
        transition
        ${
          isTask
          ? "bg-primary/5"
          : "bg-muted/40"
        }
      `}

    >



      <div className="flex items-center gap-1 font-medium">


        {
          isTask
          ?
          <CheckCircle2 className="h-3 w-3" />
          :
          <MapPin className="h-3 w-3" />
        }


        <span className="truncate">

          {
            item.title
          }

        </span>


      </div>







      {
        item.time && (

          <div className="flex items-center gap-1 text-muted-foreground">

            <Clock className="h-3 w-3" />

            {item.time}

          </div>

        )
      }








      {
        item.assignedTo && (

          <div className="flex items-center gap-1 text-muted-foreground">

            <User className="h-3 w-3" />

            {item.assignedTo}

          </div>

        )
      }





    </Link>

  )

}