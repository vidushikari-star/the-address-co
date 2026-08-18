"use client"

import {
useState,
} from "react"

import {
  getIndiaDateKey,
} from "@/lib/utils/india-date"

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
  initialFilter?: string
}



type Filter =
  | "all"
  | "today"
  | "upcoming"
  | "completed"
  | "archive"



export function TaskPageClient({
  tasks,
  initialFilter,
}: Props){

  const router =
    useRouter()



  const [
    filter,
    setFilter,
  ] =
  useState<Filter>(
    initialFilter === "active"
    || initialFilter === "today"
    || initialFilter === "upcoming"
    || initialFilter === "completed"
    || initialFilter === "archive"
      ? (initialFilter === "active" ? "all" : initialFilter)
      : "all"
  )



  const today = getIndiaDateKey()



  const counts = {

    all:
  tasks.filter(
    task =>
      !task.archived
      &&
      !task.completed
  ).length,



    today:
      tasks.filter(
        task => {

          if(
            task.completed ||
            !task.dueDate
          ){

            return false

          }


          return task.dueDate === today

        }
      ).length,



    upcoming:
      tasks.filter(
        task => {

          if(
            task.completed ||
            !task.dueDate
          ){

            return false

          }


          return task.dueDate > today

        }
      ).length,



    completed:
      tasks.filter(
        task =>
          task.completed
      ).length,



    archive:
  tasks.filter(
    task =>
      task.archived
  ).length,

  }



  const filtered =
    tasks.filter(
      task => {


        if(
  filter === "archive"
){

  return task.archived

}



        if(
  filter === "completed"
){

  return (
    task.completed &&
    !task.archived
  )

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


          return task.dueDate === today

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


          return task.dueDate > today

        }




        // Default: Active Tasks only
        return !task.archived && !task.completed


      }
    )



  const filters = [

    {
      id:"all",
      label:"Active",
      count:counts.all,
    },

    {
      id:"today",
      label:"Today",
      count:counts.today,
    },

    {
      id:"upcoming",
      label:"Upcoming",
      count:counts.upcoming,
    },

    {
      id:"completed",
      label:"Completed",
      count:counts.completed,
    },

    {
      id:"archive",
      label:"Archive",
      count:counts.archive,
    },

  ]



  return (

    <div className="
      space-y-6
    ">


      <div className="
        flex
        gap-2
        overflow-x-auto
        pb-2
        scrollbar-none
      ">


        {
          filters.map(
            item => (

              <button

                key={
                  item.id
                }

                onClick={() =>
                  setFilter(
                    item.id as Filter
                  )
                }

                className={`
                  flex
                  shrink-0
                  items-center
                  gap-2
                  rounded-full
                  border
                  px-4
                  py-2
                  text-sm
                  transition
                  ${
                    filter === item.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background"
                  }
                `}

              >

                {item.label}


                <span className="
                  rounded-full
                  bg-black/10
                  px-2
                  py-0.5
                  text-xs
                ">

                  {item.count}

                </span>


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
