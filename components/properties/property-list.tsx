"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  PropertyCard,
} from "./property-card"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import type {
  Property,
} from "@/types/property"

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





export function PropertyList() {


  const [
    properties,
    setProperties,
  ] =
  useState<Property[]>([])



  const [
    loading,
    setLoading,
  ] =
  useState(true)



  const [
    search,
    setSearch,
  ] =
  useState("")



  const [
    status,
    setStatus,
  ] =
  useState("all")



  const [
    maxPrice,
    setMaxPrice,
  ] =
  useState("")







  useEffect(() => {


    async function loadProperties(){


      try {


        const data =
          await getProperties()


        setProperties(data)


      } catch(error){


        console.error(
          "Failed loading properties",
          error
        )


      } finally {

        setLoading(false)

      }


    }



    loadProperties()


  }, [])








  const filteredProperties =
    useMemo(
      () => {


        return properties.filter(

          property => {


            const searchText =
              search.toLowerCase()



            const matchesSearch =
              !searchText
              ||
              property.name
                .toLowerCase()
                .includes(searchText)
              ||
              property.locality
                ?.toLowerCase()
                .includes(searchText)
              ||
              property.location
                ?.toLowerCase()
                .includes(searchText)



            const matchesStatus =
              status === "all"
              ||
              property.status === status




            const matchesPrice =
              !maxPrice
              ||
              property.price.asking
              <=
              Number(maxPrice)




            return (
              matchesSearch
              &&
              matchesStatus
              &&
              matchesPrice
            )


          }

        )


      },
      [
        properties,
        search,
        status,
        maxPrice,
      ]
    )







  function clearFilters(){

    setSearch("")

    setStatus("all")

    setMaxPrice("")

  }








  if(loading){

    return (

      <div className="
        rounded-2xl
        border
        p-8
        text-center
        text-muted-foreground
      ">

        Loading properties...

      </div>

    )

  }







  const hasFilters =
    search !== ""
    ||
    status !== "all"
    ||
    maxPrice !== ""







  return (

    <div className="space-y-5">






      <div className="
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">


        <p className="
          text-sm
          text-muted-foreground
        ">

          {filteredProperties.length} properties

        </p>





        {
          hasFilters && (

            <Button

              variant="ghost"

              size="sm"

              onClick={clearFilters}

            >

              Clear Filters

            </Button>

          )

        }


      </div>







      <div className="
  grid
  gap-3
  sm:grid-cols-2
  lg:grid-cols-3
">



        <Input

          className="
            h-11
            rounded-xl
          "

          placeholder="Search property or locality..."

          value={search}

          onChange={
            e =>
              setSearch(
                e.target.value
              )
          }

        />







        <Select

          value={status}

          onValueChange={
  value =>
    setStatus(
      value ?? "all"
    )
}

        >

          <SelectTrigger className="
            h-11
            rounded-xl
          ">

            <SelectValue placeholder="Status"/>

          </SelectTrigger>


          <SelectContent>

            <SelectItem value="all">
              All Status
            </SelectItem>

            <SelectItem value="available">
              Available
            </SelectItem>

            <SelectItem value="viewed">
              Viewed
            </SelectItem>

            <SelectItem value="shortlisted">
              Shortlisted
            </SelectItem>

            <SelectItem value="offer">
              Offer
            </SelectItem>

            <SelectItem value="purchased">
              Purchased
            </SelectItem>

            <SelectItem value="rejected">
              Rejected
            </SelectItem>


          </SelectContent>


        </Select>







        <Input

  className="
    h-11
    rounded-xl
  "

  placeholder="Maximum price (₹)"

  inputMode="numeric"

  value={maxPrice}

  onChange={
    e =>
      setMaxPrice(
        e.target.value.replace(
          /\D/g,
          ""
        )
      )
  }

/>


      </div>








      {
        filteredProperties.length === 0 ? (


          <div className="
            rounded-2xl
            border
            border-dashed
            p-10
            text-center
            text-muted-foreground
          ">

            No properties found.

          </div>



        ) : (



          <div className="space-y-4">


            {
              filteredProperties.map(

                property => (

                  <PropertyCard

                    key={property.id}

                    property={property}

                  />

                )

              )

            }


          </div>


        )

      }


    </div>

  )

}