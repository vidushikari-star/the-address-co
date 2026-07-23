import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"

import {
  notFound,
} from "next/navigation"

import Link from "next/link"

import {
  updateCommissionAction,
} from "../../actions"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"





export default async function EditCommissionPage(
  {
    params,
  }: {
    params: Promise<{
      id:string
    }>
  }
){


  const {
    id,
  } =
  await params





  const user =
    await getServerUserProfile()





  if(
    !user ||
    user.role !== "admin"
  ){

    return (

      <div className="p-8">

        <h1 className="text-xl font-semibold">
          Access Denied
        </h1>

        <p className="text-muted-foreground">
          Only administrators can edit commissions.
        </p>

      </div>

    )

  }







  const supabase =
    await createServerSupabaseClient()





  const {
    data:commission,
    error,
  } =
  await supabase
    .from("commissions")
    .select("*")
    .eq(
      "id",
      id
    )
    .single()





  if(
    error ||
    !commission
  ){

    notFound()

  }







  const {
    data:advisors,
  } =
  await supabase
    .from("user_profiles")
    .select(
      "id,name"
    )
    .order(
      "name"
    )








  return (

    <div className="space-y-8 p-8">



      <div className="flex justify-between items-center">


        <h1 className="text-3xl font-semibold">

          Edit Commission

        </h1>



        <Link

          href={`/commissions/${id}`}

          className="rounded-md border px-4 py-2 text-sm"

        >

          Cancel

        </Link>


      </div>








      <form

        action={

          async(formData)=>{

            "use server"



            await updateCommissionAction(

              id,

              {

                amount:
  Number(
    formData.get("amount")
  ),


type:
  String(
    formData.get("type")
  ),


commissionBasis:
  String(
    formData.get("commissionBasis") || ""
  ),


commissionPercentage:
  formData.get("commissionPercentage")
    ? Number(
        formData.get("commissionPercentage")
      )
    : undefined,


                advisorId:
                  String(
                    formData.get("advisorId") || ""
                  ),


                status:
                  String(
                    formData.get("status")
                  ),


                dueDate:
                  String(
                    formData.get("dueDate") || ""
                  ),


                notes:
                  String(
                    formData.get("notes") || ""
                  ),


                invoiceNumber:
                  String(
                    formData.get("invoiceNumber") || ""
                  ),


                invoiceDate:
                  String(
                    formData.get("invoiceDate") || ""
                  ),


                paymentMode:
                  String(
                    formData.get("paymentMode") || ""
                  ),


                paymentReference:
                  String(
                    formData.get("paymentReference") || ""
                  ),


                paymentDate:
                  String(
                    formData.get("paymentDate") || ""
                  ),

              }

            )

          }

        }


        className="space-y-6 rounded-2xl border p-6"

      >







        <div>

  <label className="text-sm">
    Commission Type
  </label>


  <select

    name="type"

    defaultValue={
      commission.commission_type ??
      "sale"
    }

    className="mt-2 w-full rounded-md border px-3 py-2"

  >

    <option value="sale">
      Sale
    </option>


    <option value="rental">
      Rental
    </option>


  </select>


</div>









<div>

  <label className="text-sm">
    Commission Basis
  </label>


  <select

    name="commissionBasis"

    defaultValue={
      commission.commission_basis ??
      "fixed"
    }

    className="mt-2 w-full rounded-md border px-3 py-2"

  >

    <option value="fixed">
      Fixed Amount
    </option>


    <option value="percentage">
      Percentage
    </option>


  </select>


</div>









<div>

  <label className="text-sm">
    Commission Percentage
  </label>


  <input

    name="commissionPercentage"

    type="number"

    step="0.01"

    defaultValue={
      commission.commission_percentage ??
      ""
    }

    placeholder="Example: 2.5"

    className="mt-2 w-full rounded-md border px-3 py-2"

  />


</div>









<div>

  <label className="text-sm">
    Commission Amount
  </label>


  <input

    name="amount"

    type="number"

    defaultValue={
      commission.amount
    }

    className="mt-2 w-full rounded-md border px-3 py-2"

  />


</div>









        <div>

          <label className="text-sm">
            Advisor
          </label>


          <select

            name="advisorId"

            defaultValue={
              commission.advisor_id ??
              ""
            }

            className="mt-2 w-full rounded-md border px-3 py-2"

          >


            <option value="">
              Select Advisor
            </option>


            {
              (advisors ?? [])
              .map(
                advisor => (

                  <option

                    key={
                      advisor.id
                    }

                    value={
                      advisor.id
                    }

                  >

                    {
                      advisor.name
                    }

                  </option>

                )
              )
            }


          </select>

        </div>









        <div>

          <label className="text-sm">
            Status
          </label>


          <select

            name="status"

            defaultValue={
              commission.status
            }

            className="mt-2 w-full rounded-md border px-3 py-2"

          >

            <option value="pending">
              Pending
            </option>

            <option value="invoiced">
              Invoiced
            </option>

            <option value="received">
              Received
            </option>

            <option value="cancelled">
              Cancelled
            </option>


          </select>

        </div>









        <div>

          <label className="text-sm">
            Due Date
          </label>


          <input

            name="dueDate"

            type="date"

            defaultValue={
              commission.due_date ?? ""
            }

            className="mt-2 w-full rounded-md border px-3 py-2"

          />

        </div>









        <div>

          <label className="text-sm">
            Invoice Number
          </label>


          <input

            name="invoiceNumber"

            defaultValue={
              commission.invoice_number ?? ""
            }

            className="mt-2 w-full rounded-md border px-3 py-2"

          />

        </div>









        <div>

          <label className="text-sm">
            Invoice Date
          </label>


          <input

            name="invoiceDate"

            type="date"

            defaultValue={
              commission.invoice_date ?? ""
            }

            className="mt-2 w-full rounded-md border px-3 py-2"

          />

        </div>









        <div>

          <label className="text-sm">
            Payment Mode
          </label>


          <input

            name="paymentMode"

            defaultValue={
              commission.payment_mode ?? ""
            }

            placeholder="Bank Transfer / Cheque / Cash"

            className="mt-2 w-full rounded-md border px-3 py-2"

          />

        </div>









        <div>

          <label className="text-sm">
            Payment Reference
          </label>


          <input

            name="paymentReference"

            defaultValue={
              commission.payment_reference ?? ""
            }

            className="mt-2 w-full rounded-md border px-3 py-2"

          />

        </div>









        <div>

          <label className="text-sm">
            Payment Date
          </label>


          <input

            name="paymentDate"

            type="date"

            defaultValue={
              commission.payment_date ?? ""
            }

            className="mt-2 w-full rounded-md border px-3 py-2"

          />

        </div>









        <div>

          <label className="text-sm">
            Notes
          </label>


          <textarea

            name="notes"

            defaultValue={
              commission.notes ?? ""
            }

            className="mt-2 w-full rounded-md border px-3 py-2"

            rows={4}

          />


        </div>








        <button

          type="submit"

          className="rounded-md bg-primary px-5 py-2 text-white"

        >

          Save Changes

        </button>




      </form>


    </div>

  )

}