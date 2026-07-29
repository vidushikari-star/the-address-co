import {
  getAllTasks,
} from "@/lib/repositories/task-server-repository"

import {
  TaskPageClient,
} from "@/components/tasks/task-page-client"

import {
  CreateTaskDialog,
} from "@/components/tasks/create-task-dialog"



export const dynamic = "force-dynamic"





export default async function TasksPage(){


  const tasks =
    await getAllTasks()



  return (

    <div className="
      space-y-6
      p-4
      md:p-8
    ">


      <div className="
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-start
        sm:justify-between
      ">


        <div>

          <h1 className="
            text-2xl
            font-semibold
            md:text-3xl
          ">

            Tasks

          </h1>


          <p className="
            text-sm
            text-muted-foreground
            md:text-base
          ">

            Manage follow-ups and actions.

          </p>

        </div>





        <div className="
          w-full
          sm:w-auto
        ">

          <CreateTaskDialog />

        </div>


      </div>





      <TaskPageClient

        tasks={
          tasks
        }

      />



    </div>

  )

}