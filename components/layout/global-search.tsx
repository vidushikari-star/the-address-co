"use client"

import {
  useEffect,
  useState,
} from "react"

import Link from "next/link"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  supabase,
} from "@/lib/supabase/client"

import type {
  Property,
} from "@/types/property"

import type {
  Contact,
} from "@/types/contact"



type Deal = {
  id:string
  name:string
  contact_id:string | null
  stage:string | null
}



export function GlobalSearch() {


  const [
    properties,
    setProperties,
  ] =
  useState<Property[]>([])



  const [
    contacts,
    setContacts,
  ] =
  useState<Contact[]>([])



  const [
    deals,
    setDeals,
  ] =
  useState<Deal[]>([])



  const [
    query,
    setQuery,
  ] =
  useState("")





  useEffect(()=>{


    async function loadData(){


      try {


        const [
          propertyData,
          contactData,
          dealResponse,
        ] =
        await Promise.all([

          getProperties(),

          ContactsRepository.getAll(),

          supabase
            .from("deals")
            .select(
              `
              id,
              name,
              contact_id,
              stage
              `
            )

        ])





        setProperties(
          propertyData
        )


        setContacts(
          contactData
        )


        setDeals(
          dealResponse.data ?? []
        )


      }
      catch(error){

        console.error(
          "Search loading failed",
          error
        )

      }


    }


    loadData()


  },[])





  const q =
    query
      .trim()
      .toLowerCase()





  const filteredContacts =
    q
      ? contacts.filter(
          contact =>

            contact.name
              .toLowerCase()
              .includes(q)

            ||

            (contact.email ?? "")
              .toLowerCase()
              .includes(q)

            ||

            contact.phone
              ?.includes(q)

        )
      : []





  const filteredProperties =
    q
      ? properties.filter(
          property =>
            property.name
              .toLowerCase()
              .includes(q)
        )
      : []





  const filteredDeals =
    q
      ? deals.filter(
          deal =>
            deal.name
              .toLowerCase()
              .includes(q)
        )
      : []






  return (

    <div className="
      relative
      w-full
      max-w-md
    ">


      <input

        value={
          query
        }

        onChange={
          e =>
            setQuery(
              e.target.value
            )
        }

        placeholder="
          Search contacts, properties, deals...
        "

        className="
          w-full
          rounded-lg
          border
          bg-background
          px-3
          py-2
          text-sm
        "

      />





      {
        q && (

          <div className="
            absolute
            z-50
            mt-2
            w-full
            rounded-xl
            border
            bg-background
            shadow-lg
            p-3
            space-y-4
            max-h-96
            overflow-y-auto
          ">




            {
              filteredContacts.length > 0 && (

                <section>

                  <p className="
                    text-xs
                    font-semibold
                    text-muted-foreground
                    mb-2
                  ">
                    Contacts
                  </p>


                  {
                    filteredContacts
                    .slice(0,5)
                    .map(
                      contact => (

                        <Link

                          key={
                            contact.id
                          }

                          href={
                            `/contacts/${contact.id}`
                          }

                          className="
                            block
                            rounded-md
                            px-2
                            py-2
                            hover:bg-muted
                          "

                        >

                          {contact.name}

                        </Link>

                      )
                    )

                  }

                </section>

              )

            }







            {
              filteredProperties.length > 0 && (

                <section>

                  <p className="
                    text-xs
                    font-semibold
                    text-muted-foreground
                    mb-2
                  ">
                    Properties
                  </p>


                  {
                    filteredProperties
                    .slice(0,5)
                    .map(
                      property => (

                        <Link

                          key={
                            property.id
                          }

                          href={
                            `/properties/${property.id}`
                          }

                          className="
                            block
                            rounded-md
                            px-2
                            py-2
                            hover:bg-muted
                          "

                        >

                          {property.name}

                        </Link>

                      )
                    )

                  }

                </section>

              )

            }








            {
              filteredDeals.length > 0 && (

                <section>

                  <p className="
                    text-xs
                    font-semibold
                    text-muted-foreground
                    mb-2
                  ">
                    Deals
                  </p>


                  {
                    filteredDeals
                    .slice(0,5)
                    .map(
                      deal => (

                        <Link

                          key={
                            deal.id
                          }

                          href={
                            `/deals/${deal.id}`
                          }

                          className="
                            block
                            rounded-md
                            px-2
                            py-2
                            hover:bg-muted
                          "

                        >

                          {deal.name}

                        </Link>

                      )
                    )

                  }

                </section>

              )

            }







            {
              filteredContacts.length === 0 &&
              filteredProperties.length === 0 &&
              filteredDeals.length === 0 && (

                <p className="
                  text-sm
                  text-muted-foreground
                  p-2
                ">

                  No results found.

                </p>

              )

            }





          </div>

        )

      }



    </div>

  )

}