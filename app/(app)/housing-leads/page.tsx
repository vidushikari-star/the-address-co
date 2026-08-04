import {
  getHousingLeads,
} from "@/lib/repositories/housing-lead-repository"

import {
  HousingLeadActions,
} from "@/components/housing/housing-lead-actions"

import {
  HousingSyncButton,
} from "@/components/housing/housing-sync-button"

import {
  WhatsAppButton,
} from "@/components/common/whatsapp-button"



export default async function HousingLeadsPage(){


  const leads =
    await getHousingLeads()



  return (

    <div
      className="
        mx-auto
        max-w-7xl
        space-y-6
        p-6
      "
    >


      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <h1 className="text-3xl font-bold">
          Housing Leads
        </h1>


        <HousingSyncButton />

      </div>





      <div
        className="
          rounded-2xl
          border
          bg-card
        "
      >


        {
          leads.length === 0 ? (

            <p className="p-6 text-muted-foreground">
              No Housing leads yet.
            </p>

          ) : (


            <div className="divide-y">


              {
                leads.map(
                  lead => {


                    const contact =
                      lead.contact?.[0]



                    return (

                      <div
                        key={lead.id}
                        className="
                          p-6
                          space-y-4
                        "
                      >



                        <div
                          className="
                            flex
                            items-start
                            justify-between
                          "
                        >


                          <div>

                            <p className="text-lg font-semibold">

                              {
                                contact?.first_name
                                ??
                                "Unknown Lead"
                              }{" "}

                              {
                                contact?.last_name
                                ??
                                ""
                              }

                            </p>


                            <p className="text-sm text-muted-foreground">

                              {
                                contact?.lead_source
                              }

                            </p>


                          </div>




                          {
                            contact?.phone && (

                              <WhatsAppButton

                                phone={
                                  contact.phone
                                }

                                contactId={
                                  contact.id
                                }

                              />

                            )
                          }



                        </div>







                        <div
                          className="
                            grid
                            gap-3
                            md:grid-cols-3
                            text-sm
                          "
                        >


                          <div>
                            <span className="font-medium">
                              Phone:
                            </span>{" "}
                            {
                              contact?.phone
                              ??
                              "-"
                            }
                          </div>



                          <div>
                            <span className="font-medium">
                              Email:
                            </span>{" "}
                            {
                              contact?.email
                              ??
                              "-"
                            }
                          </div>




                          <div>
                            <span className="font-medium">
                              Location:
                            </span>{" "}
                            {
                              contact?.locations?.[0]
                              ??
                              "-"
                            }
                          </div>




                          <div>
                            <span className="font-medium">
                              Budget:
                            </span>{" "}
                            {
                              contact?.budget_min
                              ??
                              "-"
                            }

                            {" - "}

                            {
                              contact?.budget_max
                              ??
                              "-"
                            }
                          </div>




                          <div>
                            <span className="font-medium">
                              Requirement:
                            </span>{" "}
                            {
                              contact?.property_type
                              ??
                              "-"
                            }
                          </div>




                          <div>
                            <span className="font-medium">
                              Housing ID:
                            </span>{" "}
                            {
                              contact?.housing_lead_id
                              ??
                              "-"
                            }
                          </div>



                        </div>








                        <div
                          className="
                            grid
                            gap-3
                            md:grid-cols-3
                            text-sm
                          "
                        >


                          <div>
                            <span className="font-medium">
                              Status:
                            </span>{" "}

                            {
                              lead.converted
                                ? "Converted"
                                : "New Lead"
                            }

                          </div>





                          {
                            lead.commission && (

                              <>

                                <div>

                                  <span className="font-medium">
                                    Commission:
                                  </span>{" "}

                                  ₹
                                  {
                                    Number(
                                      lead.commission.amount
                                    )
                                    .toLocaleString("en-IN")
                                  }

                                </div>




                                <div>

                                  <span className="font-medium">
                                    Commission Status:
                                  </span>{" "}

                                  {
                                    lead.commission.status
                                  }

                                </div>

                              </>

                            )
                          }



                        </div>








                        <div
                          className="
                            text-sm
                            text-muted-foreground
                          "
                        >

                          Property:

                          {" "}

                          {
                            lead.property?.name
                            ??
                            "Not matched yet"
                          }

                        </div>








                        {
                          contact && (

                            <HousingLeadActions

                              contactId={
                                contact.id
                              }

                              dealId={
    lead.dealId
    ??
    undefined
  }


                              propertyMatched={
                                Boolean(
                                  lead.property?.id
                                )
                              }


                              housingLead={{

                                projectName:
                                  lead.property?.name
                                  ??
                                  undefined,


                                locality:
                                  contact.locations?.[0]
                                  ??
                                  undefined,


                                propertyType:
                                  contact.property_type
                                  ??
                                  undefined,


                                housingId:
                                  contact.housing_lead_id
                                  ??
                                  undefined,

                              }}

                            />

                          )
                        }





                      </div>

                    )

                  }
                )

              }


            </div>


          )

        }


      </div>


    </div>

  )

}