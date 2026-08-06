"use client"


type Props = {

  sources:any[]

}





export function PropertySources({

  sources,

}:Props){



  if(
    !sources ||
    sources.length === 0
  ){

    return null

  }





  return (

    <section className="
      rounded-3xl
      border
      bg-card
      p-6
      space-y-5
    ">


      <h2 className="
        text-lg
        font-semibold
      ">
        Property Sources
      </h2>





      <div className="
        grid
        gap-4
      ">


      {
        sources.map(

          source => (

            <div

              key={
                source.id
              }

              className="
                rounded-xl
                border
                p-4
                space-y-3
              "

            >





              <div className="
                flex
                justify-between
                items-center
              ">


                <span className="
                  font-semibold
                  capitalize
                ">

                  {
                    source.relationshipType
                  }

                </span>



                {
                  source.commission && (

                    <span className="
                      text-sm
                      text-muted-foreground
                    ">

                      {
                        source.commission.percentage
                      }
                      %

                    </span>

                  )
                }


              </div>







              <div>

                <p className="font-medium">

                  {
                    source.contact.name
                  }

                </p>


                {
                  source.contact.phone && (

                    <p className="text-sm text-muted-foreground">

                      {
                        source.contact.phone
                      }

                    </p>

                  )
                }




                {
                  source.contact.email && (

                    <p className="text-sm text-muted-foreground">

                      {
                        source.contact.email
                      }

                    </p>

                  )
                }

              </div>







              {
                source.commission && (

                  <div className="
                    rounded-lg
                    bg-muted
                    p-3
                    text-sm
                  ">


                    Commission:


                    <span className="font-semibold">

                      {" "}

                      {
                        source.commission.percentage
                      }

                      %

                    </span>


                    {
                      source.commission.amount && (

                        <span>

                          {" "}
                          (
                          ₹
                          {
                            Number(
                              source.commission.amount
                            )
                            .toLocaleString(
                              "en-IN"
                            )
                          }
                          )

                        </span>

                      )
                    }


                  </div>

                )
              }





            </div>

          )

        )
      }


      </div>



    </section>

  )

}