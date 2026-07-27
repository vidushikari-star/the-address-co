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


  const items = [

    {
      label:"Healthy",
      value:data.healthy,
      icon:"🟢",
      description:"On track",
    },


    {
      label:"Needs Attention",
      value:data.attention,
      icon:"🟡",
      description:"Requires follow up",
    },


    {
      label:"At Risk",
      value:data.risk,
      icon:"🔴",
      description:"Immediate action",
    },

  ]





  return (

    <DashboardCard>


      <DashboardCardHeader>


        <div>


          <p className="text-sm text-muted-foreground">
            Deal Health
          </p>



          <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
            {data.total} Active Deals
          </h3>


        </div>


      </DashboardCardHeader>






      <DashboardCardContent>


        <div className="space-y-3">


          {
            items.map(
              item => (

                <div

                  key={item.label}

                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    p-3
                    sm:p-4
                  "

                >


                  <div className="flex items-center gap-3">


                    <span className="text-xl">
                      {item.icon}
                    </span>



                    <div>


                      <p className="text-sm font-medium">

                        {item.label}

                      </p>



                      <p className="text-xs text-muted-foreground">

                        {item.description}

                      </p>


                    </div>


                  </div>





                  <span className="text-xl font-semibold">

                    {item.value}

                  </span>


                </div>

              )

            )

          }


        </div>


      </DashboardCardContent>


    </DashboardCard>

  )

}