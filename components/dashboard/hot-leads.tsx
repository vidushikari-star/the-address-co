import Link from "next/link"

import {
  ArrowUpRight,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"



type Lead = {
  name: string
  budget: string
  location: string
  stage: string
}



type HotLeadsProps = {
  leads: Lead[]
}





export function HotLeads({
  leads,
}: HotLeadsProps) {


  return (

    <Link

      href="/deals?filter=hot"

      className="block"

    >

      <DashboardCard

        className="
          h-full
          cursor-pointer
          transition
          hover:border-primary/30
        "

      >


        <DashboardCardHeader>

          <div>

            <p className="text-sm font-medium tracking-wide text-muted-foreground">

              Hot Leads

            </p>



            <h3 className="mt-2 text-2xl font-semibold tracking-tight">

              {leads.length} Priority Clients

            </h3>


          </div>


        </DashboardCardHeader>





        <DashboardCardContent className="space-y-4">


          {leads.map((lead) => (

            <div

              key={lead.name}

              className="
                group
                rounded-2xl
                border
                border-border/60
                bg-muted/20
                p-4
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:border-primary/20
                hover:bg-background
              "

            >


              <div className="flex items-start justify-between">


                <div>


                  <h4 className="font-medium">

                    {lead.name}

                  </h4>



                  <p className="mt-1 text-sm text-muted-foreground">

                    {lead.location}

                  </p>


                </div>




                <ArrowUpRight

                  className="
                    h-4 w-4
                    text-muted-foreground
                    transition-transform
                    group-hover:translate-x-0.5
                    group-hover:-translate-y-0.5
                  "

                />


              </div>





              <div className="mt-4 flex items-center justify-between text-sm">


                <div>


                  <p className="text-xs uppercase tracking-wide text-muted-foreground">

                    Budget

                  </p>



                  <p className="mt-1 font-medium">

                    {lead.budget}

                  </p>


                </div>





                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">

                  {lead.stage}

                </span>


              </div>


            </div>


          ))}


        </DashboardCardContent>


      </DashboardCard>


    </Link>

  )

}