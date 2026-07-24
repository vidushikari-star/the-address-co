"use client"


type Props = {

  totalCommission:number

  receivedCommission:number

  pendingCommission:number

  totalExpenses:number

  netCash:number

}





function formatCurrency(
  value:number
){

  return `₹${value.toLocaleString(
    "en-IN"
  )}`

}







export function FinanceSummary({

  totalCommission,

  receivedCommission,

  pendingCommission,

  totalExpenses,

  netCash,

}:Props){



  const cards = [

    {
      title:
        "Total Commission",

      value:
        totalCommission,

    },


    {
      title:
        "Received",

      value:
        receivedCommission,

    },


    {
      title:
        "Pending",

      value:
        pendingCommission,

    },


    {
      title:
        "Expenses",

      value:
        totalExpenses,

    },


    {
      title:
        "Net Cash Position",

      value:
        netCash,

    },

  ]







  return (

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">


      {
        cards.map(
          card => (

            <div

              key={
                card.title
              }

              className="rounded-2xl border p-5"

            >

              <p className="text-sm text-muted-foreground">

                {
                  card.title
                }

              </p>


              <p className="mt-2 text-2xl font-semibold">

                {
                  formatCurrency(
                    card.value
                  )
                }

              </p>


            </div>

          )
        )

      }


    </div>

  )

}