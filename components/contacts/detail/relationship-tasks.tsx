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





type RelationshipTasksProps = {
  contact: Contact
}





export function RelationshipTasks({
  contact,
}: RelationshipTasksProps) {


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
  ) {

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


      <CardHeader className="flex flex-row items-center justify-between">


        <CardTitle>
          Tasks
        </CardTitle>



        <Button

          size="sm"

          variant={
            showForm
              ? "outline"
              : "default"
          }

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
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              )
              : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </>
              )
          }

        </Button>


      </CardHeader>





      <CardContent className="space-y-6">



        {
          showForm && (

            <div className="space-y-3 rounded-xl border p-4">


              <Input

                placeholder="Task title"

                value={title}

                onChange={
                  e =>
                    setTitle(
                      e.target.value
                    )
                }

              />



              <Input

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

                className="w-full rounded-md border p-2 text-sm"

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
                        key={
                          advisor.name
                        }
                        value={
                          advisor.name
                        }
                      >

                        {
                          advisor.name
                        }

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






        {pending.length === 0 ? (

          <p className="text-sm text-muted-foreground">

            No pending tasks.

          </p>

        ) : (

          <div>


            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">

              Upcoming

            </p>



            <div className="space-y-3">


              {
                pending.map(
                  task => (

                    <div
                      key={task.id}
                      className="rounded-lg border p-3"
                    >

                      <div className="flex items-start gap-3">


                        <Checkbox

                          checked={
                            task.completed
                          }

                          onCheckedChange={() =>
                            toggleTask(
                              task
                            )
                          }

                        />



                        <div className="flex-1">


                          <p className="text-sm font-medium">

                            {task.title}

                          </p>



                          {
                            task.dueDate && (

                              <div className="flex items-center gap-2 text-xs text-muted-foreground">


                                <CalendarClock className="h-3.5 w-3.5" />


                                {
                                  new Date(
                                    task.dueDate
                                  ).toLocaleDateString()
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

        )}







        {
          completed.length > 0 && (

            <div>


              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">

                Completed

              </p>



              {
                completed.map(
                  task => (

                    <div
                      key={task.id}
                      className="rounded-lg border bg-muted/30 p-3"
                    >

                      <div className="flex items-center gap-3">

                        <CheckCircle2 className="h-4 w-4" />

                        <p className="text-sm text-muted-foreground line-through">

                          {task.title}

                        </p>

                      </div>

                    </div>

                  )
                )
              }


            </div>

          )
        }


      </CardContent>


    </Card>

  )

}