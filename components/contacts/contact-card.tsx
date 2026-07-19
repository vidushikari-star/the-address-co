import { CalendarDays, ChevronRight, MapPin } from "lucide-react"

import { Avatar } from "@/components/shared/avatar"
import { Contact } from "@/types/contact"
import { formatCurrencyRangeCr } from "@/lib/formatters/currency"
import { StatusBadge } from "@/components/shared/status-badge"

type ContactCardProps = {
  contact: Contact
}

export function ContactCard({
  contact,
}: ContactCardProps) {
  const budget = formatCurrencyRangeCr(
  contact.budget.min,
  contact.budget.max
)

  return (
    <button className="group flex w-full items-center justify-between rounded-3xl border border-border/60 bg-card p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background">
      <div className="flex items-start gap-5">
        <Avatar
          name={contact.name}
          size="lg"
        />

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold tracking-tight">
              {contact.name}
            </h3>

            <StatusBadge
  status={contact.stage}
/>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {contact.type} • Active
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Budget
              </p>

              <p className="mt-1 font-medium">
                {budget}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Looking In
              </p>

              <div className="mt-1 flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />

                <span>
                  {contact.preferredLocations.join(" • ")}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Next Meeting
              </p>

              <div className="mt-1 flex items-center gap-1 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />

                <span>{contact.nextMeeting}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
    </button>
  )
}