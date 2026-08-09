"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"


import {
  FormDrawer,
} from "@/components/forms/form-drawer"


import {
  Input,
} from "@/components/ui/input"


import {
  Button,
} from "@/components/ui/button"


import {
  createExpense,
} from "@/lib/repositories/expense-repository"


import type {
  ExpenseCategory,
  PaymentMethod,
  ExpenseStatus,
} from "@/types/expense"





type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

}





export function AddExpenseDrawer({

  open,

  onOpenChange,

}:Props){


  const router =
    useRouter()





  const [
    loading,
    setLoading,
  ] =
  useState(false)

  const [
    error,
    setError,
  ] =
  useState<string | null>(null)





  const [
    form,
    setForm,
  ] =
  useState({

    date:
      new Date()
      .toISOString()
      .split("T")[0],

    category:
      "marketing",

    description:
      "",

    amount:
      "",

    paymentMethod:
      "bank_transfer",

    status:
      "paid",

    notes:
      "",

  })









  function update(
    key:string,
    value:string
  ){

    setForm(
      current => ({

        ...current,

        [key]:
          value,

      })
    )

  }









  async function submit(
    e:React.FormEvent
  ){

    e.preventDefault()

    if(
      !form.date ||
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0
    ){

      setError("Enter an expense date and amount greater than zero.")

      return

    }


    setLoading(true)
    setError(null)


    try{


      await createExpense({

        date:
          form.date,


        category:
          form.category as ExpenseCategory,


        description:
          form.description,


        amount:
          Number(
            form.amount
          ),


        paymentMethod:
          form.paymentMethod as PaymentMethod,


        status:
          form.status as ExpenseStatus,


        notes:
          form.notes,

      })





      setForm({

        date:
          new Date()
          .toISOString()
          .split("T")[0],

        category:
          "marketing",

        description:
          "",

        amount:
          "",

        paymentMethod:
          "bank_transfer",

        status:
          "paid",

        notes:
          "",

      })





      onOpenChange(false)

      router.refresh()



    }catch(error){


      console.error(
        "Expense creation failed",
        error
      )


      setError("Unable to save the expense. Please try again.")


    }finally{


      setLoading(false)

    }

  }









  return (

    <FormDrawer

      open={
        open
      }

      onOpenChange={
        onOpenChange
      }

      title="Add Expense"

      description="Record business expense."

    >


      <form

        onSubmit={
          submit
        }

        className="space-y-5"

      >





        <Input

          type="date"

          required

          value={
            form.date
          }

          onChange={
            e =>
              update(
                "date",
                e.target.value
              )
          }

        />







        <select

          className="w-full rounded-lg border p-3"

          value={
            form.category
          }

          onChange={
            e =>
              update(
                "category",
                e.target.value
              )
          }

        >

          <option value="marketing">
            Marketing
          </option>


          <option value="salary">
            Salary
          </option>


          <option value="software">
            Software
          </option>


          <option value="rent">
            Rent
          </option>


          <option value="travel">
            Travel
          </option>


          <option value="office">
            Office
          </option>


          <option value="legal">
            Legal
          </option>


          <option value="professional">
            Professional
          </option>


          <option value="vehicle">
            Vehicle
          </option>


          <option value="other">
            Other
          </option>


        </select>









        <Input

          placeholder="Description"

          value={
            form.description
          }

          onChange={
            e =>
              update(
                "description",
                e.target.value
              )
          }

        />









        <Input

          type="number"

          min="0.01"

          step="0.01"

          placeholder="Amount"

          value={
            form.amount
          }

          onChange={
            e =>
              update(
                "amount",
                e.target.value
              )
          }

          required

        />









        <select

          className="w-full rounded-lg border p-3"

          value={
            form.paymentMethod
          }

          onChange={
            e =>
              update(
                "paymentMethod",
                e.target.value
              )
          }

        >

          <option value="bank_transfer">
            Bank Transfer
          </option>


          <option value="cash">
            Cash
          </option>


          <option value="upi">
            UPI
          </option>


          <option value="card">
            Card
          </option>


          <option value="other">
            Other
          </option>


        </select>









        <select

          className="w-full rounded-lg border p-3"

          value={
            form.status
          }

          onChange={
            e =>
              update(
                "status",
                e.target.value
              )
          }

        >

          <option value="paid">
            Paid
          </option>


          <option value="pending">
            Pending
          </option>


        </select>









        <textarea

          className="min-h-24 w-full rounded-lg border p-3"

          placeholder="Notes"

          value={
            form.notes
          }

          onChange={
            e =>
              update(
                "notes",
                e.target.value
              )
          }

        />









        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button

          type="button"

          variant="outline"

          disabled={loading}

          onClick={() => onOpenChange(false)}

        >

          Cancel

        </Button>

        <Button

          type="submit"

          disabled={
            loading
          }

          className="w-full sm:w-auto"

        >

          {
            loading
              ? "Saving..."
              : "Save Expense"
          }

        </Button>
        </div>


      </form>


    </FormDrawer>

  )

}
