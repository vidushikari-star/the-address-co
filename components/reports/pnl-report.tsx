import {
  ReportCard,
} from "@/components/reports/report-card"


import type {
  Commission,
} from "@/types/commission"


import type {
  Expense,
} from "@/types/expense"





type Props = {

  commissions:Commission[]

  expenses:Expense[]

}





function money(
 value:number
){

 return `₹${value.toLocaleString("en-IN")}`

}





export function PnLReport({

 commissions,

 expenses,

}:Props){


 const income =
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



 const expenseTotal =
 expenses.reduce(
  (
   sum,
   item
  ) =>
   sum + item.amount,
  0
 )



 const profit =
 income -
 expenseTotal





 return (

  <div className="space-y-4">


   <div className="flex justify-between items-center">


    <h2 className="text-xl font-semibold">
     Profit & Loss
    </h2>


    <a

  href="/api/reports/pnl/export"

  className="rounded-md border px-4 py-2 text-sm"

>
  Download Excel
</a>


   </div>




   <div className="grid gap-4 md:grid-cols-3">


    <ReportCard

     title="Commission Received"

     value={
      money(income)
     }

    />



    <ReportCard

     title="Expenses"

     value={
      money(expenseTotal)
     }

    />



    <ReportCard

     title="Net Profit"

     value={
      money(profit)
     }

    />


   </div>


  </div>

 )

}