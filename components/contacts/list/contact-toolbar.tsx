"use client"

import {
  Search,
  X,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"



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





  return (

    <div className="space-y-4">





      <div className="flex flex-wrap items-center justify-between gap-2">


        {
          count !== undefined && (

            <p className="text-sm text-muted-foreground">

              {count} contacts

            </p>

          )
        }





        {
          hasFilters && (

            <Button

              variant="ghost"

              size="sm"

              onClick={clear}

            >

              <X className="mr-2 h-4 w-4"/>

              Clear

            </Button>

          )

        }


      </div>








      <div className="
        flex
        flex-col
        gap-3
        md:flex-row
      ">





        <div className="
          relative
          w-full
          md:max-w-md
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

            value={query}

            onChange={
              e =>
                onQueryChange(
                  e.target.value
                )
            }

            placeholder="Search contacts..."

            className="
              h-11
              rounded-xl
              pl-10
            "

          />


        </div>








        <Select

          value={typeFilter}

          onValueChange={
            value =>
              onTypeFilterChange(
                value ?? "all"
              )
          }

        >


          <SelectTrigger

            className="
              h-11
              w-full
              rounded-xl
              md:w-[180px]
            "

          >

            <SelectValue placeholder="Contact Type"/>


          </SelectTrigger>



          <SelectContent>


            <SelectItem value="all">
              All Contacts
            </SelectItem>


            <SelectItem value="buyer">
              Buyers
            </SelectItem>


            <SelectItem value="seller">
              Sellers
            </SelectItem>


            <SelectItem value="investor">
              Investors
            </SelectItem>


          </SelectContent>


        </Select>




      </div>


    </div>

  )

}