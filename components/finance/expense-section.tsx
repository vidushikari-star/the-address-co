"use client"

import {
  useState,
} from "react"

import {
  AddExpenseDrawer,
} from "./add-expense-drawer"

import {
  ExpenseTable,
} from "./expense-table"

import type {
  Expense,
} from "@/types/expense"



type Props = {
  expenses:Expense[]
}



export function ExpenseSection({
  expenses,
}:Props){


 const [
  open,
  setOpen,
 ] =
 useState(false)



 return (

  <div className="space-y-4">


   <div className="flex justify-between items-center">

    <h2 className="text-xl font-semibold">
     Expense Ledger
    </h2>


    <button

     onClick={() => setOpen(true)}

     className="rounded-md bg-primary px-4 py-2 text-sm text-white"

    >

     + Add Expense

    </button>


   </div>



   <ExpenseTable
    expenses={expenses}
   />



   <AddExpenseDrawer

    open={open}

    onOpenChange={setOpen}

   />


  </div>

 )

}