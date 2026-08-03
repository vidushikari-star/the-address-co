"use client"

const relationshipTypes = [
  "buyer",
  "seller",
  "investor",
  "tenant",
  "landlord",
  "developer",
  "broker",
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


type ContactFormState = {

  fullName:string

  phone:string

  email:string

  whatsapp:string

  city:string

  country:string

  relationshipTypes:string[]

  leadSource:string

  budgetMin:string

  budgetMax:string

  propertyType:string

  bedrooms:string

  purpose:string

  financing:string

  timeline:string

  locations:string

  mustHave:string

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


  const isBuyerRelated =
    form.relationshipTypes.includes("buyer")
    ||
    form.relationshipTypes.includes("investor")



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
        isBuyerRelated && (

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





            <select

              className="w-full rounded-lg border p-3"

              value={form.propertyType}

              onChange={
                e =>
                  update(
                    "propertyType",
                    e.target.value
                  )
              }

            >

              {
                propertyTypes.map(
                  item => (

                    <option key={item}>
                      {item}
                    </option>

                  )
                )
              }

            </select>





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