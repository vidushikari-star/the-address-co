import { ArrowRight } from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"


type PipelineStage = {
  title: string
  count: number
}


type PipelineCardProps = {
  stages: PipelineStage[]
}



export function PipelineCard({
  stages,
}: PipelineCardProps) {


  const totalDeals =
    stages.reduce(
      (sum, stage) =>
        sum + stage.count,
      0
    )


  const maxCount =
    Math.max(
      ...stages.map(
        stage => stage.count
      ),
      1
    )



  return (

    <DashboardCard className="h-full">


      <DashboardCardHeader>

        <div>

          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            Deals Pipeline
          </p>


          <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {totalDeals} Active Deals
          </h3>


        </div>



        <ArrowRight className="h-5 w-5 text-muted-foreground" />


      </DashboardCardHeader>





      <DashboardCardContent className="space-y-6">


        {/* Summary Cards */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">


          <SummaryCard
            title="Active Clients"
            value="42"
            subtitle="6 added this month"
          />



          <SummaryCard
            title="Live Inventory"
            value="₹52 Cr"
            subtitle="Across 31 listings"
          />



          <SummaryCard
            title="Commission Potential"
            value="₹1.84 Cr"
            subtitle="From active deals"
          />


        </div>





        {/* Pipeline */}

        <div className="space-y-4">


          {stages.map(
            (stage) => {


              const width =
                (stage.count / maxCount) * 100



              return (

                <div
                  key={stage.title}
                >


                  <div className="mb-2 flex items-center justify-between">


                    <span className="text-sm font-medium">
                      {stage.title}
                    </span>



                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                      {stage.count}
                    </span>


                  </div>




                  <div className="h-2 overflow-hidden rounded-full bg-muted">

                    <div

                      className="h-full rounded-full bg-primary transition-all duration-700"

                      style={{
                        width:`${width}%`,
                      }}

                    />


                  </div>


                </div>

              )


            }

          )}


        </div>



      </DashboardCardContent>


    </DashboardCard>

  )

}






function SummaryCard({
  title,
  value,
  subtitle,
}:{
  title:string
  value:string
  subtitle:string
}){


  return (

    <div

      className="
        rounded-2xl
        border
        border-border/60
        bg-muted/30
        p-3
sm:p-5
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-primary/20
        hover:bg-background
      "

    >


      <p className="
        text-[11px]
        font-medium
        uppercase
        tracking-[0.15em]
        text-muted-foreground
      ">

        {title}

      </p>



      <p className="
        mt-3
        text-2xl
        font-semibold
        tracking-tight
        sm:text-3xl
      ">

        {value}

      </p>




      <p className="
        mt-1
        text-sm
        text-muted-foreground
      ">

        {subtitle}

      </p>


    </div>

  )

}