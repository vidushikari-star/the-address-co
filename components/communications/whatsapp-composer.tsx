"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import type { Contact } from "@/types"

import {
  listWhatsAppTemplates,
  incrementTemplateUsage,
  getCurrentAdvisor,
  rewriteWhatsAppMessage,
} from "@/app/(app)/communications/actions"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Textarea } from "@/components/ui/textarea"

import {
  renderTemplate,
} from "@/lib/communications/render-template"



type Template = {

  id: string

  title: string

  body: string

  category: string

  channel: string

}





type Advisor = {

  id: string

  full_name: string

  email: string

}





interface WhatsAppComposerProps {

  open: boolean

  onOpenChange: (
    open:boolean
  ) => void

  contact: Contact

  initialMessage?: string

}







export function WhatsAppComposer({

  open,

  onOpenChange,

  contact,

  initialMessage,

}: WhatsAppComposerProps) {



  const [
    templates,
    setTemplates,
  ] =
  useState<Template[]>([])



  const [
    advisor,
    setAdvisor,
  ] =
  useState<Advisor | null>(null)



  const [
    loading,
    setLoading,
  ] =
  useState(false)



  const [
    rewriting,
    setRewriting,
  ] =
  useState(false)



  const [
    selected,
    setSelected,
  ] =
  useState<Template | null>(null)



  const [
    search,
    setSearch,
  ] =
  useState("")



  const [
    message,
    setMessage,
  ] =
  useState("")





  useEffect(() => {


    if (!open)
      return



    async function loadData() {


      setLoading(true)


      try {


        const [
          templateData,
          advisorData,
        ] =
        await Promise.all([

          listWhatsAppTemplates(),

          getCurrentAdvisor(),

        ])




        setTemplates(
          templateData as Template[]
        )



        setAdvisor(
          advisorData
        )


      }
      finally {


        setLoading(false)


      }


    }



    loadData()



  }, [open])







  useEffect(() => {


    if (!open)
      return



    if (initialMessage) {


      setSelected({

        id:
          "property-share",

        title:
          "Property Share",

        body:
          initialMessage,

        category:
          "Property",

        channel:
          "whatsapp",

      })


      setMessage(
        initialMessage
      )

    }



  }, [
    open,
    initialMessage,
  ])







  const filteredTemplates =
    useMemo(() => {


      return templates.filter(
        (template) =>

          template.title
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )

      )


    }, [
      templates,
      search,
    ])







  function selectTemplate(
    template:Template
  ) {


    setSelected(
      template
    )



    setMessage(

      renderTemplate(
        template.body,
        {
          contact,
          advisor,
        }
      )

    )


  }







  async function rewriteMessage(

    tone:
      | "formal"
      | "warm"
      | "concise"
      | "luxury"

  ) {


    setRewriting(true)


    try {


      const updated =

        await rewriteWhatsAppMessage(
          message,
          tone
        )



      setMessage(
        updated
      )


    }
    finally {


      setRewriting(false)


    }


  }







  function changeTemplate() {


    setSelected(null)

    setMessage("")


  }







  async function sendTemplate() {


    if (!selected && !message)
      return




    const phone = (

      contact.whatsapp ??

      contact.phone ??

      ""

    ).replace(/\D/g, "")





    if (
      selected &&
      selected.id !== "property-share"
    ) {


      await incrementTemplateUsage(
        selected.id
      )

    }






    await createActivity({

      type:
        "whatsapp",


      title:
        selected?.title ??
        "Property Share",


      body:
        message,


      contactId:
        contact.id,


      date:
        new Date().toISOString(),

    })






    window.open(

      `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`,

      "_blank"

    )



    onOpenChange(false)


  }







  function resetComposer() {


    setSelected(null)

    setMessage("")

    setSearch("")

    setAdvisor(null)


  }







  return (


    <Sheet

      open={
        open
      }


      onOpenChange={
        (value)=>{


          if(!value){

            resetComposer()

          }


          onOpenChange(
            value
          )


        }
      }

    >


      <SheetContent
        className="
          sm:max-w-xl
        "
      >


        <SheetHeader>


          <SheetTitle>

            Send WhatsApp

          </SheetTitle>



          <SheetDescription>

            Select and customise a message for {contact.name}

          </SheetDescription>


        </SheetHeader>






        <div className="
          mt-6
          space-y-4
        ">



          {
            !selected &&
            !initialMessage && (


              <>


                <Input

                  placeholder="
                    Search templates...
                  "


                  value={
                    search
                  }


                  onChange={
                    (e)=>
                      setSearch(
                        e.target.value
                      )
                  }

                />



                {
                  loading && (

                    <div className="
                      py-8
                      text-center
                      text-sm
                      text-muted-foreground
                    ">

                      Loading templates...

                    </div>

                  )
                }



                {
                  !loading && (

                    <div className="
                      max-h-[420px]
                      space-y-2
                      overflow-y-auto
                    ">


                      {
                        filteredTemplates.map(

                          (template)=>(


                            <button

                              key={
                                template.id
                              }

                              type="button"

                              onClick={() =>
                                selectTemplate(
                                  template
                                )
                              }

                              className="
                                w-full
                                rounded-lg
                                border
                                p-4
                                text-left
                                transition
                                hover:bg-muted
                              "

                            >

                              <div className="font-medium">

                                {template.title}

                              </div>


                              <div className="
                                mt-1
                                text-xs
                                text-muted-foreground
                              ">

                                {template.category}

                              </div>


                            </button>


                          )

                        )
                      }


                    </div>

                  )
                }


              </>


            )
          }






          {
            selected && (


              <div className="space-y-4">



                <div className="text-sm font-medium">

                  {selected.title}

                </div>




                <Textarea

                  value={
                    message
                  }


                  onChange={
                    (e)=>
                      setMessage(
                        e.target.value
                      )
                  }


                  className="
                    min-h-[280px]
                    resize-y
                  "

                />




                <div className="
                  text-right
                  text-xs
                  text-muted-foreground
                ">

                  {message.length} / 4096

                </div>




                <div className="space-y-2">


                  <div className="text-xs text-muted-foreground">

                    Rewrite message

                  </div>



                  <div className="flex flex-wrap gap-2">


                    {
                      [
                        "formal",
                        "warm",
                        "concise",
                        "luxury",
                      ].map(
                        (tone)=>(
                          <Button

                            key={
                              tone
                            }

                            size="sm"

                            variant="outline"

                            disabled={
                              rewriting
                            }

                            onClick={() =>
                              rewriteMessage(
                                tone as any
                              )
                            }

                          >

                            {
                              tone
                            }

                          </Button>
                        )
                      )
                    }


                  </div>


                </div>





                <div className="
                  flex
                  justify-between
                  gap-3
                ">



                  {
                    selected.id !== "property-share" && (

                      <Button

                        variant="outline"

                        onClick={
                          changeTemplate
                        }

                      >

                        Change Template

                      </Button>

                    )
                  }



                  <Button

                    onClick={
                      sendTemplate
                    }

                  >

                    Send WhatsApp

                  </Button>


                </div>



              </div>


            )
          }



        </div>



      </SheetContent>


    </Sheet>


  )

}