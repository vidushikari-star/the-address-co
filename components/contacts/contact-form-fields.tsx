"use client"

const relationshipTypes = [
  "buyer",
  "investor",
  "tenant",
  "owner",
  "developer",
  "mou holder",
  "broker",
  "landlord",
]

const leadSources = [
  "instagram",
  "housing",
  "magicbricks",
  "99acres",
  "website",
  "whatsapp",
  "referral",
  "broker",
  "other",
]

const propertyTypes = [
  "villa",
  "apartment",
  "plot",
  "commercial",
]

const purposes = [
  "primary_residence",
  "holiday_home",
  "investment",
  "retirement",
]

const financingOptions = [
  "cash",
  "loan",
  "both",
]

const buyerRoles = [
  "buyer",
  "investor",
  "tenant",
]

const sellerRoles = [
  "owner",
  "developer",
  "mou holder",
  "broker",
]


type ContactFormState = {

  fullName:string

  phone:string

  email:string

  whatsapp:string

  city:string

  country:string

  relationshipTypes:string[]

  leadSource:string

  intent:string

  budgetMin:string

  budgetMax:string

  propertyType:string

  bedrooms:string

  bathrooms:string

  resident:string

  minArea:string

  maxArea:string

  plotSize:string

  purpose:string

  financing:string

  timeline:string

  locations:string

  mustHave:string

  niceToHave:string

  spouseName:string

  coBuyer:string

  referralSource:string

  notes:string

}


type Props = {

  form:ContactFormState

  update:(
    key:string,
    value:string
  )=>void

  toggleRelationship:(
    type:string
  )=>void

}





export function ContactFormFields({
  form,
  update,
  toggleRelationship,
}:Props){

  const selectedRoles =
  form.relationshipTypes.map(
    role =>
      role.toLowerCase()
  )


const isBuyer =
  selectedRoles.some(
    role =>
      buyerRoles.includes(role)
  )


const isSeller =
  selectedRoles.some(
    role =>
      sellerRoles.includes(role)
  )


  const showRequirements =
  isBuyer



  return (

    <>


      <input

        required

        placeholder="Full Name"

        className="w-full rounded-lg border p-3"

        value={form.fullName}

        onChange={
          e =>
            update(
              "fullName",
              e.target.value
            )
        }

      />



      <input

        required

        placeholder="Phone"

        className="w-full rounded-lg border p-3"

        value={form.phone}

        onChange={
          e =>
            update(
              "phone",
              e.target.value
            )
        }

      />



      <input

        placeholder="WhatsApp"

        className="w-full rounded-lg border p-3"

        value={form.whatsapp}

        onChange={
          e =>
            update(
              "whatsapp",
              e.target.value
            )
        }

      />



      <input

        placeholder="Email"

        className="w-full rounded-lg border p-3"

        value={form.email}

        onChange={
          e =>
            update(
              "email",
              e.target.value
            )
        }

      />



      <div>

        <p className="mb-3 text-sm font-medium">
          Relationship Type
        </p>


        <div className="flex flex-wrap gap-2">

          {
            relationshipTypes.map(
              type => (

                <button

                  key={type}

                  type="button"

                  onClick={() =>
                    toggleRelationship(type)
                  }

                  className={
                    form.relationshipTypes.includes(type)

                    ? "rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"

                    : "rounded-full border px-4 py-2 text-sm"
                  }

                >

                  {type}

                </button>

              )
            )
          }

        </div>

      </div>




      <div className="grid gap-4 md:grid-cols-2">


        <input

          placeholder="City"

          className="rounded-lg border p-3"

          value={form.city}

          onChange={
            e =>
              update(
                "city",
                e.target.value
              )
          }

        />


        <input

          placeholder="Country"

          className="rounded-lg border p-3"

          value={form.country}

          onChange={
            e =>
              update(
                "country",
                e.target.value
              )
          }

        />

      </div>




            {
(isBuyer || isSeller) && (

<div>

<label className="
text-sm
font-medium
">

Intent

</label>


<select

className="
mt-2
w-full
rounded-md
border
px-3
py-2
"

value={
form.intent
}

onChange={
e =>
update(
"intent",
e.target.value
)
}

>

<option value="">
Select Intent
</option>


{
isBuyer && (

<>

<option value="sale">
Buy Property
</option>


<option value="rental">
Rent Property
</option>


<option value="both">
Buy / Rent
</option>

</>

)

}



{
isSeller && (

<>

<option value="sale">
Sell Property
</option>


<option value="rental">
Lease Property
</option>

</>

)

}


</select>


</div>

)

}



{
showRequirements && (

<>


            <div className="grid gap-4 md:grid-cols-2">


              <input

                placeholder="Minimum Budget"

                className="rounded-lg border p-3"

                value={form.budgetMin}

                onChange={
                  e =>
                    update(
                      "budgetMin",
                      e.target.value
                    )
                }

              />


              <input

                placeholder="Maximum Budget"

                className="rounded-lg border p-3"

                value={form.budgetMax}

                onChange={
                  e =>
                    update(
                      "budgetMax",
                      e.target.value
                    )
                }

              />

            </div>













            {
  isBuyer && (

    <select

      className="
        w-full
        rounded-lg
        border
        p-3
      "

      value={
        form.propertyType
      }

      onChange={
        e =>
          update(
            "propertyType",
            e.target.value
          )
      }

    >

      <option value="">
        Property Type
      </option>


      {
        propertyTypes.map(
          item => (

            <option
              key={item}
              value={item}
            >

              {item}

            </option>

          )
        )
      }


    </select>

  )
}





            <input

              placeholder="Bedrooms"

              className="w-full rounded-lg border p-3"

              value={form.bedrooms}

              onChange={
                e =>
                  update(
                    "bedrooms",
                    e.target.value
                  )
              }

            />





            <select

              className="w-full rounded-lg border p-3"

              value={form.purpose}

              onChange={
                e =>
                  update(
                    "purpose",
                    e.target.value
                  )
              }

            >

              <option value="">
                Purpose
              </option>

              {
  purposes.map(
    item => (

      <option
        key={item}
        value={item}
      >

        {item}

      </option>

    )
  )
}

            </select>





            <select

              className="w-full rounded-lg border p-3"

              value={form.financing}

              onChange={
                e =>
                  update(
                    "financing",
                    e.target.value
                  )
              }

            >

              <option value="">
                Financing
              </option>

              {
  financingOptions.map(
    item => (

      <option
        key={item}
        value={item}
      >

        {item}

      </option>

    )
  )
}

            </select>





            <input

              placeholder="Preferred Locations (comma separated)"

              className="w-full rounded-lg border p-3"

              value={form.locations}

              onChange={
                e =>
                  update(
                    "locations",
                    e.target.value
                  )
              }

            />





            <input

              placeholder="Must have features"

              className="w-full rounded-lg border p-3"

              value={form.mustHave}

              onChange={
                e =>
                  update(
                    "mustHave",
                    e.target.value
                  )
              }

            />

            <>

<input
placeholder="Bathrooms"
className="w-full rounded-lg border p-3"
value={form.bathrooms}
onChange={
e =>
update(
"bathrooms",
e.target.value
)
}
/>


<input
placeholder="Resident (India / NRI etc.)"
className="w-full rounded-lg border p-3"
value={form.resident}
onChange={
e =>
update(
"resident",
e.target.value
)
}
/>

</>


          </>

        )

      }





      <select

        className="w-full rounded-lg border p-3"

        value={form.leadSource}

        onChange={
          e =>
            update(
              "leadSource",
              e.target.value
            )
        }

      >

        {
          leadSources.map(
            source => (

              <option key={source}>
                {source}
              </option>

            )
          )
        }

      </select>





<div className="grid gap-4 md:grid-cols-3">

  <input
    placeholder="Min Area"
    className="rounded-lg border p-3"
    value={form.minArea}
    onChange={
      e =>
        update(
          "minArea",
          e.target.value
        )
    }
  />


  <input
    placeholder="Max Area"
    className="rounded-lg border p-3"
    value={form.maxArea}
    onChange={
      e =>
        update(
          "maxArea",
          e.target.value
        )
    }
  />


  <input
    placeholder="Plot Size"
    className="rounded-lg border p-3"
    value={form.plotSize}
    onChange={
      e =>
        update(
          "plotSize",
          e.target.value
        )
    }
  />

</div>


<input
  placeholder="Nice to have"
  className="w-full rounded-lg border p-3"
  value={form.niceToHave}
  onChange={
    e =>
      update(
        "niceToHave",
        e.target.value
      )
  }
/>


<input
  placeholder="Spouse Name"
  className="w-full rounded-lg border p-3"
  value={form.spouseName}
  onChange={
    e =>
      update(
        "spouseName",
        e.target.value
      )
  }
/>


<input
  placeholder="Co Buyer"
  className="w-full rounded-lg border p-3"
  value={form.coBuyer}
  onChange={
    e =>
      update(
        "coBuyer",
        e.target.value
      )
  }
/>


<input
  placeholder="Referral Source"
  className="w-full rounded-lg border p-3"
  value={form.referralSource}
  onChange={
    e =>
      update(
        "referralSource",
        e.target.value
      )
  }
/>

      <input

        placeholder="Timeline"

        className="w-full rounded-lg border p-3"

        value={form.timeline}

        onChange={
          e =>
            update(
              "timeline",
              e.target.value
            )
        }

      />





      <textarea

       placeholder="Add a new note..."

        className="w-full rounded-lg border p-3"

        value={form.notes}

        onChange={
          e =>
            update(
              "notes",
              e.target.value
            )
        }

      />

    </>

  )

}