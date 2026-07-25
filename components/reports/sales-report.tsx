import {
  ReportCard,
} from "@/components/reports/report-card"


import type {
  Commission,
} from "@/types/commission"





type Props = {

  commissions: Commission[]

}





function money(
  value:number
){

  return `₹${value.toLocaleString("en-IN")}`

}





export function SalesReport({

  commissions,

}:Props){


  const totalDeals =
    commissions.length



  const totalCommission =
    commissions.reduce(
      (
        sum,
        item
      ) =>
        sum + item.amount,
      0
    )



  const completedDeals =
    commissions.filter(
      item =>
        item.status === "received"
    ).length





  return (

    <div className="space-y-4">


      <div className="flex items-center justify-between">


        <h2 className="text-xl font-semibold">
          Sales Report
        </h2>


        <a

  href="/api/reports/sales/export"

  className="rounded-md border px-4 py-2 text-sm"

>

  Download Excel

</a>


      </div>





      <div className="grid gap-4 md:grid-cols-3">


        <ReportCard

          title="Total Deals"

          value={
            totalDeals.toString()
          }

          description="All recorded commission-linked deals"

        />



        <ReportCard

          title="Completed Deals"

          value={
            completedDeals.toString()
          }

          description="Deals with received commission"

        />



        <ReportCard

          title="Commission Generated"

          value={
            money(
              totalCommission
            )
          }

        />


      </div>


    </div>

  )

}