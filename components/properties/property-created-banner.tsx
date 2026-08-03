"use client"

import {
  useEffect,
} from "react"

import {
  useRouter,
} from "next/navigation"


export function PropertyCreatedBanner(){

  const router =
    useRouter()


  useEffect(() => {

    const timer =
      setTimeout(() => {

        router.replace(
          window.location.pathname
        )

      }, 5000)


    return () =>
      clearTimeout(timer)

  }, [router])


  return (

    <section
      className="
        rounded-3xl
        border
        bg-muted/40
        p-6
      "
    >

      <h2 className="text-xl font-semibold">
        Property Created Successfully 🎉
      </h2>


      <p className="mt-2 text-sm text-muted-foreground">
        Complete your listing by adding photos, videos and brochures.
      </p>


      <div
        className="
          mt-5
          flex
          flex-wrap
          gap-3
        "
      >

        <a
          href="#gallery"
          className="
            rounded-xl
            border
            px-4
            py-2
            text-sm
            font-medium
          "
        >
          Add Photos & Videos
        </a>


        <a
          href="#documents"
          className="
            rounded-xl
            border
            px-4
            py-2
            text-sm
            font-medium
          "
        >
          Upload Brochure / Documents
        </a>

      </div>


    </section>

  )

}