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



export function PropertyList() {


  const [
    properties,
    setProperties,
  ] = useState<Property[]>([])



  const [
    loading,
    setLoading,
  ] = useState(true)



  const [
    search,
    setSearch,
  ] = useState("")



  const [
    status,
    setStatus,
  ] = useState("all")



  const [
    maxPrice,
    setMaxPrice,
  ] = useState("")





  useEffect(() => {


    async function loadProperties() {


      try {


        const data =
          await getProperties()


        setProperties(
          data
        )


      } catch(error) {


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
              Number(
                maxPrice
              )



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







  if (loading) {

    return (

      <div className="rounded-xl border p-10 text-center">

        Loading properties...

      </div>

    )

  }







  return (

    <div className="space-y-5">


      <div className="grid gap-3 md:grid-cols-3">


        <input

          className="rounded-lg border px-3 py-2"

          placeholder="Search property or locality..."

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





        <select

          className="rounded-lg border px-3 py-2"

          value={
            status
          }

          onChange={
            e =>
              setStatus(
                e.target.value
              )
          }

        >

          <option value="all">
            All Status
          </option>


          <option value="available">
            Available
          </option>


          <option value="viewed">
            Viewed
          </option>


          <option value="shortlisted">
            Shortlisted
          </option>


          <option value="offer">
            Offer
          </option>


          <option value="purchased">
            Purchased
          </option>


          <option value="rejected">
            Rejected
          </option>


        </select>





        <input

          className="rounded-lg border px-3 py-2"

          placeholder="Maximum price"

          value={
            maxPrice
          }

          onChange={
            e =>
              setMaxPrice(
                e.target.value
              )
          }

        />


      </div>







      {
        filteredProperties.length === 0 ? (

          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">

            No properties found.

          </div>

        ) : (


          <div className="space-y-5">


            {
              filteredProperties.map(

                property => (

                  <PropertyCard

                    key={
                      property.id
                    }

                    property={
                      property
                    }

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