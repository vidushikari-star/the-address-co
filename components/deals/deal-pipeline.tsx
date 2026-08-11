"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

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
  transitionDealStageAction,
} from "@/lib/actions/deal-actions"

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
  const router = useRouter()
  const [
    deals,
    setDeals,
  ] = useState(initialDeals)

  const [
    mobileStage,
    setMobileStage,
  ] = useState<DealStage>("lead")

  const [
    pendingDealIds,
    setPendingDealIds,
  ] = useState<Set<string>>(() => new Set())

  const [
    stageError,
    setStageError,
  ] = useState<string | null>(null)

  useEffect(() => {
    setDeals(initialDeals)
  }, [initialDeals])

  const mobileDeals = useMemo(
    () =>
      deals.filter(
        (deal) =>
          deal.stage === mobileStage
      ),
    [
      deals,
      mobileStage,
    ]
  )

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
        (deal) =>
          deal.id === dealId
      )

    if (!currentDeal) {
      return
    }

    let newStage:
      | DealStage
      | undefined

    if (
      validStages.includes(
        over.id.toString() as DealStage
      )
    ) {
      newStage =
        over.id.toString() as DealStage
    } else {
      const targetDeal =
        deals.find(
          (deal) =>
            deal.id === over.id
        )

      if (targetDeal) {
        newStage =
          targetDeal.stage
      }
    }

    if (
      !newStage ||
      currentDeal.stage ===
        newStage ||
      pendingDealIds.has(dealId)
    ) {
      return
    }

    setDeals(
      (current) =>
        current.map((deal) =>
          deal.id === dealId
            ? {
                ...deal,
                stage: newStage,
              }
            : deal
      )
    )
    setPendingDealIds(current => new Set(current).add(dealId))
    setStageError(null)

    try {
      const result = await transitionDealStageAction({
        dealId,
        stage: newStage,
        contactId: currentDeal.contactId,
      })
      if (!result.ok) throw new Error(result.error)
      router.refresh()
    } catch (error) {
      console.error(error)
      setStageError(error instanceof Error ? error.message : "The deal stage could not be saved. Refresh and try again.")

      setDeals([
        ...initialDeals,
      ])
    } finally {
      setPendingDealIds(current => {
        const next = new Set(current)
        next.delete(dealId)
        return next
      })
    }
  }
  
    return (
    <>
      {stageError && <p className="mb-3 text-sm text-destructive" role="alert">{stageError}</p>}
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
            {stages.map(
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
                  deals={deals.filter(
                    (deal) =>
                      deal.stage ===
                      stage
                  )}
                />
              )
            )}
          </div>
        </DndContext>
      </div>

      {/* MOBILE PIPELINE */}
      <div className="space-y-4 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stages.map(
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
                    mobileStage ===
                    stage
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                  }
                `}
              >
                {title} (
                {
                  deals.filter(
                    (deal) =>
                      deal.stage ===
                      stage
                  ).length
                }
                )
              </button>
            )
          )}
        </div>

        <div className="space-y-4">
          {mobileDeals.map(
            (deal) => (
              <DealCard
                key={
                  deal.id
                }
                deal={
                  deal
                }
              />
            )
          )}

          {mobileDeals.length ===
            0 && (
            <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
              No deals in this
              stage.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
