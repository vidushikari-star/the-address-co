"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import type {
  TaskWithContext,
} from "@/lib/repositories/task-server-repository"

import {
  TaskList,
} from "./task-list"



type Props = {
  tasks: TaskWithContext[]
}





type Filter =
  | "all"
  | "today"
  | "upcoming"
  | "completed"







export function TaskPageClient({
  tasks,
}: Props){


  const router =
    useRouter()



  const [
    filter,
    setFilter,
  ] =
  useState<Filter>(
    "all"
  )





  const today =
    new Date()



  today.setHours(
    0,
    0,
    0,
    0
  )







  const filtered =
    tasks.filter(
      task => {


        if(
          filter === "completed"
        ){

          return task.completed

        }





        if(
          filter === "today"
        ){

          if(
            task.completed ||
            !task.dueDate
          ){

            return false

          }



          const date =
            new Date(
              task.dueDate
            )


          date.setHours(
            0,
            0,
            0,
            0
          )



          return (
            date.getTime()
            ===
            today.getTime()
          )

        }







        if(
          filter === "upcoming"
        ){

          if(
            task.completed ||
            !task.dueDate
          ){

            return false

          }



          const date =
            new Date(
              task.dueDate
            )


          date.setHours(
            0,
            0,
            0,
            0
          )



          return (
            date >
            today
          )

        }







        return true

      }
    )







  return (

    <div className="space-y-6">


      <div className="flex gap-3 flex-wrap">


        {
          [
            ["all","All"],
            ["today","Today"],
            ["upcoming","Upcoming"],
            ["completed","Completed"],
          ].map(
            item => (

              <button

                key={
                  item[0]
                }

                onClick={() =>
                  setFilter(
                    item[0] as Filter
                  )
                }

                className={`rounded-full border px-4 py-2 text-sm ${
                  filter === item[0]
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}

              >

                {
                  item[1]
                }

              </button>

            )
          )

        }


      </div>





      <TaskList

        tasks={
          filtered
        }

        onTaskUpdated={() =>
          router.refresh()
        }

      />



    </div>

  )

}