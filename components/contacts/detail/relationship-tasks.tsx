"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  Contact,
} from "@/types"

import type {
  Task,
} from "@/types/task"

import {
  getTasksByContactId,
  updateTask,
  createTask,
} from "@/lib/repositories/task-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"


import {
  CalendarClock,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Checkbox,
} from "@/components/ui/checkbox"

import {
getAllUserProfiles,
} from "@/lib/repositories/user-profile-repository"

import type {
UserProfile,
} from "@/types/user"





type Props = {

  contact: Contact

}








export function RelationshipTasks({
  contact,
}:Props){



  const [
    tasks,
    setTasks,
  ] =
  useState<Task[]>([])



  const [loading] = useState(false)



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
useState("")

const [
advisors,
setAdvisors,
] =
useState<UserProfile[]>([])








  useEffect(() => {

let mounted = true


async function loadTasks() {

const [
taskData,
advisorData,
] =
await Promise.all([

getTasksByContactId(
contact.id
),

getAllUserProfiles(),

])


if(mounted){

setTasks(
taskData
)

setAdvisors(
advisorData
)

}

}


loadTasks()


return () => {

mounted = false

}

},[
contact.id
])








  async function toggleTask(
    task:Task
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


    if(
      !title.trim()
    ){

      return

    }





    const task =
      await createTask({

        contactId:
          contact.id,

        title:
          title.trim(),

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

    <Card className="
      rounded-2xl
    ">



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


        <CardTitle className="
          text-base
        ">

          Tasks

        </CardTitle>





        <Button

          size="sm"

          variant={
            showForm
            ? "outline"
            : "default"
          }

          className="
            w-full
            sm:w-auto
          "

          onClick={() =>
            setShowForm(
              !showForm
            )
          }

        >


          {
            showForm
            ?

            (
              <>

                <X className="
                  mr-1
                  h-4
                  w-4
                "/>

                Cancel

              </>
            )

            :

            (

              <>

                <Plus className="
                  mr-1
                  h-4
                  w-4
                "/>

                Add

              </>

            )

          }


        </Button>


      </CardHeader>









      <CardContent className="
        space-y-5
        px-4
        pb-5
      ">






        {
          showForm && (

            <div className="
              space-y-3
              rounded-xl
              border
              p-4
            ">

<select

className="
w-full
rounded-lg
border
p-3
"

value={
assignedTo
}

onChange={
e =>
setAssignedTo(
e.target.value
)
}

>

<option value="">
Unassigned
</option>


{
advisors.map(
advisor => (

<option

key={
advisor.id
}

value={
advisor.id
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

              <Input

                placeholder="Follow-up task"

                value={
                  title
                }

                onChange={
                  e =>
                    setTitle(
                      e.target.value
                    )
                }

              />





              <Input

                type="date"

                value={
                  dueDate
                }

                onChange={
                  e =>
                    setDueDate(
                      e.target.value
                    )
                }

              />






              






              <Button

                className="
                  w-full
                "

                onClick={
                  addTask
                }

              >

                Create Follow-up

              </Button>


            </div>

          )

        }








        {
          loading ? (

            <p className="
              text-sm
              text-muted-foreground
            ">

              Loading tasks...

            </p>

          )

          :

          pending.length === 0 ? (

            <div className="
              rounded-xl
              border
              border-dashed
              p-5
              text-center
              text-sm
              text-muted-foreground
            ">

              No pending tasks.

            </div>

          )

          :

          (

            <TaskGroup

              title="Upcoming"

              tasks={
                pending
              }

              onToggle={
                toggleTask
              }

            />

          )

        }









        {
          completed.length > 0 && (

            <TaskGroup

              title="Completed"

              tasks={
                completed
              }

              completed

              onToggle={
                toggleTask
              }

            />

          )
        }





      </CardContent>


    </Card>

  )

}








function TaskGroup({
  title,
  tasks,
  completed = false,
  onToggle,
}:{
  title:string
  tasks:Task[]
  completed?:boolean
  onToggle:(task:Task)=>void
}){


  return (

    <div>


      <p className="
        mb-3
        text-xs
        font-semibold
        uppercase
        tracking-wide
        text-muted-foreground
      ">

        {title}

      </p>





      <div className="
        space-y-3
      ">


        {
          tasks.map(
            task => (

              <div

                key={
                  task.id
                }

                className={`
                  rounded-xl
                  border
                  p-4
                  ${
                    completed
                    ? "bg-muted/30"
                    : ""
                  }
                `}

              >


                <div className="
                  flex
                  items-start
                  gap-3
                ">



                  <Checkbox

                    className="
                      mt-1
                      h-5
                      w-5
                    "

                    checked={
                      task.completed
                    }

                    onCheckedChange={() =>
                      onToggle(
                        task
                      )
                    }

                  />





                  <div className="
                    min-w-0
                    flex-1
                  ">


                    <p className={`
                      text-sm
                      font-medium
                      ${
                        completed
                        ? "line-through text-muted-foreground"
                        : ""
                      }
                    `}>

                      {task.title}

                    </p>





                    {
                      task.dueDate && (

                        <div className="
                          mt-2
                          flex
                          items-center
                          gap-2
                          text-xs
                          text-muted-foreground
                        ">


                          <CalendarClock className="
                            h-3.5
                            w-3.5
                          "/>


                          {
                            new Date(
                              task.dueDate
                            )
                            .toLocaleDateString(
                              "en-IN"
                            )
                          }


                        </div>

                      )
                    }


                  </div>





                  {
                    completed && (

                      <CheckCircle2 className="
                        h-4
                        w-4
                      "/>

                    )
                  }



                </div>


              </div>

            )

          )

        }


      </div>


    </div>

  )

}