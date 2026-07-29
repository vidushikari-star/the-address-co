"use client"

import {
  useState,
} from "react"

import type {
  TaskWithContext,
} from "@/lib/repositories/task-server-repository"

import {
  updateTask,
} from "@/lib/repositories/task-repository"

import {
  TaskCard,
} from "./task-card"



type Props = {
  tasks: TaskWithContext[]

  onTaskUpdated?: () => void
}





export function TaskList({
  tasks: initialTasks,
  onTaskUpdated,
}: Props) {


  const [
  tasks,
  setTasks,
] = useState(initialTasks)







  async function completeTask(
    task: TaskWithContext
  ){

    try {


      await updateTask(
        task.id,
        {
          completed:true,
        }
      )



      setTasks(
        current =>
          current.filter(
            item =>
              item.id !== task.id
          )
      )



      onTaskUpdated?.()



    } catch(error){


      console.error(
        "Failed completing task",
        error
      )


    }

  }






  if(tasks.length === 0){

    return (

      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">

        No tasks found.

      </div>

    )

  }






  return (

    <div className="space-y-4">

      {
        tasks.map(
          task => (

            <TaskCard

              key={
                task.id
              }

              task={
                task
              }

              onComplete={
                completeTask
              }

            />

          )
        )
      }

    </div>

  )

}