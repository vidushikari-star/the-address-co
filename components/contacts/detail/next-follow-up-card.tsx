"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  CalendarClock,
  CheckCircle2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Button,
} from "@/components/ui/button"

import {
  CreateTaskDialog,
} from "@/components/tasks/create-task-dialog"

import type {
  Contact,
} from "@/types/contact"

import type {
  Task,
} from "@/types/task"

import {
  getTasksByContactId,
  updateTask,
} from "@/lib/repositories/task-repository"



type Props = {
  contact: Contact
}





export function NextFollowUpCard({
  contact,
}: Props) {


  const [
    task,
    setTask,
  ] =
  useState<Task | null>(null)



  const [
    loading,
    setLoading,
  ] =
  useState(true)



  const [
    completing,
    setCompleting,
  ] =
  useState(false)






  async function loadTask(){

    setLoading(true)

    try {

      const tasks =
        await getTasksByContactId(
          contact.id
        )



      const pendingTasks =
        tasks
          .filter(
            item =>
              !item.completed
          )
          .sort(
            (a,b) => {

              const dateA =
                a.dueDate
                  ? new Date(
                      a.dueDate
                    ).getTime()
                  : Infinity


              const dateB =
                b.dueDate
                  ? new Date(
                      b.dueDate
                    ).getTime()
                  : Infinity


              return dateA - dateB

            }
          )



      setTask(
        pendingTasks[0] ?? null
      )


    }
    finally {

      setLoading(false)

    }

  }






  useEffect(()=>{

    loadTask()

  },[
    contact.id
  ])








  async function completeTask(){

    if(!task){

      return

    }


    setCompleting(true)


    try {


      await updateTask(
        task.id,
        {
          completed:true,
        }
      )


      await loadTask()


    }
    finally {

      setCompleting(false)

    }

  }








  return (

    <Card
      className="
        rounded-2xl
      "
    >

      <CardHeader
        className="
          px-4
          py-3
        "
      >

        <CardTitle
          className="
            flex
            items-center
            gap-2
            text-base
          "
        >

          <CalendarClock
            className="
              h-4
              w-4
            "
          />

          Next Action

        </CardTitle>


      </CardHeader>






      <CardContent
        className="
          space-y-4
          px-4
          pb-5
        "
      >


        {
          loading ? (

            <p className="
              text-sm
              text-muted-foreground
            ">

              Loading...

            </p>

          )


          :


          task ? (

            <div
              className="
                space-y-3
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    font-semibold
                  "
                >

                  {task.title}

                </p>



                {
                  task.dueDate && (

                    <p
                      className="
                        mt-1
                        text-xs
                        text-muted-foreground
                      "
                    >

                      {
                        new Date(
                          task.dueDate
                        )
                        .toLocaleString(
                          "en-IN",
                          {
                            day:"numeric",
                            month:"short",
                            year:"numeric",
                            hour:"numeric",
                            minute:"2-digit",
                          }
                        )
                      }

                    </p>

                  )
                }



                {
                  task.assignedTo && (

                    <p
                      className="
                        mt-1
                        text-xs
                        text-muted-foreground
                      "
                    >

                      Assigned to:
                      {" "}
                      {task.assignedTo}

                    </p>

                  )
                }

              </div>





              <Button

                size="sm"

                variant="outline"

                disabled={
                  completing
                }

                onClick={
                  completeTask
                }

              >

                <CheckCircle2
                  className="
                    mr-2
                    h-4
                    w-4
                  "
                />

                {
                  completing
                    ? "Completing..."
                    : "Complete"
                }

              </Button>


            </div>

          )


          :


          (

            <div
              className="
                space-y-3
              "
            >

              <p
                className="
                  text-sm
                  text-muted-foreground
                "
              >

                No follow-up scheduled.

              </p>



              <CreateTaskDialog

                contactId={
                  contact.id
                }

                onCreated={
                  loadTask
                }

              />


            </div>

          )

        }


      </CardContent>


    </Card>

  )

}