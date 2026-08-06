import Link from "next/link"

import {
  ArrowRight,
  Flame,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"

import {
  Badge,
} from "@/components/ui/badge"



type Lead = {

  id:string

  name:string

  budget:string

  location:string

  intent?:string

  propertyType?:string

  timeline?:string

}





type HotLeadsProps = {

  leads:Lead[]

}





export function HotLeads({
  leads,
}:HotLeadsProps){


  return (

    <DashboardCard>


      <DashboardCardHeader>


        <div>


          <p className="
            flex
            items-center
            gap-2
            text-sm
            font-medium
            tracking-wide
            text-muted-foreground
          ">


            <Flame className="
              h-4
              w-4
            "/>


            Hot Leads


          </p>



          <h3 className="
            mt-2
            text-xl
            font-semibold
            tracking-tight
            sm:text-2xl
          ">

            {leads.length} Hot Opportunities

          </h3>


        </div>


      </DashboardCardHeader>






      <DashboardCardContent>


        {
          leads.length === 0

          ?

          (

            <p className="
              text-sm
              text-muted-foreground
            ">

              No hot leads currently.

            </p>

          )


          :

          (

            <div className="
              space-y-3
            ">


              {
                leads.map(
                  lead => (

                    <Link

                      key={
                        lead.id
                      }

                      href={
                        `/contacts/${lead.id}`
                      }

                      className="block"

                    >


                      <div className="
                        group
                        rounded-2xl
                        border
                        border-border/60
                        bg-muted/20
                        p-4
                        transition
                        hover:border-primary/20
                        hover:bg-background
                      ">



                        <div className="
                          flex
                          items-start
                          justify-between
                          gap-3
                        ">


                          <div className="
                            min-w-0
                          ">


                            <h4 className="
                              truncate
                              font-medium
                            ">

                              {lead.name}

                            </h4>



                            {
                              lead.location && (

                                <p className="
                                  mt-1
                                  text-sm
                                  text-muted-foreground
                                ">

                                  {lead.location}

                                </p>

                              )

                            }


                          </div>




                          <ArrowRight className="
                            h-4
                            w-4
                            shrink-0
                            text-muted-foreground
                            transition-transform
                            group-hover:translate-x-1
                          "/>


                        </div>







                        <div className="
                          mt-3
                          flex
                          flex-wrap
                          gap-2
                        ">



                          {
                            lead.intent && (

                              <Badge
                                variant="secondary"
                              >

                                {
                                  lead.intent === "sale"
                                  ? "Buyer"
                                  : lead.intent === "rental"
                                  ? "Rental"
                                  : "Sale + Rental"
                                }

                              </Badge>

                            )
                          }





                          {
                            lead.propertyType && (

                              <Badge
                                variant="outline"
                              >

                                {lead.propertyType}

                              </Badge>

                            )

                          }





                          {
                            lead.budget && (

                              <Badge
                                variant="outline"
                              >

                                {lead.budget}

                              </Badge>

                            )

                          }



                        </div>






                        {
                          lead.timeline && (

                            <p className="
                              mt-3
                              text-xs
                              text-muted-foreground
                            ">

                              Timeline: {lead.timeline}

                            </p>

                          )

                        }



                      </div>


                    </Link>

                  )

                )

              }


            </div>

          )

        }


      </DashboardCardContent>


    </DashboardCard>

  )

}