"use client"

import { useDroppable } from "@dnd-kit/core"

import type { Deal, DealStage } from "@/types/deal"

import { DraggableDealCard } from "./draggable-deal-card"

type Props = {
  stage: DealStage
  title: string
  deals: Deal[]
}

export function PipelineColumn({
  stage,
  title,
  deals,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  })

  return (
    <div className="w-96 shrink-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>

        <span className="rounded-full bg-muted px-2 py-1 text-xs">
          {deals.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[500px] space-y-4 rounded-xl border p-3 transition ${
          isOver ? "bg-muted/50" : ""
        }`}
      >
        {deals.map((deal) => (
          <DraggableDealCard
            key={deal.id}
            deal={deal}
          />
        ))}
      </div>
    </div>
  )
}