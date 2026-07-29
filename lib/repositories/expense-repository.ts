import {
  supabase,
} from "@/lib/supabase/client"

import type {
  Expense,
} from "@/types/expense"

type ExpenseRow = {
  id: string
  date: string
  category: Expense["category"]
  description: string | null
  amount: number | string | null
  payment_method: Expense["paymentMethod"] | null
  status: Expense["status"]
  notes: string | null
  created_by: string | null
  created_at: string
}

function mapExpenseRow(
  row: ExpenseRow
): Expense {
  return {
    id:
      row.id,

    date:
      row.date,

    category:
      row.category,

    description:
      row.description ?? undefined,

    amount:
      Number(
        row.amount ?? 0
      ),

    paymentMethod:
      row.payment_method ?? undefined,

    status:
      row.status,

    notes:
      row.notes ?? undefined,

    createdBy:
      row.created_by ?? undefined,

    createdAt:
      row.created_at,
  }
}

export async function getExpenses(): Promise<Expense[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "expenses"
      )
      .select("*")
      .order(
        "date",
        {
          ascending: false,
        }
      )

  if (error) {
    throw error
  }

  return (
    (data as ExpenseRow[] | null) ??
    []
  ).map(
    mapExpenseRow
  )
}

export async function createExpense(
  expense: Partial<Expense>
): Promise<Expense> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "expenses"
      )
      .insert({
        date:
          expense.date,

        category:
          expense.category,

        description:
          expense.description ?? null,

        amount:
          expense.amount ?? 0,

        payment_method:
          expense.paymentMethod ?? null,

        status:
          expense.status ?? "paid",

        notes:
          expense.notes ?? null,

        created_by:
          expense.createdBy ?? null,
      })
      .select()
      .single()

  if (error) {
    throw error
  }

  return mapExpenseRow(
    data as ExpenseRow
  )
}

export async function updateExpense(
  id: string,
  updates: Partial<Expense>
): Promise<Expense> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "expenses"
      )
      .update({
        date:
          updates.date,

        category:
          updates.category,

        description:
          updates.description,

        amount:
          updates.amount,

        payment_method:
          updates.paymentMethod,

        status:
          updates.status,

        notes:
          updates.notes,
      })
      .eq(
        "id",
        id
      )
      .select()
      .single()

  if (error) {
    throw error
  }

  return mapExpenseRow(
    data as ExpenseRow
  )
}

export async function deleteExpense(
  id: string
): Promise<void> {
  const {
    error,
  } =
    await supabase
      .from(
        "expenses"
      )
      .delete()
      .eq(
        "id",
        id
      )

  if (error) {
    throw error
  }
}