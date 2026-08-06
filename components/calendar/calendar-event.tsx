"use client"

import {
  CheckCircle2,
  MapPin,
  Clock,
  User,
  CalendarDays,
  Home,
  Handshake,
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

    case "commission":
      return "Commission"

    default:
      return type

  }

}







function formatIndiaTime(
  date?:string
){

  if(!date){

    return ""

  }


  return new Date(date)
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








export function CalendarEvent({
  item,
  mobile = false,
}:Props){



  const isTask =
    item.type === "task"


  const isSiteVisit =
    item.type === "site_visit"




  const displayTime =
    item.date
      ? formatIndiaTime(
          item.date
        )
      : item.time ?? ""







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
        space-y-3
        hover:bg-muted/50
        transition
      `}

    >



      {/* Title */}

      <div className="
        flex
        items-start
        gap-2
        font-medium
      ">


        {
          isTask
          ?
          <CheckCircle2 className="h-4 w-4 mt-0.5"/>
          :
          isSiteVisit
          ?
          <MapPin className="h-4 w-4 mt-0.5"/>
          :
          <CalendarDays className="h-4 w-4 mt-0.5"/>
        }



        <span className="truncate">

          {item.title}

        </span>


      </div>






      {/* Type */}

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








      {/* Time */}

      {
        displayTime && (

          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <Clock className="h-4 w-4"/>

            {displayTime}

          </div>

        )

      }








      {/* Contact */}

      {
        item.contactName && (

          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <User className="h-4 w-4"/>

            {item.contactName}

          </div>

        )

      }








      {/* Property */}

      {
        item.propertyName && (

          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <Home className="h-4 w-4"/>

            {item.propertyName}

          </div>

        )

      }








      {/* Deal */}

      {
        item.dealName && (

          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <Handshake className="h-4 w-4"/>

            {item.dealName}

          </div>

        )

      }








      {/* Assigned */}

      {
        item.assignedTo && (

          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">


            Assigned:
            <span className="font-medium">
              {item.assignedTo}
            </span>


          </div>

        )

      }


    </Link>

  )

}