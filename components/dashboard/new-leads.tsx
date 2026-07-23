import Link from "next/link"

import {
  Users,
} from "lucide-react"



type Props = {

  leads:any[]

}





export function NewLeads({

  leads,

}:Props){



  return (

    <div className="rounded-2xl border p-6">


      <div className="mb-5 flex items-center gap-3">


        <Users size={22}/>


        <h2 className="text-xl font-semibold">

          New Leads

        </h2>


      </div>





      {
        leads.length === 0 ? (

          <p className="text-muted-foreground">

            No new enquiries yet.

          </p>


        ) : (


          <div className="space-y-4">


            {
              leads.map(

                lead => (

                  <div

                    key={
                      lead.id
                    }

                    className="rounded-xl border p-4"

                  >


                    <div>


                      <p className="font-semibold">

                        {
                          lead.name
                        }

                      </p>



                      <p className="text-sm text-muted-foreground">

                        Interested in:

                        {" "}

                        {
                          lead.property
                        }

                      </p>


                    </div>





                    {
                      lead.description && (

                        <p className="mt-3 text-sm">

                          {
                            lead.description
                          }

                        </p>

                      )

                    }





                    <p className="mt-2 text-xs text-muted-foreground">

                      {
                        new Date(
                          lead.createdAt
                        ).toLocaleString(
                          "en-IN"
                        )
                      }

                    </p>





                    <div className="mt-4 flex gap-3">


                      {
                        lead.contactId && (

                          <Link

                            href={
                              `/contacts/${lead.contactId}`
                            }

                            className="rounded-md border px-3 py-2 text-sm"

                          >

                            View Contact

                          </Link>

                        )

                      }





                      {
                        lead.phone && (

                          <a

                            href={
                              `https://wa.me/${lead.phone.replace(/\D/g,"")}`
                            }

                            target="_blank"

                            rel="noopener noreferrer"

                            className="rounded-md bg-primary px-3 py-2 text-sm text-white"

                          >

                            WhatsApp

                          </a>

                        )

                      }


                    </div>


                  </div>


                )

              )

            }


          </div>


        )

      }


    </div>

  )

}