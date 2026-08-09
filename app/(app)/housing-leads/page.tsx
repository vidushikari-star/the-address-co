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
        p-4
        md:p-8
      "
    >


      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>
          <h1 className="
            text-2xl
            font-bold
            sm:text-3xl
          ">
            Housing Leads
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Import the latest Housing.com enquiries on demand.
          </p>
        </div>


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
