"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  updateDeal,
} from "@/lib/repositories/deal-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import type {
  Deal,
  DealStage,
} from "@/types/deal"



type Props = {

  deal: Deal

}



const stages: {
  value: DealStage
  label: string
}[] = [

  {
    value: "lead",
    label: "Lead",
  },

  {
    value: "qualification",
    label: "Qualification",
  },

  {
    value: "property_shared",
    label: "Property Shared",
  },

  {
    value: "site_visit",
    label: "Site Visit",
  },

  {
    value: "negotiation",
    label: "Negotiation",
  },

  {
    value: "documentation",
    label: "Documentation",
  },

  {
    value: "closed_won",
    label: "Closed Won",
  },

  {
    value: "closed_lost",
    label: "Closed Lost",
  },

]





export function DealStageSelect({
  deal,
}: Props) {


  const router =
    useRouter()



  const [
    loading,
    setLoading,
  ] = useState(false)





  async function changeStage(
    newStage: DealStage
  ) {


    if (
      newStage === deal.stage
    ) {

      return

    }



    setLoading(true)



    const now =
      new Date().toISOString()



    try {


      await updateDeal(

        deal.id,

        {

          stage:
            newStage,


          lastActivity:
            now,

        }

      )





      await createActivity({

        type:
          "deal_stage_changed",


        title:
          "Deal Stage Changed",


        description:
          deal.name,


        body:
          `Deal moved from:
${deal.stage.replace(
  /_/g,
  " "
)}

to:
${newStage.replace(
  /_/g,
  " "
)}`,


        dealId:
          deal.id,


        contactId:
          deal.contactId,


        propertyId:
          deal.propertyId,


        date:
          now,

      })





      router.refresh()



    } catch(error) {


      console.error(
        "Stage update failed",
        error
      )


      alert(
        "Failed updating stage"
      )



    } finally {


      setLoading(false)

    }

  }





  return (

    <select

      value={
        deal.stage
      }

      disabled={
        loading
      }

      onChange={(e)=>

        changeStage(
          e.target.value as DealStage
        )

      }

      className="rounded-full border bg-background px-3 py-1 text-sm"

    >

      {
        stages.map(
          stage => (

            <option

              key={
                stage.value
              }

              value={
                stage.value
              }

            >

              {stage.label}

            </option>

          )
        )
      }


    </select>

  )

}