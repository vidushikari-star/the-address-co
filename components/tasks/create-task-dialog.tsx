"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
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
  Textarea,
} from "@/components/ui/textarea"

import {
  createTask,
} from "@/lib/repositories/task-repository"







export function CreateTaskDialog(){


  const router =
    useRouter()



  const [
    open,
    setOpen,
  ] =
  useState(false)



  const [
    saving,
    setSaving,
  ] =
  useState(false)





  const [
    form,
    setForm,
  ] =
  useState({

    title:"",

    description:"",

    priority:"medium",

    dueDate:"",

  })







  async function submit(){


    if(
      !form.title
    ){

      return

    }



    setSaving(true)



    try{


      await createTask({

        title:
          form.title,


        description:
          form.description,


        priority:
          form.priority as any,


        dueDate:
          form.dueDate
            ? new Date(
                form.dueDate
              )
            : undefined,


      })




      setOpen(false)



      setForm({

        title:"",

        description:"",

        priority:"medium",

        dueDate:"",

      })



      router.refresh()



    }
    finally{

      setSaving(false)

    }


  }







  return (

    <>

      <Button

        className="
          w-full
          sm:w-auto
        "

        onClick={() =>
          setOpen(true)
        }

      >

        <Plus className="mr-2 h-4 w-4"/>

        New Task

      </Button>








      {
        open && (

          <div className="
            fixed
            inset-0
            z-50
            flex
            items-end
            justify-center
            bg-black/40
            sm:items-center
          ">



            <div className="
              w-full
              rounded-t-3xl
              bg-background
              p-5
              sm:max-w-lg
              sm:rounded-2xl
            ">


              <div className="
                mb-5
                flex
                items-center
                justify-between
              ">


                <h2 className="
                  text-xl
                  font-semibold
                ">

                  Create Task

                </h2>



                <button

                  onClick={() =>
                    setOpen(false)
                  }

                  className="
                    rounded-full
                    p-2
                    hover:bg-muted
                  "

                >

                  <X className="h-5 w-5"/>

                </button>


              </div>







              <div className="
                space-y-5
              ">




                <div>

                  <label className="text-sm">
                    Title
                  </label>


                  <Input

                    value={
                      form.title
                    }

                    onChange={
                      e =>
                        setForm({
                          ...form,
                          title:e.target.value,
                        })
                    }

                    placeholder="Follow up with client"

                  />

                </div>







                <div>

                  <label className="text-sm">
                    Description
                  </label>


                  <Textarea

                    value={
                      form.description
                    }

                    onChange={
                      e =>
                        setForm({
                          ...form,
                          description:e.target.value,
                        })
                    }

                    placeholder="Add notes"

                  />

                </div>







                <div>

                  <label className="text-sm">
                    Priority
                  </label>


                  <select

                    value={
                      form.priority
                    }

                    onChange={
                      e =>
                        setForm({
                          ...form,
                          priority:e.target.value,
                        })
                    }

                    className="
                      mt-1
                      w-full
                      rounded-md
                      border
                      bg-background
                      px-3
                      py-2
                    "

                  >

                    <option value="low">
                      Low
                    </option>


                    <option value="medium">
                      Medium
                    </option>


                    <option value="high">
                      High
                    </option>


                  </select>


                </div>







                <div>

                  <label className="text-sm">
                    Due Date
                  </label>


                  <Input

                    type="date"

                    value={
                      form.dueDate
                    }

                    onChange={
                      e =>
                        setForm({
                          ...form,
                          dueDate:e.target.value,
                        })
                    }

                  />


                </div>







                <Button

                  className="
                    w-full
                  "

                  disabled={
                    saving
                  }

                  onClick={
                    submit
                  }

                >

                  {
                    saving
                    ?
                    "Saving..."
                    :
                    "Create Task"
                  }


                </Button>



              </div>


            </div>


          </div>

        )
      }


    </>

  )

}