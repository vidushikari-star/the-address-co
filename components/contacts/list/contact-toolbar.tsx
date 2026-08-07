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


  relationshipFilter:string

  onRelationshipFilterChange:(value:string)=>void


  leadSourceFilter:string

  onLeadSourceFilterChange:(value:string)=>void


  propertyTypeFilter:string

  onPropertyTypeFilterChange:(value:string)=>void


  purposeFilter:string

  onPurposeFilterChange:(value:string)=>void


  followUpFilter:string

  onFollowUpFilterChange:(value:string)=>void


  onClear:()=>void


  count?:number

}







export function ContactToolbar({

  query,

  onQueryChange,


  relationshipFilter,

  onRelationshipFilterChange,


  leadSourceFilter,

  onLeadSourceFilterChange,


  propertyTypeFilter,

  onPropertyTypeFilterChange,


  purposeFilter,

  onPurposeFilterChange,


  followUpFilter,

  onFollowUpFilterChange,


  onClear,


  count,

}:ContactToolbarProps){





  const hasFilters =

    query !== ""

    ||

    relationshipFilter !== "all"

    ||

    leadSourceFilter !== "all"

    ||

    propertyTypeFilter !== "all"

    ||

    purposeFilter !== "all"

    ||

    followUpFilter !== "all"







  const relationshipTypes = [

["all","All Relationships"],

["owner","Owner"],

["buyer","Buyer"],

["tenant","Tenant"],

["developer","Developer"],

["broker","Broker"],

["mou_holder","MOU Holder"],

["seller","Seller"],

["investor","Investor"],

["landlord","Landlord"],

]





  const leadSources = [

    ["all","All Sources"],

    ["instagram","Instagram"],

    ["housing","Housing"],

    ["magicbricks","Magicbricks"],

    ["99acres","99Acres"],

    ["website","Website"],

    ["whatsapp","WhatsApp"],

    ["referral","Referral"],

    ["broker","Broker"],

    ["other","Other"],

  ]





  const propertyTypes = [

    ["all","All Property Types"],

    ["villa","Villa"],

    ["apartment","Apartment"],

    ["plot","Plot"],

    ["commercial","Commercial"],

  ]





  const purposes = [

    ["all","All Purposes"],

    ["primary_residence","Primary Residence"],

    ["holiday_home","Holiday Home"],

    ["investment","Investment"],

    ["retirement","Retirement"],

  ]





  const followUpTypes = [

    ["all","All Follow Ups"],

    ["due","Follow Up Due"],

    ["new","Needs Contact"],

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
                onClear
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
        grid
        gap-3
        md:grid-cols-5
      ">


        <select

          value={relationshipFilter}

          onChange={
            e =>
              onRelationshipFilterChange(
                e.target.value
              )
          }

          className="
            rounded-xl
            border
            bg-background
            px-3
            py-2
            text-sm
          "

        >

          {
            relationshipTypes.map(
              item => (

                <option
                  key={item[0]}
                  value={item[0]}
                >

                  {item[1]}

                </option>

              )
            )
          }


        </select>







        <select

          value={leadSourceFilter}

          onChange={
            e =>
              onLeadSourceFilterChange(
                e.target.value
              )
          }

          className="
            rounded-xl
            border
            bg-background
            px-3
            py-2
            text-sm
          "

        >

          {
            leadSources.map(
              item => (

                <option
                  key={item[0]}
                  value={item[0]}
                >

                  {item[1]}

                </option>

              )
            )
          }

        </select>








        <select

          value={propertyTypeFilter}

          onChange={
            e =>
              onPropertyTypeFilterChange(
                e.target.value
              )
          }

          className="
            rounded-xl
            border
            bg-background
            px-3
            py-2
            text-sm
          "

        >

          {
            propertyTypes.map(
              item => (

                <option
                  key={item[0]}
                  value={item[0]}
                >

                  {item[1]}

                </option>

              )
            )
          }

        </select>








        <select

          value={purposeFilter}

          onChange={
            e =>
              onPurposeFilterChange(
                e.target.value
              )
          }

          className="
            rounded-xl
            border
            bg-background
            px-3
            py-2
            text-sm
          "

        >

          {
            purposes.map(
              item => (

                <option
                  key={item[0]}
                  value={item[0]}
                >

                  {item[1]}

                </option>

              )
            )
          }

        </select>








        <select

          value={followUpFilter}

          onChange={
            e =>
              onFollowUpFilterChange(
                e.target.value
              )
          }

          className="
            rounded-xl
            border
            bg-background
            px-3
            py-2
            text-sm
          "

        >

          {
            followUpTypes.map(
              item => (

                <option
                  key={item[0]}
                  value={item[0]}
                >

                  {item[1]}

                </option>

              )
            )
          }

        </select>



      </div>


    </div>

  )

}