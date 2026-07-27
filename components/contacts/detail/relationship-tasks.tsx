"use client"

import {
  useEffect,
  useState,
} from "react"

import type { Contact } from "@/types"
import type { Task } from "@/types/task"

import {
  getTasksByContactId,
  updateTask,
  createTask,
} from "@/lib/repositories/task-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  ADVISORS,
} from "@/lib/config/advisors"

import {
  CalendarClock,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Checkbox } from "@/components/ui/checkbox"



type Props = {
  contact: Contact
}





export function RelationshipTasks({
  contact,
}: Props) {


  const [
    tasks,
    setTasks,
  ] =
  useState<Task[]>([])


  const [
    showForm,
    setShowForm,
  ] =
  useState(false)


  const [
    title,
    setTitle,
  ] =
  useState("")


  const [
    dueDate,
    setDueDate,
  ] =
  useState("")


  const [
    assignedTo,
    setAssignedTo,
  ] =
  useState("Vidushi Kari")





  async function loadTasks(){

    const data =
      await getTasksByContactId(
        contact.id
      )

    setTasks(data)

  }





  useEffect(() => {

    loadTasks()

  }, [contact.id])







  async function toggleTask(
    task: Task
  ){

    const updated =
      await updateTask(
        task.id,
        {
          completed:
            !task.completed,
        }
      )


    setTasks(
      current =>
        current.map(
          item =>
            item.id === task.id
              ? updated
              : item
        )
    )

  }







  async function addTask(){


    if(!title){

      alert(
        "Please enter task title"
      )

      return

    }



    const task =
      await createTask({

        contactId:
          contact.id,

        title,

        dueDate:
          dueDate
            ? new Date(dueDate)
            : undefined,

        assignedTo,

      })



    await createActivity({

      type:
        "task_created",

      title:
        "Follow-up Created",

      description:
        `${title} created for ${contact.name}`,

      contactId:
        contact.id,

      date:
        new Date().toISOString(),

    })



    setTasks(
      current => [
        task,
        ...current,
      ]
    )


    setTitle("")
    setDueDate("")
    setShowForm(false)

  }







  const pending =
    tasks.filter(
      task =>
        !task.completed
    )


  const completed =
    tasks.filter(
      task =>
        task.completed
    )








  return (

    <Card>


      <CardHeader className="
        flex
        flex-col
        gap-3
        px-4
        py-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">


        <CardTitle className="text-base">

          Tasks

        </CardTitle>



        <Button

          size="sm"

          variant={
            showForm
              ? "outline"
              : "default"
          }

          className="w-full sm:w-auto"

          onClick={() =>
            setShowForm(
              !showForm
            )
          }

        >

          {
            showForm
              ? (
                <>
                  <X className="mr-1 h-4 w-4"/>
                  Cancel
                </>
              )
              : (
                <>
                  <Plus className="mr-1 h-4 w-4"/>
                  Add
                </>
              )
          }

        </Button>


      </CardHeader>







      <CardContent className="
        space-y-4
        px-4
        pb-4
      ">





        {
          showForm && (

            <div className="
              space-y-3
              rounded-xl
              border
              p-3
            ">


              <Input

                className="h-11"

                placeholder="Follow-up task"

                value={title}

                onChange={
                  e =>
                    setTitle(
                      e.target.value
                    )
                }

              />



              <Input

                className="h-11"

                type="date"

                value={dueDate}

                onChange={
                  e =>
                    setDueDate(
                      e.target.value
                    )
                }

              />



              <select

                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  px-3
                  text-sm
                "

                value={assignedTo}

                onChange={
                  e =>
                    setAssignedTo(
                      e.target.value
                    )
                }

              >

                {
                  Object.values(
                    ADVISORS
                  ).map(
                    advisor => (

                      <option
                        key={advisor.name}
                        value={advisor.name}
                      >

                        {advisor.name}

                      </option>

                    )
                  )
                }

              </select>




              <Button
                className="w-full"
                onClick={addTask}
              >

                Create Follow-up

              </Button>


            </div>

          )

        }








        {
          pending.length === 0 ? (

            <p className="text-sm text-muted-foreground">

              No pending tasks.

            </p>


          ) : (


            <div>


              <p className="
                mb-2
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-muted-foreground
              ">

                Upcoming

              </p>




              <div className="space-y-2">


                {
                  pending.map(
                    task => (

                      <div

                        key={task.id}

                        className="
                          rounded-xl
                          border
                          p-3
                        "

                      >


                        <div className="
                          flex
                          items-start
                          gap-3
                        ">


                          <Checkbox

                            className="mt-1 h-5 w-5"

                            checked={
                              task.completed
                            }

                            onCheckedChange={() =>
                              toggleTask(task)
                            }

                          />



                          <div className="min-w-0 flex-1">


                            <p className="
                              break-words
                              text-sm
                              font-medium
                            ">

                              {task.title}

                            </p>




                            {
                              task.dueDate && (

                                <div className="
                                  mt-1
                                  flex
                                  items-center
                                  gap-1
                                  text-xs
                                  text-muted-foreground
                                ">

                                  <CalendarClock className="h-3.5 w-3.5"/>

                                  {
                                    new Date(
                                      task.dueDate
                                    ).toLocaleDateString(
                                      "en-IN"
                                    )
                                  }

                                </div>

                              )
                            }


                          </div>


                        </div>


                      </div>

                    )
                  )
                }


              </div>


            </div>


          )

        }








        {
          completed.length > 0 && (

            <div>


              <p className="
                mb-2
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-muted-foreground
              ">

                Completed

              </p>



              <div className="space-y-2">

                {
                  completed.map(
                    task => (

                      <div

                        key={task.id}

                        className="
                          rounded-xl
                          bg-muted/30
                          p-3
                        "

                      >

                        <div className="flex items-center gap-2">

                          <CheckCircle2 className="h-4 w-4 shrink-0"/>

                          <p className="
                            break-words
                            text-sm
                            text-muted-foreground
                            line-through
                          ">

                            {task.title}

                          </p>


                        </div>


                      </div>

                    )
                  )
                }

              </div>


            </div>

          )

        }


      </CardContent>


    </Card>

  )

}