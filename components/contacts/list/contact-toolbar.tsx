"use client"

import {
  Search,
  X,
} from "lucide-react"

import {
  Input,
} from "@/components/ui/input"





type ContactToolbarProps = {

  query:string

  onQueryChange:(value:string)=>void

  typeFilter:string

  onTypeFilterChange:(value:string)=>void

  count?:number

}







export function ContactToolbar({

  query,

  onQueryChange,

  typeFilter,

  onTypeFilterChange,

  count,

}:ContactToolbarProps){





  const hasFilters =
    query !== ""
    ||
    typeFilter !== "all"







  function clear(){


    onQueryChange("")


    onTypeFilterChange(
      "all"
    )


  }







  const types = [

    {
      value:"all",
      label:"All",
    },

    {
      value:"buyer",
      label:"Buyers",
    },

    {
      value:"seller",
      label:"Sellers",
    },

    {
      value:"investor",
      label:"Investors",
    },

  ]








  return (

    <div className="
      space-y-4
    ">





      <div className="
        flex
        items-center
        justify-between
      ">


        {
          count !== undefined && (

            <p className="
              text-sm
              text-muted-foreground
            ">

              {count} contacts

            </p>

          )

        }







        {
          hasFilters && (

            <button

              onClick={
                clear
              }

              className="
                flex
                items-center
                gap-1
                text-sm
                text-primary
              "

            >

              <X className="h-4 w-4"/>

              Clear

            </button>

          )

        }


      </div>








      <div className="
        relative
        w-full
      ">


        <Search

          className="
            absolute
            left-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-muted-foreground
          "

        />



        <Input

          value={
            query
          }

          onChange={
            e =>
              onQueryChange(
                e.target.value
              )
          }

          placeholder="Search contacts..."

          className="
            h-12
            rounded-xl
            pl-10
          "

        />


      </div>








      <div className="
        flex
        gap-2
        overflow-x-auto
        pb-2
      ">


        {
          types.map(
            item => (

              <button

                key={
                  item.value
                }

                onClick={() =>
                  onTypeFilterChange(
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
                  transition
                  ${
                    typeFilter === item.value
                    ?
                    "bg-primary text-primary-foreground"
                    :
                    "bg-background"
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

  )

}