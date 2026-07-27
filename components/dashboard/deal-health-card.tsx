import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"



type Props = {

  data:{
    healthy:number
    attention:number
    risk:number
    total:number
  }

}



export function DealHealthCard({
  data,
}:Props){


  return (

    <DashboardCard>


      <DashboardCardHeader>

        <div>

          <p className="text-sm text-muted-foreground">
            Deal Health
          </p>


          <h3 className="mt-2 text-2xl font-semibold">
            {data.total} Active Deals
          </h3>


        </div>

      </DashboardCardHeader>




      <DashboardCardContent className="space-y-3">


        <div className="flex justify-between rounded-xl border p-3">

          <span>
            🟢 Healthy
          </span>

          <span className="font-semibold">
            {data.healthy}
          </span>

        </div>



        <div className="flex justify-between rounded-xl border p-3">

          <span>
            🟡 Needs Attention
          </span>

          <span className="font-semibold">
            {data.attention}
          </span>

        </div>




        <div className="flex justify-between rounded-xl border p-3">

          <span>
            🔴 At Risk
          </span>

          <span className="font-semibold">
            {data.risk}
          </span>

        </div>


      </DashboardCardContent>


    </DashboardCard>

  )

}