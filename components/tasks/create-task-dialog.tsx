"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  ADVISORS,
} from "@/lib/config/advisors"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  getDeals,
} from "@/lib/repositories/deal-repository"

import {
  createTask,
} from "@/lib/repositories/task-repository"

import type {
  Contact,
} from "@/types/contact"

import type {
  Deal,
} from "@/types/deal"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"



type Props = {}





export function CreateTaskDialog({}: Props){


  const router =
    useRouter()



  const [
    open,
    setOpen,
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
  useState(
    "Vidushi Kari"
  )



  const [
    linkType,
    setLinkType,
  ] =
  useState<
    "none" | "contact" | "deal"
  >(
    "none"
  )



  const [
    contacts,
    setContacts,
  ] =
  useState<Contact[]>([])



  const [
    deals,
    setDeals,
  ] =
  useState<Deal[]>([])



  const [
    contactId,
    setContactId,
  ] =
  useState("")



  const [
    dealId,
    setDealId,
  ] =
  useState("")






  useEffect(() => {


    async function load(){


      const [
        contactsData,
        dealsData,
      ] =
      await Promise.all([

        ContactsRepository.getAll(),

        getDeals(),

      ])



      setContacts(
        contactsData
      )


      setDeals(
        dealsData
      )


    }


    load()


  }, [])







  async function submit(){


    if(!title.trim()){

      return

    }



    try {


      await createTask({

        title,


        dueDate:
          dueDate
            ? new Date(dueDate)
            : undefined,


        assignedTo,


        contactId:
          linkType === "contact"
            ? contactId
            : undefined,


        dealId:
          linkType === "deal"
            ? dealId
            : undefined,

      })



      router.refresh()



      setTitle("")

      setDueDate("")

      setAssignedTo(
        "Vidushi Kari"
      )

      setLinkType(
        "none"
      )

      setContactId("")

      setDealId("")

      setOpen(false)



    } catch(error){


      console.error(
        "Failed creating task",
        error
      )


      alert(
        "Failed creating task"
      )


    }


  }







  return (

    <>

      <Button
        onClick={() =>
          setOpen(true)
        }
      >

        + New Task

      </Button>





      {
        open && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">


            <div className="w-full max-w-lg rounded-2xl bg-background p-6 space-y-5">


              <h2 className="text-xl font-semibold">
                Create Task
              </h2>





              <Input

                placeholder="Task title"

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





              <select

                className="w-full rounded-md border p-2"

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

                        {advisor.name}

                      </option>

                    )

                  )
                }

              </select>






              <select

                className="w-full rounded-md border p-2"

                value={
                  linkType
                }

                onChange={
                  e =>
                    setLinkType(
                      e.target.value as
                      "none" |
                      "contact" |
                      "deal"
                    )
                }

              >

                <option value="none">
                  No Link
                </option>

                <option value="contact">
                  Contact
                </option>

                <option value="deal">
                  Deal
                </option>

              </select>







              {
                linkType === "contact" && (

                  <select

                    className="w-full rounded-md border p-2"

                    value={
                      contactId
                    }

                    onChange={
                      e =>
                        setContactId(
                          e.target.value
                        )
                    }

                  >

                    <option value="">
                      Select Contact
                    </option>


                    {
                      contacts.map(

                        contact => (

                          <option

                            key={
                              contact.id
                            }

                            value={
                              contact.id
                            }

                          >

                            {contact.name}

                          </option>

                        )

                      )
                    }

                  </select>

                )
              }







              {
                linkType === "deal" && (

                  <select

                    className="w-full rounded-md border p-2"

                    value={
                      dealId
                    }

                    onChange={
                      e =>
                        setDealId(
                          e.target.value
                        )
                    }

                  >

                    <option value="">
                      Select Deal
                    </option>


                    {
                      deals.map(

                        deal => (

                          <option

                            key={
                              deal.id
                            }

                            value={
                              deal.id
                            }

                          >

                            {deal.name}

                          </option>

                        )

                      )
                    }

                  </select>

                )
              }







              <div className="flex justify-end gap-3">


                <Button

                  variant="outline"

                  onClick={() =>
                    setOpen(false)
                  }

                >

                  Cancel

                </Button>




                <Button

                  onClick={
                    submit
                  }

                >

                  Create

                </Button>


              </div>


            </div>


          </div>

        )
      }


    </>

  )

}