"use client"

import {
  useMemo,
  useState,
} from "react"

import Link from "next/link"

import {
  Button,
} from "@/components/ui/button"

import {
  Badge,
} from "@/components/ui/badge"

import {
  WhatsAppButton,
} from "@/components/common/whatsapp-button"

import {
  HousingLeadActions,
} from "@/components/housing/housing-lead-actions"



type Props = {
  leads:any[]
}



export function HousingLeadsList({
  leads,
}:Props){


  const [
    filter,
    setFilter,
  ] =
  useState(
    "all"
  )



  const [
    sort,
    setSort,
  ] =
  useState(
    "priority"
  )





  const filteredLeads =
    useMemo(()=>{


      let result =
        [...leads]



      if(filter==="no_activity"){

        result =
          result.filter(
            lead =>
              !lead.lastActivity
          )

      }



      if(filter==="new"){

        result =
          result.filter(
            lead =>
              !lead.dealId
          )

      }



      if(filter==="converted"){

        result =
          result.filter(
            lead =>
              lead.dealId
          )

      }



      if(filter==="matched"){

        result =
          result.filter(
            lead =>
              lead.property
          )

      }




      if(sort === "priority") {

  result.sort(
    (a,b)=>{


      function score(
        lead:any
      ){

        let value = 0


        // no activity = highest priority
        if(!lead.lastActivity){
          value += 100
        }


        // no deal yet
        if(!lead.dealId){
          value += 50
        }


        // no property match
        if(!lead.property){
          value += 25
        }


        // higher budget first
        value +=
          (
            lead.contact?.[0]?.budget_max
            ??
            0
          )
          /
          10000000


        return value

      }



      return score(b) - score(a)

    }
  )

}





      if(sort==="budget"){

        result.sort(
          (a,b)=>
            (
              b.contact?.[0]?.budget_max
              ??
              0
            )
            -
            (
              a.contact?.[0]?.budget_max
              ??
              0
            )
        )

      }



      return result


    },[
      leads,
      filter,
      sort,
    ])







  return (

    <div className="
      space-y-4
    ">



      <div className="
        flex
        flex-wrap
        gap-2
        items-center
        justify-between
      ">


        <div className="
          flex
          flex-wrap
          gap-2
        ">


          {
            [
              ["all","All"],
              ["no_activity","No Activity"],
              ["new","New"],
              ["converted","Converted"],
              ["matched","Matched"],
            ]
            .map(
              ([value,label])=>(

                <Button

                  key={value}

                  size="sm"

                  variant={
                    filter===value
                    ? "default"
                    : "outline"
                  }

                  onClick={() =>
                    setFilter(value)
                  }

                >

                  {label}

                </Button>

              )
            )

          }


        </div>




        <select

          className="
            rounded-md
            border
            px-3
            py-2
            text-sm
          "

          value={sort}

          onChange={
            e =>
              setSort(
                e.target.value
              )
          }

        >

          <option value="priority">
            Priority
          </option>

          <option value="budget">
            Highest Budget
          </option>

        </select>


      </div>







      <div className="
        rounded-2xl
        border
        bg-card
        divide-y
      ">



      {
        filteredLeads.map(
          lead => {


            const contact =
              lead.contact?.[0]



            return (

              <div

                key={
                  lead.id
                }

                className="
                  p-6
                  space-y-4
                "

              >


                <div className="
                  flex
                  justify-between
                  gap-4
                ">


                  <div>


                    <Link

                      href={
                        `/contacts/${contact.id}`
                      }

                      className="
                        text-lg
                        font-semibold
                        hover:underline
                      "

                    >

                      {
                        contact.first_name
                      }{" "}

                      {
                        contact.last_name
                      }


                    </Link>



                    <div className="
                      flex
                      gap-2
                      mt-2
                    ">

                      {
  lead.dealId ? (

    <Badge
      variant="secondary"
    >
      🟢 Active Deal
    </Badge>

  ) : !lead.lastActivity ? (

    <Badge
      variant="destructive"
    >
      🔴 Needs Attention
    </Badge>

  ) : (

    <Badge
      variant="outline"
    >
      🟡 Follow Up
    </Badge>

  )
}


                      {
  lead.property ? (

    <Badge variant="outline">
      🏠 Property Matched
    </Badge>

  ) : (

    <Badge variant="outline">
      🔎 Looking for Match
    </Badge>

  )
}


                    </div>


                  </div>





                  <div className="
  flex
  flex-col
  gap-2
  w-full
  sm:w-auto
  sm:flex-row
">


  <Link
    href={`/contacts/${contact.id}`}
    className="w-full sm:w-auto"
  >

    <Button
      size="sm"
      variant="outline"
      className="w-full sm:w-auto"
    >

      View

    </Button>

  </Link>



  {
    contact.phone && (

      <div className="w-full sm:w-auto">

        <WhatsAppButton

          phone={
            contact.phone
          }

          contactId={
            contact.id
          }

        />

      </div>

    )
  }


</div>


                </div>





                <div className="
                  grid
                  gap-3
                  md:grid-cols-3
                  text-sm
                ">


                  <div>
                    Budget:
                    {" "}
                    {
                      contact.budget_min
                    }
                    {" - "}
                    {
                      contact.budget_max
                    }
                  </div>


                  <div>
                    Location:
                    {" "}
                    {
                      contact.locations?.[0]
                      ??
                      "-"
                    }
                  </div>


                  <div>
                    Last Activity:
                    {" "}
                    {
                      lead.lastActivity
                      ?.title
                      ??
                      "No activity yet"
                    }
                  </div>


                </div>




                <HousingLeadActions

                  contactId={
                    contact.id
                  }

                  dealId={
                    lead.dealId
                    ??
                    undefined
                  }

                  propertyMatched={
                    Boolean(
                      lead.property
                    )
                  }

                />


              </div>

            )

          }
        )

      }


      </div>


    </div>

  )

}