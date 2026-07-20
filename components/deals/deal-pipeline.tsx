"use client"

import { useState } from "react"

import {
  DndContext,
  DragEndEvent,
} from "@dnd-kit/core"

import type { Deal, DealStage } from "@/types/deal"

import { PipelineColumn } from "./pipeline-column"

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

type Props = {
  deals: Deal[]
}

export function DealPipeline({
  deals: initialDeals,
}: Props) {
  const [deals, setDeals] =
    useState(initialDeals)

  function handleDragEnd(
    event: DragEndEvent
  ) {
    const { active, over } = event

    if (!over) return

    setDeals((current) =>
      current.map((deal) =>
        deal.id === active.id
          ? {
              ...deal,
              stage:
                over.id as DealStage,
            }
          : deal
      )
    )
  }

  return (
    <DndContext
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6">
        {stages.map(([stage, title]) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            title={title}
            deals={deals.filter(
              (d) => d.stage === stage
            )}
          />
        ))}
      </div>
    </DndContext>
  )
}