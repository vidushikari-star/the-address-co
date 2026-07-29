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
}:Props){


  const searchParams =
    useSearchParams()



  const isHotFilter =
    searchParams.get("filter") === "hot"




  const [
    search,
    setSearch,
  ] =
  useState("")



  const [
    stage,
    setStage,
  ] =
  useState("all")



  const [
    priority,
    setPriority,
  ] =
  useState("all")







  const filteredDeals =
    useMemo(
      ()=>{


        return deals.filter(
          deal=>{


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
                .includes(
                  searchText
                )



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








  const stages = [

    {
      value:"all",
      label:"All",
    },

    {
      value:"lead",
      label:"Lead",
    },

    {
      value:"qualification",
      label:"Qualification",
    },

    {
      value:"property_shared",
      label:"Shared",
    },

    {
      value:"site_visit",
      label:"Visit",
    },

    {
      value:"negotiation",
      label:"Negotiation",
    },

    {
      value:"documentation",
      label:"Docs",
    },

    {
      value:"closed_won",
      label:"Won",
    },

    {
      value:"closed_lost",
      label:"Lost",
    },

  ]







  const priorities = [

    {
      value:"all",
      label:"All",
    },

    {
      value:"high",
      label:"High",
    },

    {
      value:"medium",
      label:"Medium",
    },

    {
      value:"low",
      label:"Low",
    },

  ]







  return (

    <div className="
      space-y-5
    ">





      {
        isHotFilter && (

          <div className="
            rounded-xl
            bg-muted
            px-4
            py-3
            text-sm
          ">

            Showing hot opportunities requiring attention.

          </div>

        )
      }








      <div className="
        flex
        items-center
        justify-between
      ">


        <p className="
          text-sm
          text-muted-foreground
        ">

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

              onClick={
                clearFilters
              }

              className="
                text-sm
                text-primary
              "

            >

              Clear

            </button>

          )
        }


      </div>








      <input

        className="
          w-full
          rounded-xl
          border
          px-4
          py-3
          text-sm
        "

        placeholder="Search deals..."

        value={
          search
        }

        onChange={
          e =>
            setSearch(
              e.target.value
            )
        }

      />









      <div>


        <p className="
          mb-2
          text-xs
          text-muted-foreground
        ">

          Stage

        </p>


        <div className="
          flex
          gap-2
          overflow-x-auto
          pb-2
        ">


          {
            stages.map(
              item => (

                <button

                  key={
                    item.value
                  }

                  onClick={() =>
                    setStage(
                      item.value
                    )
                  }

                  className={`
                    shrink-0
                    rounded-full
                    border
                    px-4
                    py-2
                    text-sm
                    ${
                      stage === item.value
                      ?
                      "bg-primary text-primary-foreground"
                      :
                      ""
                    }
                  `}

                >

                  {item.label}

                </button>

              )

            )

          }


        </div>


      </div>








      <div>


        <p className="
          mb-2
          text-xs
          text-muted-foreground
        ">

          Priority

        </p>


        <div className="
          flex
          gap-2
          overflow-x-auto
          pb-2
        ">


          {
            priorities.map(
              item => (

                <button

                  key={
                    item.value
                  }

                  onClick={() =>
                    setPriority(
                      item.value
                    )
                  }

                  className={`
                    shrink-0
                    rounded-full
                    border
                    px-4
                    py-2
                    text-sm
                    ${
                      priority === item.value
                      ?
                      "bg-primary text-primary-foreground"
                      :
                      ""
                    }
                  `}

                >

                  {item.label}

                </button>

              )

            )

          }


        </div>


      </div>









      <DealPipeline

        deals={
          filteredDeals
        }

      />



    </div>

  )

}