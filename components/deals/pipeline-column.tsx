"use client"

import {
  useDroppable,
} from "@dnd-kit/core"

import type {
  Deal,
  DealStage,
} from "@/types/deal"

import {
  DraggableDealCard,
} from "./draggable-deal-card"





type Props = {

  stage: DealStage

  title: string

  deals: Deal[]

}








export function PipelineColumn({
  stage,
  title,
  deals,
}:Props){


  const {
    setNodeRef,
    isOver,
  } =
  useDroppable({

    id: stage,

  })







  return (

    <div className="
      w-[320px]
      shrink-0
      md:w-[360px]
    ">





      <div className="
        sticky
        top-0
        z-10
        mb-3
        flex
        items-center
        justify-between
        rounded-xl
        bg-background/95
        px-2
        py-2
        backdrop-blur
      ">


        <h2 className="
          font-semibold
          capitalize
        ">

          {title}

        </h2>





        <span className="
          rounded-full
          bg-muted
          px-3
          py-1
          text-xs
          font-medium
        ">

          {deals.length}

        </span>


      </div>









      <div

        ref={setNodeRef}

        className={`
          min-h-[520px]
          space-y-4
          rounded-2xl
          border
          p-3
          transition
          ${
            isOver
            ? "bg-muted/70 ring-2 ring-primary/20"
            : "bg-muted/10"
          }
        `}

      >





        {
          deals.length === 0 ? (

            <div className="
              flex
              min-h-32
              items-center
              justify-center
              rounded-xl
              border
              border-dashed
              text-sm
              text-muted-foreground
            ">

              No deals

            </div>

          ) : (

            deals.map(
              deal => (

                <DraggableDealCard

                  key={
                    deal.id
                  }

                  deal={
                    deal
                  }

                />

              )

            )

          )
        }





      </div>


    </div>

  )

}