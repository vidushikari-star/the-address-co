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

import {
  DealCard,
} from "./deal-card"




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



  const [
    mobileStage,
    setMobileStage,
  ] =
  useState<DealStage>("lead")





  useEffect(() => {

    setDeals(
      initialDeals
    )

  },[
    initialDeals
  ])







  async function handleDragEnd(
    event: DragEndEvent
  ) {


    const {
      active,
      over,
    } = event



    if(!over){

      return

    }



    const dealId =
      active.id.toString()



    const currentDeal =
      deals.find(
        deal =>
          deal.id === dealId
      )



    if(!currentDeal){

      return

    }




    let newStage:
      DealStage | undefined




    if(
      validStages.includes(
        over.id.toString() as DealStage
      )
    ){

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





    if(!newStage || currentDeal.stage === newStage){

      return

    }





    setDeals(
      current =>
        current.map(
          deal =>
            deal.id === dealId
            ? {
                ...deal,
                stage:newStage,
              }
            :
              deal
        )
    )




    try {


      const now =
        new Date().toISOString()



      await updateDeal(
        dealId,
        {
          stage:newStage,
          lastActivity:now,
        }
      )




      await createActivity({

        type:
          "deal_stage_changed",

        title:
          "Deal Stage Changed",

        description:
          currentDeal.name,

        body:
          `Stage changed from ${
            currentDeal.stage.replace(
              /_/g,
              " "
            )
          } to ${
            newStage.replace(
              /_/g,
              " "
            )
          }`,

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

    <>


      {/* DESKTOP PIPELINE */}

      <div className="hidden md:block">


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

                    key={stage}

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


      </div>








      {/* MOBILE PIPELINE */}

      <div className="md:hidden space-y-4">



        <div className="flex gap-2 overflow-x-auto pb-2">


          {
            stages.map(
              ([
                stage,
                title,
              ]) => (

                <button

                  key={stage}

                  onClick={() =>
                    setMobileStage(
                      stage
                    )
                  }

                  className={`
                    whitespace-nowrap
                    rounded-full
                    border
                    px-4
                    py-2
                    text-sm
                    ${
                      mobileStage === stage
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                    }
                  `}

                >

                  {title}

                  {" "}

                  (
                  {
                    deals.filter(
                      deal =>
                        deal.stage === stage
                    ).length
                  }
                  )

                </button>

              )

            )
          }


        </div>






        <div className="space-y-4">


          {
            deals.filter(
              deal =>
                deal.stage === mobileStage
            )
            .map(
              deal => (

                <DealCard

                  key={
                    deal.id
                  }

                  deal={
                    deal
                  }

                />

              )
            )
          }



          {
            deals.filter(
              deal =>
                deal.stage === mobileStage
            )
            .length === 0 && (

              <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">

                No deals in this stage.

              </p>

            )

          }


        </div>


      </div>


    </>

  )

}