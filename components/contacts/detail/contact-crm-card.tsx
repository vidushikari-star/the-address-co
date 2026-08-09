import type {
  Contact,
} from "@/types"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"



type ContactCrmCardProps = {

  contact: Contact

}



export function ContactCrmCard({
  contact,
}: ContactCrmCardProps) {


  return (

    <Card className="rounded-2xl">

      <CardHeader className="px-4 py-3">

        <CardTitle className="text-base">
          CRM
        </CardTitle>

      </CardHeader>



      <CardContent className="space-y-4 px-4 pb-5">

        <InfoRow
          label="Advisor"
          value={
            contact.assignedAdvisor ??
            "Unassigned"
          }
        />

        <InfoRow
          label="Source"
          value={
            contact.leadSource ??
            "Unknown"
          }
        />

        <InfoRow
          label="Timeline"
          value={
            contact.timeline ??
            "Not specified"
          }
        />

      </CardContent>

    </Card>

  )

}



function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {


  return (

    <div className="flex items-start justify-between gap-4 text-sm">

      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right font-medium">
        {value}
      </span>

    </div>

  )

}
