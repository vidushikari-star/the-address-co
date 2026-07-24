"use client"

import {
  CheckCircle2,
  Clock,
  User,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import type {
  TaskWithContext,
} from "@/lib/repositories/task-server-repository"



type Props = {

  task: TaskWithContext

  onComplete?: (
    task: TaskWithContext
  ) => void

}





function getTaskStatus(
  task: TaskWithContext
){

  if(
    task.completed ||
    !task.dueDate
  ){

    return null

  }


  const today =
    new Date()


  today.setHours(
    0,
    0,
    0,
    0
  )


  const due =
    new Date(
      task.dueDate
    )


  due.setHours(
    0,
    0,
    0,
    0
  )



  if(
    due < today
  ){

    return "overdue"

  }



  if(
    due.getTime() ===
    today.getTime()
  ){

    return "today"

  }



  return null

}







export function TaskCard({
  task,
  onComplete,
}: Props) {


  const status =
    getTaskStatus(
      task
    )



  return (

    <div className="rounded-2xl border p-5 flex items-start justify-between gap-4">


      <div className="space-y-2 flex-1">





        {
          status === "overdue" && (

            <Badge variant="destructive">

              Overdue

            </Badge>

          )
        }




        {
          status === "today" && (

            <Badge variant="secondary">

              Due Today

            </Badge>

          )
        }







        <h3 className="font-semibold">

          {task.title}

        </h3>





        {
          task.description && (

            <p className="text-sm text-muted-foreground">

              {task.description}

            </p>

          )
        }






        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">


          {
            task.dueDate && (

              <span className="flex items-center gap-1">


                <Clock className="h-4 w-4" />


                {
                  task.dueDate.toLocaleDateString(
                    "en-IN",
                    {
                      day:"2-digit",
                      month:"short",
                      year:"numeric",
                    }
                  )
                }


              </span>

            )
          }






          {
            task.assignedTo && (

              <span className="flex items-center gap-1">


                <User className="h-4 w-4" />


                {task.assignedTo}


              </span>

            )
          }


        </div>







        {
          (
            task.contactName ||
            task.propertyName ||
            task.dealName
          ) && (

            <div className="mt-3 space-y-1 text-sm text-muted-foreground">


              {
                task.contactName && (

                  <p>
                    Buyer:
                    {" "}
                    {task.contactName}
                  </p>

                )
              }





              {
                task.dealName && (

                  <p>
                    Deal:
                    {" "}
                    {task.dealName}
                  </p>

                )
              }





              {
                task.propertyName && (

                  <p>
                    Property:
                    {" "}
                    {task.propertyName}
                  </p>

                )
              }


            </div>

          )
        }



      </div>







      {
  !task.completed && (

    <button
      onClick={() =>
        onComplete?.(task)
      }
      className="rounded-full border p-2 hover:bg-muted"
      title="Complete task"
    >

      <CheckCircle2 className="h-5 w-5" />

    </button>

  )
}



    </div>

  )

}