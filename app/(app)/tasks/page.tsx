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

    <div className="space-y-8 p-8">


      <div className="flex items-start justify-between">


        <div>


          <h1 className="text-3xl font-semibold">

            Tasks

          </h1>


          <p className="text-muted-foreground">

            Manage follow-ups and actions.

          </p>


        </div>




        <CreateTaskDialog />



      </div>





      <TaskPageClient

        tasks={
          tasks
        }

      />



    </div>

  )

}