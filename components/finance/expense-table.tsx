"use client"

import type {
  Expense,
} from "@/types/expense"





type Props = {

  expenses:Expense[]

}








function formatCurrency(
  value:number
){

  return `₹${value.toLocaleString(
    "en-IN"
  )}`

}








function formatDate(
  date:string
){

  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day:"2-digit",
      month:"short",
      year:"numeric",
    }
  )

}









export function ExpenseTable({

  expenses,

}:Props){



  if(
    expenses.length === 0
  ){

    return (

      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">

        No expenses recorded.

      </div>

    )

  }







  return (

    <div className="rounded-2xl border overflow-hidden">


      <table className="w-full text-sm">


        <thead className="bg-muted">


          <tr>


            <th className="p-4 text-left">
              Date
            </th>


            <th className="p-4 text-left">
              Category
            </th>


            <th className="p-4 text-left">
              Description
            </th>


            <th className="p-4 text-left">
              Amount
            </th>


            <th className="p-4 text-left">
              Payment
            </th>


            <th className="p-4 text-left">
              Status
            </th>


          </tr>


        </thead>






        <tbody>


          {
            expenses.map(
              expense => (

                <tr

                  key={
                    expense.id
                  }

                  className="border-t"

                >


                  <td className="p-4">

                    {
                      formatDate(
                        expense.date
                      )
                    }

                  </td>





                  <td className="p-4 capitalize">

                    {
                      expense.category
                        .replace(
                          "_",
                          " "
                        )
                    }

                  </td>





                  <td className="p-4">

                    {
                      expense.description
                      ??
                      "-"
                    }

                  </td>





                  <td className="p-4 font-semibold">

                    {
                      formatCurrency(
                        expense.amount
                      )
                    }

                  </td>





                  <td className="p-4 capitalize">

                    {
                      expense.paymentMethod
                        ?.replace(
                          "_",
                          " "
                        )
                      ??
                      "-"
                    }

                  </td>





                  <td className="p-4 capitalize">

                    {
                      expense.status
                    }

                  </td>


                </tr>

              )

            )

          }


        </tbody>


      </table>


    </div>

  )

}