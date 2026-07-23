"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  DndContext,
  DragEndEvent,
  closestCorners,
} from "@dnd-kit/core"

import type {
  Deal,
  DealStage,
} from "@/types/deal"

import {
  updateDeal,
} from "@/lib/repositories/deal-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  PipelineColumn,
} from "./pipeline-column"



const stages = [
  ["lead", "Lead"],
  ["qualification", "Qualification"],
  ["property_shared", "Property Shared"],
  ["site_visit", "Site Visit"],
  ["negotiation", "Negotiation"],
  ["documentation", "Documentation"],
  ["closed_won", "Closed Won"],
  ["closed_lost", "Closed Lost"],
] as const



const validStages: DealStage[] = [

  "lead",
  "qualification",
  "property_shared",
  "site_visit",
  "negotiation",
  "documentation",
  "closed_won",
  "closed_lost",

]



type Props = {
  deals: Deal[]
}





export function DealPipeline({
  deals: initialDeals,
}: Props) {


  const [
    deals,
    setDeals,
  ] = useState(
    initialDeals
  )





  useEffect(() => {

    setDeals(
      initialDeals
    )

  }, [initialDeals])







  async function handleDragEnd(
    event: DragEndEvent
  ) {


    const {
      active,
      over,
    } = event



    if (!over) {

      return

    }



    const dealId =
      active.id.toString()



    const currentDeal =
      deals.find(
        deal =>
          deal.id === dealId
      )



    if (!currentDeal) {

      return

    }





    let newStage:
      DealStage | undefined





    if (

      validStages.includes(
        over.id.toString() as DealStage
      )

    ) {


      newStage =
        over.id.toString() as DealStage


    }


    else {


      const targetDeal =
        deals.find(
          deal =>
            deal.id === over.id
        )



      if(targetDeal){

        newStage =
          targetDeal.stage

      }

    }





    if(!newStage){

      return

    }





    if(
      currentDeal.stage === newStage
    ){

      return

    }





    setDeals(
      current =>
        current.map(
          deal =>
            deal.id === dealId
              ? {
                  ...deal,
                  stage:
                    newStage,
                }
              : deal
        )
    )





    try {


      const now =
        new Date().toISOString()



      await updateDeal(

        dealId,

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
          `Deal moved to ${newStage.replace(
            /_/g,
            " "
          )}`,



        description:
          currentDeal.name,



        body:
          `Stage changed from ${currentDeal.stage.replace(
            /_/g,
            " "
          )}

to ${newStage.replace(
  /_/g,
  " "
)}`,



        dealId,



        contactId:
          currentDeal.contactId,



        propertyId:
          currentDeal.propertyId,



        date:
          now,

      })



    } catch(error){


      console.error(
        "FAILED DRAG UPDATE:",
        error
      )


      alert(
        "Failed updating deal stage"
      )



      setDeals(
        [
          ...initialDeals
        ]
      )

    }


  }





  return (

    <DndContext

      collisionDetection={
        closestCorners
      }

      onDragEnd={
        handleDragEnd
      }

    >


      <div className="flex gap-6 overflow-x-auto pb-6">


        {
          stages.map(
            ([
              stage,
              title,
            ]) => (

              <PipelineColumn

                key={
                  stage
                }

                stage={
                  stage
                }

                title={
                  title
                }

                deals={
                  deals.filter(
                    deal =>
                      deal.stage === stage
                  )
                }

              />

            )
          )
        }


      </div>


    </DndContext>

  )

}