import {
  getHousingLeads,
} from "@/lib/repositories/housing-lead-repository"

import {
  HousingSyncButton,
} from "@/components/housing/housing-sync-button"

import {
  HousingLeadsList,
} from "@/components/housing/housing-leads-list"



export default async function HousingLeadsPage(){


  const leads =
    await getHousingLeads()



  return (

    <div
      className="
        mx-auto
        max-w-7xl
        space-y-6
        p-6
      "
    >


      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <h1 className="
          text-3xl
          font-bold
        ">
          Housing Leads
        </h1>


        <HousingSyncButton />


      </div>





      {
        leads.length === 0 ? (

          <div className="
            rounded-2xl
            border
            p-6
            text-muted-foreground
          ">

            No Housing leads yet.

          </div>


        ) : (


          <HousingLeadsList
            leads={leads}
          />


        )

      }


    </div>

  )

}