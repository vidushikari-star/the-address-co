import Link from "next/link"
import { Plus } from "lucide-react"

import {
  PageHeader,
} from "@/components/layout/page-header"

import {
  buttonVariants,
} from "@/components/ui/button"



export function ContactHeader() {


  return (

    <PageHeader

      eyebrow="Contacts"

      title="Relationships"

      description="Manage buyers, sellers, investors, developers and every important relationship across your business."

      actions={

        <Link
          href="/contacts/new"
          className={buttonVariants({
            size: "default",
            className: "w-full sm:w-auto",
          })}
        >

          <Plus className="mr-2 h-4 w-4" />

          New Relationship

        </Link>

      }

    />

  )

}
