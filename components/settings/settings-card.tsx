"use client"

import Link from "next/link"



type Props = {

  title:string

  description:string

  href:string

}



export function SettingsCard({

  title,

  description,

  href,

}:Props){


  return (

    <Link

      href={href}

      className="rounded-2xl border p-6 hover:bg-muted/40 transition block"

    >

      <h3 className="text-lg font-semibold">
        {title}
      </h3>


      <p className="mt-2 text-sm text-muted-foreground">
        {description}
      </p>


    </Link>

  )

}