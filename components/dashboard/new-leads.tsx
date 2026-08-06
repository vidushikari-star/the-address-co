import Link from "next/link"

import {
  Users,
  ArrowRight,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"



type NewLead = {

  id:string

  name:string

  property?:string

  description?:string

  createdAt:string

  contactId?:string

  phone?:string

  intent?:string

}





type Props = {

  leads:NewLead[]

}






export function NewLeads({
  leads,
}:Props){


  return (

    <div className="
      rounded-2xl
      border
      p-4
      sm:p-6
    ">



      <div className="
        mb-5
        flex
        items-center
        justify-between
      ">


        <div className="
          flex
          items-center
          gap-3
        ">


          <Users size={22}/>


          <h2 className="
            text-xl
            font-semibold
          ">

            New Relationships

          </h2>


        </div>





        <span className="
          rounded-full
          bg-muted
          px-3
          py-1
          text-xs
          font-medium
        ">

          {leads.length}

        </span>


      </div>






      {
        leads.length === 0

        ?

        (

          <p className="
            text-muted-foreground
          ">

            No new relationships yet.

          </p>

        )


        :

        (

          <div className="
            space-y-3
          ">


            {
              leads.map(
                lead => (

                  <div

                    key={
                      lead.id
                    }

                    className="
                      rounded-xl
                      border
                      p-4
                      transition
                      hover:border-primary/30
                    "

                  >


                    <div className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    ">


                      <div className="
                        min-w-0
                      ">


                        <p className="
                          font-semibold
                        ">

                          {lead.name}

                        </p>



                        <p className="
                          mt-1
                          text-sm
                          text-muted-foreground
                        ">

                          Interested in:{" "}

                          {lead.property || "-"}

                        </p>


                      </div>





                      <ArrowRight className="
                        h-4
                        w-4
                        shrink-0
                        text-muted-foreground
                      "/>


                    </div>







                    <div className="
                      mt-3
                      flex
                      flex-wrap
                      gap-2
                    ">


                      {
                        lead.intent && (

                          <Badge
                            variant="secondary"
                          >

                            {
                              lead.intent === "sale"
                              ? "Buyer"
                              : lead.intent === "rental"
                              ? "Rental"
                              : "Sale + Rental"
                            }

                          </Badge>

                        )

                      }





                      {
                        lead.property && (

                          <Badge
                            variant="outline"
                          >

                            {lead.property}

                          </Badge>

                        )

                      }


                    </div>







                    {
                      lead.description && (

                        <p className="
                          mt-3
                          text-sm
                          text-muted-foreground
                        ">

                          {lead.description}

                        </p>

                      )

                    }







                    <p className="
                      mt-3
                      text-xs
                      text-muted-foreground
                    ">

                      Added{" "}

                      {
                        new Date(
                          lead.createdAt
                        ).toLocaleString(
                          "en-IN"
                        )
                      }

                    </p>







                    <div className="
                      mt-4
                      flex
                      flex-wrap
                      gap-3
                    ">


                      {
                        lead.contactId && (

                          <Link

                            href={
                              `/contacts/${lead.contactId}`
                            }

                            className="
                              rounded-md
                              border
                              px-3
                              py-2
                              text-sm
                            "

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

                            className="
                              rounded-md
                              bg-primary
                              px-3
                              py-2
                              text-sm
                              text-white
                            "

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