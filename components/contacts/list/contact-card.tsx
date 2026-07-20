"use client"

import { useRouter } from "next/navigation"

import { ChevronRight, Mail, Phone } from "lucide-react"

import { Avatar } from "@/components/shared/avatar"
import { StatusBadge } from "@/components/shared/status-badge"
import { cn } from "@/lib/utils"
import type { Contact } from "@/types/contact"

type ContactCardProps = {
  contact: Contact
  onClick?: (contact: Contact) => void
  className?: string
}

export function ContactCard({
  contact,
  onClick,
  className,
}: ContactCardProps) {
  const router = useRouter()

  function handleClick() {
    onClick?.(contact)
    router.push(`/contacts/${contact.id}`)
  }

  return (
    <button
      type="button"
      aria-label={`Open ${contact.name}`}
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center justify-between rounded-3xl border border-border/60 bg-card p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-5">
        <Avatar
          name={contact.name || "Unknown"}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="truncate text-lg font-semibold tracking-tight">
              {contact.name || "Unnamed Contact"}
            </h3>

            <StatusBadge status={contact.stage} />
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{contact.phone}</span>
            </div>

            {contact.email ? (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="truncate">{contact.email}</span>
              </div>
            ) : null}
          </div>

          {contact.assignedAdvisor ? (
            <div className="mt-5 border-t border-border/50 pt-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Advisor
              </p>

              <p className="mt-1 text-sm font-medium">
                {contact.assignedAdvisor}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <ChevronRight className="ml-4 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
    </button>
  )
}