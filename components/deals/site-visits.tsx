"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import type {
  SiteVisit,
  SiteVisitStatus,
} from "@/types/site-visit"

import type {
  Property,
} from "@/types/property"

import {
  updateSiteVisitWithActivity,
} from "@/lib/services/site-visit-workflow"

import {
  updateDeal,
} from "@/lib/repositories/deal-repository"

import {
  Button,
} from "@/components/ui/button"

import {
EditSiteVisitDialog,
} from "./edit-site-visit-dialog"



type Props = {

  visits: SiteVisit[]

  properties: Property[]

  dealStage?: string

}





export function SiteVisits({
  visits,
  properties,
  dealStage,
}: Props) {

  const router = useRouter()

  const [
editingVisit,
setEditingVisit,
] =
useState<SiteVisit | null>(null)

  const [
    updates,
    setUpdates,
  ] = useState<
    Record<
      string,
      {
        status: SiteVisitStatus
        feedback:string
      }
    >
  >({})





  function currentValue(
    visit:SiteVisit
  ){

    return (

      updates[visit.id] ??

      {

        status:
          visit.status,

        feedback:
          visit.buyerFeedback ?? "",

      }

    )

  }





  function updateField(
  id: string,
  field: "status" | "feedback",
  value: string | SiteVisitStatus
){


    const visit =
      visits.find(
        item =>
          item.id === id
      )



    if(!visit){

      return

    }



    setUpdates(
      current => ({

        ...current,

        [id]:{

          ...currentValue(
            visit
          ),

          [field]:
            value,

        }

      })
    )


  }





  async function save(
    visit:SiteVisit
  ){


    const value =
      currentValue(
        visit
      )



    const property =
      properties.find(
        item =>
          item.id === visit.propertyId
      )



    try {

      await updateSiteVisitWithActivity(
        visit,
        {
          status:
            value.status,

          buyerFeedback:
            value.feedback,

          activityDescription:
            property?.name ??
            "Property",
        }
      )

      if(
        value.status === "completed" &&
        visit.dealId &&
        dealStage !== "negotiation"
      ){

        await updateDeal(

          visit.dealId,

          {

            stage:
              "negotiation",

          }

        )

      }

    } finally {
      // The site-visit write above succeeded, so always show its persisted state.
      router.refresh()
    }


  }





  if(!visits.length){

    return (

      <p className="text-sm text-muted-foreground">

        No site visits scheduled yet.

      </p>

    )

  }





  return (

    <div className="space-y-4">


      {
        visits.map(

          visit => {


            const property =
              properties.find(
                item =>
                  item.id === visit.propertyId
              )


            const value =
              currentValue(
                visit
              )



            return (

              <div

                key={
                  visit.id
                }

                className="rounded-xl border p-5 space-y-4"

              >


                <div>

                  <h3 className="font-semibold">

                    {
                      property?.name ??
                      "Property"
                    }

                  </h3>


                  <p className="text-sm text-muted-foreground">

                    {
                      property?.locality ??
                      ""
                    }

                  </p>

                </div>





                <div className="text-sm">

                  <p>

                    Date:
                    {" "}
                    {visit.scheduledDate}

                  </p>


                  <p>

Time:
{" "}

{
visit.scheduledTime
?
new Date(
`2000-01-01T${visit.scheduledTime}`
)
.toLocaleTimeString(
"en-IN",
{
hour:"2-digit",
minute:"2-digit",
hour12:true,
}
)
:
""
}

</p>

                </div>





                <select

                  className="w-full rounded-md border p-2"

                  value={
                    value.status
                  }

                  onChange={
                    e =>
                      updateField(
                        visit.id,
                        "status",
                        e.target.value as SiteVisitStatus
                      )
                  }

                >

                  <option value="scheduled">
                    Scheduled
                  </option>


                  <option value="completed">
                    Completed
                  </option>


                  <option value="cancelled">
                    Cancelled
                  </option>


                  <option value="rescheduled">
                    Rescheduled
                  </option>


                </select>





                <textarea

                  className="w-full rounded-md border p-2"

                  placeholder="Buyer feedback..."

                  value={
                    value.feedback
                  }

                  onChange={
                    e =>
                      updateField(
                        visit.id,
                        "feedback",
                        e.target.value
                      )
                  }

                />





                <div className="
flex
gap-2
">


<Button

  variant="outline"

  onClick={() =>
    setEditingVisit(
      visit
    )
  }

>

  Edit

</Button>



<Button

  onClick={() =>
    save(
      visit
    )
  }

>

  Update Visit

</Button>


</div>


              </div>

            )


          }

        )

      }

      {
editingVisit && (

<EditSiteVisitDialog

visit={
editingVisit
}

open={
!!editingVisit
}

onOpenChange={
(open)=>{

if(!open){

setEditingVisit(null)

}

}

}

onUpdated={()=>{
window.location.reload()
}}

/>

)
}


    </div>

  )

}
