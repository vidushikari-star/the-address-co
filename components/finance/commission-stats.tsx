import {
  CircleDollarSign,
  Clock,
  CheckCircle2,
  CalendarCheck,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"

import {
  formatCurrency,
} from "@/lib/utils/format-currency"



type Props = {
  total: number
  pending: number
  received: number
  receivedThisMonth: number
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
        formatCurrency(total),

      icon:
        CircleDollarSign,

    },


    {
      title:
        "Outstanding Collection",

      value:
        formatCurrency(outstanding),

      icon:
        Clock,

    },


    {
      title:
        "Received",

      value:
        formatCurrency(received),

      icon:
        CheckCircle2,

    },


    {
      title:
        "Received This Month",

      value:
        formatCurrency(receivedThisMonth),

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

              </DashboardCard>

            )

          }
        )

      }


    </div>

  )

}
