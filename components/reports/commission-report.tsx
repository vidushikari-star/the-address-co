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





export function CommissionReport({

  commissions,

}:Props){


  const total =
    commissions.reduce(
      (
        sum,
        item
      ) =>
        sum + item.amount,
      0
    )



  const received =
    commissions
      .filter(
        item =>
          item.status === "received"
      )
      .reduce(
        (
          sum,
          item
        ) =>
          sum + item.amount,
        0
      )



  const pending =
    total -
    received





  return (

    <div className="space-y-4">


      <div className="flex items-center justify-between">

        <h2 className="text-xl font-semibold">
          Commission Report
        </h2>


        <a

  href="/api/reports/commission/export"

  className="rounded-md border px-4 py-2 text-sm"

>
  Download Excel
</a>


      </div>





      <div className="grid gap-4 md:grid-cols-3">


        <ReportCard

          title="Total Commission"

          value={
            money(total)
          }

        />


        <ReportCard

          title="Received"

          value={
            money(received)
          }

        />


        <ReportCard

          title="Pending"

          value={
            money(pending)
          }

        />


      </div>


    </div>

  )

}