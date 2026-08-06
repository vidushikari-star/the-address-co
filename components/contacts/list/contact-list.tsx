"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  ContactCard,
} from "./contact-card"

import {
  ContactHeader,
} from "./contact-header"

import {
  ContactToolbar,
} from "./contact-toolbar"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import type {
  Contact,
} from "@/types/contact"



type Props = {

  stageFilter?: string

}



export function ContactList({
  stageFilter,
}: Props) {


  const [
    contacts,
    setContacts,
  ] =
  useState<Contact[]>([])



  const [
    loading,
    setLoading,
  ] =
  useState(true)



  const [
    query,
    setQuery,
  ] =
  useState("")



  const [
    relationshipFilter,
    setRelationshipFilter,
  ] =
  useState("all")



  const [
    leadSourceFilter,
    setLeadSourceFilter,
  ] =
  useState("all")



  const [
    propertyTypeFilter,
    setPropertyTypeFilter,
  ] =
  useState("all")



  const [
    purposeFilter,
    setPurposeFilter,
  ] =
  useState("all")



  const [
    followUpFilter,
    setFollowUpFilter,
  ] =
  useState("all")





  useEffect(()=>{

    async function loadContacts(){

      try{

        const data =
          await ContactsRepository.getAll()

        setContacts(data)

      }
      finally{

        setLoading(false)

      }

    }


    loadContacts()


  },[])








  const filteredContacts =

    useMemo(()=>{


      return contacts.filter(
        contact => {


          const search =
            query.toLowerCase()



          const matchesSearch =

            !query

            ||

            contact.name
              .toLowerCase()
              .includes(search)

            ||

            (contact.email ?? "")
              .toLowerCase()
              .includes(search)

            ||

            contact.phone
              .includes(query)





          const matchesRelationship =

            relationshipFilter === "all"

            ||

            contact.relationshipTypes?.includes(
              relationshipFilter
            )





          const matchesLeadSource =

            leadSourceFilter === "all"

            ||

            contact.leadSource === leadSourceFilter





          const matchesPropertyType =

            propertyTypeFilter === "all"

            ||

            contact.propertyType === propertyTypeFilter





          const matchesPurpose =

            purposeFilter === "all"

            ||

            contact.purpose === purposeFilter





          const matchesFollowUp =

            followUpFilter === "all"

            ||

            (
              followUpFilter === "new"

              &&

              !contact.lastActivityAt
            )

            ||

            (
              followUpFilter === "due"

              &&

              contact.lastActivityAt

              &&

              (
                Date.now()
                -
                new Date(
                  contact.lastActivityAt
                ).getTime()
              )

              >=

              (
                7 *
                24 *
                60 *
                60 *
                1000
              )
            )





          const matchesStage =

            !stageFilter

            ||

            contact.stage === stageFilter





          return (

            matchesSearch

            &&

            matchesRelationship

            &&

            matchesLeadSource

            &&

            matchesPropertyType

            &&

            matchesPurpose

            &&

            matchesFollowUp

            &&

            matchesStage

          )


        }

      )


    },[

      contacts,

      query,

      relationshipFilter,

      leadSourceFilter,

      propertyTypeFilter,

      purposeFilter,

      followUpFilter,

      stageFilter,

    ])








  function clearFilters(){

    setQuery("")

    setRelationshipFilter("all")

    setLeadSourceFilter("all")

    setPropertyTypeFilter("all")

    setPurposeFilter("all")

    setFollowUpFilter("all")

  }








  return (

    <div className="
      space-y-6
      p-4
      md:p-8
    ">


      <ContactHeader />



      <ContactToolbar

        query={
          query
        }

        onQueryChange={
          setQuery
        }


        relationshipFilter={
          relationshipFilter
        }

        onRelationshipFilterChange={
          setRelationshipFilter
        }


        leadSourceFilter={
          leadSourceFilter
        }

        onLeadSourceFilterChange={
          setLeadSourceFilter
        }


        propertyTypeFilter={
          propertyTypeFilter
        }

        onPropertyTypeFilterChange={
          setPropertyTypeFilter
        }


        purposeFilter={
          purposeFilter
        }

        onPurposeFilterChange={
          setPurposeFilter
        }


        followUpFilter={
          followUpFilter
        }

        onFollowUpFilterChange={
          setFollowUpFilter
        }


        onClear={
          clearFilters
        }


        count={
          filteredContacts.length
        }

      />




      {
        loading ? (

          <div className="
            rounded-2xl
            border
            p-10
            text-center
            text-muted-foreground
          ">

            Loading contacts...

          </div>

        )

        :

        filteredContacts.length === 0 ? (

          <div className="
            rounded-2xl
            border-dashed
            border
            p-10
            text-center
          ">

            No contacts found.

          </div>

        )

        :

        (

          <>

            <p className="
              text-sm
              text-muted-foreground
            ">

              {filteredContacts.length} relationships

            </p>


            <div className="
              space-y-4
            ">

              {
                filteredContacts.map(
                  contact => (

                    <ContactCard

                      key={
                        contact.id
                      }

                      contact={
                        contact
                      }

                    />

                  )
                )
              }

            </div>

          </>

        )

      }


    </div>

  )

}