"use client"

import {
  CheckCircle2,
  Clock,
  User,
  Handshake,
  AlertCircle,
} from "lucide-react"

import Link from "next/link"

import type {
  TaskWithContext,
} from "@/lib/repositories/task-server-repository"





type Props = {

  task: TaskWithContext

  onComplete?:
    (
      task:TaskWithContext
    ) => void

}








function formatDate(
  date?:Date
){

  if(!date){

    return "-"

  }


  return new Date(
    date
  )
  .toLocaleDateString(
    "en-IN",
    {
      day:"2-digit",
      month:"short",
      year:"numeric",
    }
  )

}








function PriorityBadge({
  priority,
}:{
  priority:string
}){


  return (

    <span

      className={`
        rounded-full
        px-3
        py-1
        text-xs
        capitalize
        ${
          priority === "high"
          ? "bg-red-100 text-red-700"
          :
          priority === "medium"
          ? "bg-yellow-100 text-yellow-700"
          :
          "bg-green-100 text-green-700"
        }
      `}

    >

      {priority}

    </span>

  )

}








export function TaskCard({
  task,
  onComplete,
}:Props){



  return (

    <div className="
      rounded-2xl
      border
      bg-card
      p-4
      space-y-4
    ">



      <div className="
        flex
        items-start
        justify-between
        gap-3
      ">



        <div className="min-w-0">


          <h3 className="
            font-semibold
            truncate
          ">

            {task.title}

          </h3>


          {
            task.description && (

              <p className="
                mt-1
                text-sm
                text-muted-foreground
                line-clamp-2
              ">

                {task.description}

              </p>

            )
          }


        </div>





        <PriorityBadge

          priority={
            task.priority
          }

        />


      </div>








      <div className="
        grid
        gap-2
        text-sm
        text-muted-foreground
      ">




        {
          task.dueDate && (

            <div className="
              flex
              items-center
              gap-2
            ">

              <Clock className="h-4 w-4"/>

              Due:

              {" "}

              {formatDate(
                task.dueDate
              )}

            </div>

          )
        }







        {
          task.assignedTo && (

            <div className="
              flex
              items-center
              gap-2
            ">

              <User className="h-4 w-4"/>

              Assigned

            </div>

          )

        }







        {
          task.contactName && (

            <Link

              href={`/contacts/${task.contactId}`}

              className="
                flex
                items-center
                gap-2
                hover:underline
              "

            >

              <User className="h-4 w-4"/>

              {task.contactName}

            </Link>

          )

        }








        {
          task.dealName && (

            <Link

              href={`/deals/${task.dealId}`}

              className="
                flex
                items-center
                gap-2
                hover:underline
              "

            >

              <Handshake className="h-4 w-4"/>

              {task.dealName}

            </Link>

          )

        }






      </div>









      <div className="
        flex
        items-center
        justify-between
        border-t
        pt-3
      ">


        <div className="
          flex
          items-center
          gap-2
          text-xs
          text-muted-foreground
        ">


          {
            task.completed
            ?
            (
              <>
                <CheckCircle2 className="h-4 w-4"/>

                Completed
              </>
            )
            :
            (
              <>
                <AlertCircle className="h-4 w-4"/>

                Pending
              </>
            )

          }


        </div>







        {
          !task.completed && (

            <button

              onClick={() =>
                onComplete?.(
                  task
                )
              }

              className="
                rounded-xl
                bg-primary
                px-4
                py-2
                text-sm
                text-primary-foreground
              "

            >

              Complete

            </button>

          )
        }



      </div>





    </div>

  )

}