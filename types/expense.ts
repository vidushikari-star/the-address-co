export type ExpenseCategory =
  | "marketing"
  | "salary"
  | "software"
  | "rent"
  | "travel"
  | "office"
  | "legal"
  | "professional"
  | "vehicle"
  | "other"



export type ExpenseStatus =
  | "paid"
  | "pending"



export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "upi"
  | "card"
  | "other"





export interface Expense {

  id:string


  date:string


  category:ExpenseCategory


  description?:string


  amount:number


  paymentMethod?:PaymentMethod


  status:ExpenseStatus


  notes?:string


  createdBy?:string


  createdAt:string

}