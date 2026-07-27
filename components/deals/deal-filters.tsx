"use client"

import {
  useMemo,
  useState,
} from "react"

import {
  useSearchParams,
} from "next/navigation"

import type {
  Deal,
} from "@/types/deal"

import {
  DealPipeline,
} from "@/components/deals/deal-pipeline"



type Props = {
  deals: Deal[]
}





export function DealFilters({
  deals,
}: Props) {


  const searchParams =
    useSearchParams()



  const isHotFilter =
    searchParams.get("filter") === "hot"




  const [
    search,
    setSearch,
  ] = useState("")



  const [
    stage,
    setStage,
  ] = useState("all")



  const [
    priority,
    setPriority,
  ] = useState("all")






  const filteredDeals =
    useMemo(
      () => {


        return deals.filter(
          deal => {


            const active =
              deal.stage !== "closed_won"
              &&
              deal.stage !== "closed_lost"



            const hot =
              deal.priority === "high"
              ||
              deal.stage === "negotiation"
              ||
              deal.stage === "documentation"
              ||
              deal.stage === "site_visit"



            const matchesHot =
              !isHotFilter
              ||
              (
                active &&
                hot
              )



            const searchText =
              search.toLowerCase()



            const matchesSearch =
              !searchText
              ||
              deal.name
                .toLowerCase()
                .includes(searchText)



            const matchesStage =
              stage === "all"
              ||
              deal.stage === stage




            const matchesPriority =
              priority === "all"
              ||
              deal.priority === priority



            return (
              matchesHot
              &&
              matchesSearch
              &&
              matchesStage
              &&
              matchesPriority
            )

          }
        )


      },
      [
        deals,
        search,
        stage,
        priority,
        isHotFilter,
      ]
    )






  function clearFilters(){

    setSearch("")
    setStage("all")
    setPriority("all")

  }





  return (

    <div className="space-y-5">


      {
        isHotFilter && (

          <div className="rounded-xl bg-muted px-4 py-3 text-sm">

            Showing hot opportunities requiring attention.

          </div>

        )
      }






      <div className="flex items-center justify-between">


        <p className="text-sm text-muted-foreground">

          {filteredDeals.length} deals

        </p>




        {
          (
            search
            ||
            stage !== "all"
            ||
            priority !== "all"
          ) && (

            <button

              onClick={clearFilters}

              className="text-sm text-primary"

            >

              Clear filters

            </button>

          )
        }


      </div>






      <div className="
        grid
        gap-3
        sm:grid-cols-3
      ">


        <input

          className="
            rounded-xl
            border
            px-3
            py-3
            text-sm
          "

          placeholder="Search deals..."

          value={search}

          onChange={
            e =>
              setSearch(
                e.target.value
              )
          }

        />






        <select

          className="
            rounded-xl
            border
            px-3
            py-3
            text-sm
          "

          value={stage}

          onChange={
            e =>
              setStage(
                e.target.value
              )
          }

        >

          <option value="all">
            All Stages
          </option>

          <option value="lead">
            Lead
          </option>

          <option value="qualification">
            Qualification
          </option>

          <option value="property_shared">
            Property Shared
          </option>

          <option value="site_visit">
            Site Visit
          </option>

          <option value="negotiation">
            Negotiation
          </option>

          <option value="documentation">
            Documentation
          </option>

          <option value="closed_won">
            Closed Won
          </option>

          <option value="closed_lost">
            Closed Lost
          </option>

        </select>







        <select

          className="
            rounded-xl
            border
            px-3
            py-3
            text-sm
          "

          value={priority}

          onChange={
            e =>
              setPriority(
                e.target.value
              )
          }

        >


          <option value="all">
            All Priorities
          </option>


          <option value="high">
            High
          </option>


          <option value="medium">
            Medium
          </option>


          <option value="low">
            Low
          </option>


        </select>



      </div>






      <DealPipeline

        deals={
          filteredDeals
        }

      />


    </div>

  )

}