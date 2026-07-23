import {
  CircleDollarSign,
  Clock,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"


type Props = {
  total: number
  pending: number
  received: number
  receivedThisMonth: number
}





function formatCr(
  value:number
) {

  return `₹${(
    value / 10000000
  ).toFixed(2)} Cr`

}









export function CommissionStats({

  total,

  pending,

  received,

  receivedThisMonth,

}: Props) {



  const outstanding =
    pending





  const cards = [

    {
      title:
        "Total Commission",

      value:
        formatCr(total),

      icon:
        CircleDollarSign,

    },


    {
      title:
        "Outstanding Collection",

      value:
        formatCr(outstanding),

      icon:
        Clock,

    },


    {
      title:
        "Received",

      value:
        formatCr(received),

      icon:
        CheckCircle2,

    },


    {
      title:
        "Received This Month",

      value:
        formatCr(receivedThisMonth),

      icon:
        CalendarCheck,

    },

  ]







  return (

    <div className="grid gap-5 md:grid-cols-4">


      {
        cards.map(
          card => {

            const Icon =
              card.icon


            return (

              <DashboardCard

                key={
                  card.title
                }

              >

                <DashboardCardHeader>


                  <div>

                    <p className="text-sm text-muted-foreground">

                      {
                        card.title
                      }

                    </p>


                    <h3 className="mt-3 text-4xl font-semibold">

                      {
                        card.value
                      }

                    </h3>


                  </div>




                  <Icon

                    className="h-6 w-6 text-primary"

                  />


                </DashboardCardHeader>



                <DashboardCardContent />


              </DashboardCard>

            )

          }
        )

      }


    </div>

  )

}