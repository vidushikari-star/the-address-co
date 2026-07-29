"use client"

import {
  useSortable,
} from "@dnd-kit/sortable"

import {
  CSS,
} from "@dnd-kit/utilities"

import type {
  Deal,
} from "@/types/deal"

import {
  DealCard,
} from "./deal-card"





type Props = {
  deal: Deal
}








export function DraggableDealCard({
  deal,
}:Props){



  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } =
  useSortable({

    id:
      deal.id,

  })







  return (

    <div

      ref={
        setNodeRef
      }


      style={{

        transform:
          CSS.Transform.toString(
            transform
          ),

        transition,

        opacity:
          isDragging
          ? 0.45
          : 1,

        zIndex:
          isDragging
          ? 50
          : undefined,

      }}


      {...attributes}

      className={`
        touch-none
        ${
          isDragging
          ? "scale-[1.02]"
          : ""
        }
      `}

    >



      <div

        {...listeners}

        className="
          cursor-grab
          active:cursor-grabbing
        "

      >

        <DealCard

          deal={
            deal
          }

        />

      </div>



    </div>

  )

}