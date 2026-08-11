"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  transitionDealStageAction,
} from "@/lib/actions/deal-actions"

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

  const [
    error,
    setError,
  ] = useState<string | null>(null)





  async function changeStage(
    newStage: DealStage
  ) {


    if (
      newStage === deal.stage
    ) {

      return

    }



    setLoading(true)
    setError(null)



    try {


      const result = await transitionDealStageAction({
        dealId: deal.id,
        stage: newStage,
        contactId: deal.contactId,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }





      router.refresh()



    } catch(error) {


      console.error("Stage update failed", error)
      setError("The deal stage could not be saved. Refresh and try again.")



    } finally {


      setLoading(false)

    }

  }





  return (

    <div className="space-y-1">
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
    {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>

  )

}
