"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  FormDrawer,
} from "@/components/forms/form-drawer"

import {
  Button,
} from "@/components/ui/button"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import {
  createSiteVisit,
} from "@/lib/repositories/site-visit-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  supabase,
} from "@/lib/supabase/client"

import type {
  Property,
} from "@/types/property"



type Advisor = {

  id:string

  name:string

}





type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  onCreated?:()=>void

  dealId:string

  contactId:string

}





export function SiteVisitDrawer({

  open,

  onOpenChange,

  onCreated,

  dealId,

  contactId,

}:Props){


  const [
    properties,
    setProperties,
  ] = useState<Property[]>([])



  const [
    advisors,
    setAdvisors,
  ] = useState<Advisor[]>([])



  const [
    loading,
    setLoading,
  ] = useState(false)



  const [
    form,
    setForm,
  ] = useState({

    propertyId:"",

    date:"",

    time:"",

    notes:"",

  })



  const [
    advisorId,
    setAdvisorId,
  ] = useState("")





  useEffect(()=>{


    async function load(){


      const propertiesData =
        await getProperties()


      setProperties(
        propertiesData
      )



      const {
        data:advisorData,
        error,
      } =
        await supabase
          .from("user_profiles")
          .select(
            "id,name"
          )
          .order(
            "name"
          )



      if(!error){

        setAdvisors(
          advisorData ?? []
        )

      }


    }



    if(open){

      load()

    }


  },[open])







  function update(
    key:string,
    value:string
  ){

    setForm(
      current => ({

        ...current,

        [key]:
          value,

      })
    )

  }







  async function submit(){


    if(
      !form.propertyId ||
      !form.date
    ){

      return

    }



    setLoading(true)



    try{


      await createSiteVisit({

        dealId,

        contactId,

        propertyId:
          form.propertyId,


        scheduledDate:
          form.date,


        scheduledTime:
          form.time,


        notes:
          form.notes,


        advisorId:
          advisorId || undefined,

      })





      const property =
        properties.find(
          item =>
            item.id === form.propertyId
        )





      await createActivity({

        type:
          "site_visit",


        title:
          "Site visit scheduled",


        description:
          property?.name ??
          "Property",


        body:
          `${form.date} ${form.time}

${form.notes || "No notes added"}`,



        dealId,

        contactId,

        propertyId:
          form.propertyId,


        date:
          new Date().toISOString(),

      })





      setForm({

        propertyId:"",

        date:"",

        time:"",

        notes:"",

      })


      setAdvisorId("")



      onOpenChange(false)



      onCreated?.()



    }catch(error){


      console.error(
        "Failed creating site visit",
        error
      )


      alert(
        "Failed creating site visit"
      )


    }finally{

      setLoading(false)

    }

  }







  return (

    <FormDrawer

      open={open}

      onOpenChange={onOpenChange}

      title="Schedule Site Visit"

      description="Create a site visit for this buyer."

    >


      <div className="space-y-5">


        <select

          className="w-full rounded-md border p-2"

          value={
            form.propertyId
          }

          onChange={
            e =>
              update(
                "propertyId",
                e.target.value
              )
          }

        >

          <option value="">
            Select Property
          </option>


          {
            properties.map(
              property => (

                <option

                  key={
                    property.id
                  }

                  value={
                    property.id
                  }

                >

                  {property.name}

                </option>

              )

            )
          }


        </select>





        <input

          type="date"

          className="w-full rounded-md border p-2"

          value={
            form.date
          }

          onChange={
            e =>
              update(
                "date",
                e.target.value
              )
          }

        />





        <input

          type="time"

          className="w-full rounded-md border p-2"

          value={
            form.time
          }

          onChange={
            e =>
              update(
                "date",
                e.target.value
              )
          }

        />





        <select

          className="w-full rounded-md border p-2"

          value={
            advisorId
          }

          onChange={
            e =>
              setAdvisorId(
                e.target.value
              )
          }

        >

          <option value="">
            Assign Advisor
          </option>


          {
            advisors.map(
              advisor => (

                <option

                  key={
                    advisor.id
                  }

                  value={
                    advisor.id
                  }

                >

                  {advisor.name}

                </option>

              )
            )
          }


        </select>





        <textarea

          className="w-full rounded-md border p-2"

          placeholder="Notes"

          value={
            form.notes
          }

          onChange={
            e =>
              update(
                "notes",
                e.target.value
              )
          }

        />





        <Button

          onClick={submit}

          disabled={
            loading
          }

          className="w-full"

        >

          {
            loading
              ? "Saving..."
              : "Schedule Site Visit"
          }

        </Button>


      </div>


    </FormDrawer>

  )

}