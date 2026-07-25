type Props = {

  totalCommission:number

  receivedCommission:number

  pendingCommission:number

  totalExpenses:number

  netProfit:number

}





function money(
  value:number
){

  return `₹${value.toLocaleString("en-IN")}`

}





function Card({

  title,

  value,

}:{
  title:string
  value:string
}){

  return (

    <div className="rounded-2xl border p-6">

      <p className="text-sm text-muted-foreground">
        {title}
      </p>


      <h3 className="mt-2 text-2xl font-semibold">
        {value}
      </h3>

    </div>

  )

}





export function ReportSummary({

  totalCommission,

  receivedCommission,

  pendingCommission,

  totalExpenses,

  netProfit,

}:Props){


  return (

    <div className="grid gap-4 md:grid-cols-5">


      <Card

        title="Total Commission"

        value={
          money(totalCommission)
        }

      />


      <Card

        title="Received"

        value={
          money(receivedCommission)
        }

      />


      <Card

        title="Pending"

        value={
          money(pendingCommission)
        }

      />


      <Card

        title="Expenses"

        value={
          money(totalExpenses)
        }

      />


      <Card

        title="Net Profit"

        value={
          money(netProfit)
        }

      />


    </div>

  )

}