"use client"

import {
  useState,
} from "react"

import type {
  Contact,
  ContactStage,
} from "@/types"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


const stages: {
  value: ContactStage
  label: string
}[] = [

  {
    value: "new",
    label: "New Lead",
  },

  {
    value: "contacted",
    label: "Contacted",
  },

  {
    value: "qualified",
    label: "Qualified",
  },

  {
    value: "active",
    label: "Active Buyer",
  },

  {
    value: "inactive",
    label: "Inactive",
  },

]



type Props = {
  contact: Contact
}



export function StageSelector({
  contact,
}: Props) {


  const [
    stage,
    setStage,
  ] =
  useState<ContactStage>(
    contact.stage
  )



  async function changeStage(
    value: ContactStage
  ) {

    const previous =
      stage


    setStage(value)



    try {

      await ContactsRepository.updateStage(
        contact.id,
        value
      )



      await createActivity({

        type:
  "lead_stage_changed",


        title:
  "Lead Stage Changed",


        description:
          `${contact.name}: ${previous} → ${value}`,


        contactId:
          contact.id,


        date:
          new Date().toISOString(),

      })


    } catch (error) {

      console.error(
        "Failed changing stage",
        error
      )


      setStage(previous)

    }

  }





  return (

    <Select

      value={stage}

      onValueChange={(
  value
) => {

  if(
    !value
  ){

    return

  }


  changeStage(
    value as ContactStage
  )

}}

    >

      <SelectTrigger className="w-[140px]">

        <SelectValue />

      </SelectTrigger>



      <SelectContent>

        {
          stages.map(
            item => (

              <SelectItem

                key={
                  item.value
                }

                value={
                  item.value
                }

              >

                {
                  item.label
                }

              </SelectItem>

            )
          )
        }

      </SelectContent>


    </Select>

  )

}