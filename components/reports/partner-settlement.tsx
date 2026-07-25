import {
  ReportCard,
} from "@/components/reports/report-card"


import type {
  CommissionDistribution,
} from "@/types/commission-distribution"





type Props = {

  distributions: CommissionDistribution[]

}





function money(
  value:number
){

  return `₹${value.toLocaleString("en-IN")}`

}





export function PartnerSettlement({

  distributions,

}:Props){


  const total =
    distributions.reduce(
      (
        sum,
        item
      ) =>
        sum + item.amount,
      0
    )



  const paid =
    distributions
      .filter(
        item =>
          item.status === "paid"
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
    paid





  return (

    <div className="space-y-4">


      <div className="flex items-center justify-between">

        <h2 className="text-xl font-semibold">
          Partner Settlement
        </h2>


        <a

  href="/api/reports/settlement/export"

  className="rounded-md border px-4 py-2 text-sm"

>

  Download Excel

</a>


      </div>




      <div className="grid gap-4 md:grid-cols-3">


        <ReportCard

          title="Total Payable"

          value={
            money(total)
          }

        />


        <ReportCard

          title="Paid"

          value={
            money(paid)
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