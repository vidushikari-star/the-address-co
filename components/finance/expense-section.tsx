"use client"

import {
  useState,
} from "react"

import {
  Plus,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

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


   <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

    <h2 className="text-xl font-semibold">
     Expense Ledger
    </h2>


    <Button
      className="w-full sm:w-auto"
      onClick={() => setOpen(true)}
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Expense
    </Button>


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
