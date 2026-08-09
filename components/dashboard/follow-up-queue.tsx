"use client"

import {
  useEffect,
  useState,
} from "react"

import Link from "next/link"

import {
  useRouter,
} from "next/navigation"

import {
  AlertCircle,
  CalendarDays,
  Clock,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
  buttonVariants,
} from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  WhatsAppButton,
} from "@/components/communications/whatsapp-button"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  WhatsAppCallButton,
} from "@/components/communications/whatsapp-call-button"

import {
  getAllUserProfiles,
} from "@/lib/repositories/user-profile-repository"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import type {
  Contact,
} from "@/types/contact"

import type {
  UserProfile,
} from "@/types/user"


type FollowUpQueue = {
  overdue: Contact[]
  today: Contact[]
  upcoming: Contact[]
}


type Props = {
  queue: FollowUpQueue
}


type ContactActionProps = {
  advisors: UserProfile[]
  updating: boolean
  onAssignAdvisor: (
    contactId: string,
    advisorId: string
  ) => Promise<void>
  onReschedule: (
    contact: Contact,
    days: number
  ) => Promise<void>
  onDismiss: (
    contact: Contact
  ) => Promise<void>
}


type FollowUpContactItemProps =
  ContactActionProps & {
    contact: Contact
  }


function FollowUpContactItem({
  contact,
  advisors,
  updating,
  onAssignAdvisor,
  onReschedule,
  onDismiss,
}: FollowUpContactItemProps){
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background p-3">
      <div>
        <p className="font-medium">
          {contact.name}
        </p>

        <p className="text-sm text-muted-foreground">
          {contact.phone}
        </p>
      </div>

      <label className="block text-xs font-medium text-muted-foreground">
        Advisor

        <select
          className="mt-1 w-full rounded-lg border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          value={contact.advisor ?? ""}
          disabled={updating}
          onChange={event =>
            void onAssignAdvisor(
              contact.id,
              event.target.value
            )
          }
        >
          <option value="">
            Unassigned
          </option>

          {
            advisors.map(
              advisor => (
                <option
                  key={advisor.id}
                  value={advisor.id}
                >
                  {advisor.name}
                </option>
              )
            )
          }
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <WhatsAppCallButton
          contact={contact}
          size="sm"
          variant="outline"
          disabled={updating}
        />

        <WhatsAppButton
          contact={contact}
        />

        <Button
          size="sm"
          variant="outline"
          disabled={updating}
          onClick={() =>
            void onReschedule(contact, 1)
          }
        >
          Tomorrow
        </Button>

        <Button
          size="sm"
          variant="ghost"
          disabled={updating}
          onClick={() =>
            void onReschedule(contact, 3)
          }
        >
          +3 days
        </Button>

        <Button
          size="sm"
          variant="ghost"
          disabled={updating}
          onClick={() =>
            void onReschedule(contact, 7)
          }
        >
          Next week
        </Button>

        <Button
          size="sm"
          variant="ghost"
          disabled={updating}
          onClick={() =>
            void onDismiss(contact)
          }
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}


type FollowUpSectionProps =
  ContactActionProps & {
    title: string
    icon: React.ReactNode
    contacts: Contact[]
    variant?: "danger" | "normal"
  }


function FollowUpSection({
  title,
  icon,
  contacts,
  variant = "normal",
  advisors,
  updating,
  onAssignAdvisor,
  onReschedule,
  onDismiss,
}: FollowUpSectionProps){
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        {icon}

        <span>{title}</span>

        <Badge
          variant={
            variant === "danger"
              ? "destructive"
              : "secondary"
          }
        >
          {contacts.length}
        </Badge>
      </div>

      {
        contacts.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No follow-ups.
            </p>
          )
          : (
            <div className="space-y-3">
              {
                contacts.slice(0, 2).map(
                  contact => (
                    <FollowUpContactItem
                      key={contact.id}
                      contact={contact}
                      advisors={advisors}
                      updating={updating}
                      onAssignAdvisor={onAssignAdvisor}
                      onReschedule={onReschedule}
                      onDismiss={onDismiss}
                    />
                  )
                )
              }
            </div>
          )
      }
    </section>
  )
}


export function FollowUpQueue({
  queue,
}: Props){
  const router = useRouter()

  const [
    updating,
    setUpdating,
  ] = useState(false)

  const [
    advisors,
    setAdvisors,
  ] = useState<UserProfile[]>([])

  useEffect(() => {
    let active = true

    async function loadAdvisors(){
      try {
        const profiles =
          await getAllUserProfiles()

        if(active){
          setAdvisors(profiles)
        }
      }
      catch(error){
        console.error(
          "Failed to load advisors:",
          error
        )
      }
    }

    void loadAdvisors()

    return () => {
      active = false
    }
  }, [])

  async function runUpdate(
    action: () => Promise<void>
  ){
    try {
      setUpdating(true)
      await action()
      router.refresh()
    }
    catch(error){
      console.error(
        "Unable to update follow-up:",
        error
      )
    }
    finally {
      setUpdating(false)
    }
  }

  async function assignAdvisor(
    contactId: string,
    advisorId: string
  ){
    await runUpdate(
      async () => {
        await ContactsRepository.update(
          contactId,
          {
            advisorId: advisorId || undefined,
          }
        )
      }
    )
  }

  async function reschedule(
    contact: Contact,
    days: number
  ){
    await runUpdate(
      async () => {
        const date = new Date()

        date.setDate(
          date.getDate() + days
        )

        date.setHours(10, 0, 0, 0)

        await ContactsRepository.update(
          contact.id,
          {
            nextFollowUpAt: date.toISOString(),
          }
        )

        await createActivity({
          type: "note",
          title: "Follow up rescheduled",
          body: `Follow up moved to ${date.toLocaleDateString("en-IN")}`,
          contactId: contact.id,
          date: new Date().toISOString(),
        })
      }
    )
  }

  async function dismissFollowUp(
    contact: Contact
  ){
    await runUpdate(
      async () => {
        await ContactsRepository.update(
          contact.id,
          {
            nextFollowUpAt: null,
          }
        )

        await createActivity({
          type: "note",
          title: "Follow up dismissed",
          body: `Follow up dismissed for ${contact.name}`,
          contactId: contact.id,
          date: new Date().toISOString(),
        })
      }
    )
  }

  const contactActionProps = {
    advisors,
    updating,
    onAssignAdvisor: assignAdvisor,
    onReschedule: reschedule,
    onDismiss: dismissFollowUp,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Follow-up queue
          </span>

          <Link
            href="/contacts"
            className={
              buttonVariants({
                variant: "outline",
                size: "sm",
              })
            }
          >
            View all
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <FollowUpSection
          title="Overdue"
          contacts={queue.overdue}
          variant="danger"
          icon={
            <AlertCircle className="h-4 w-4 text-destructive" />
          }
          {...contactActionProps}
        />

        <FollowUpSection
          title="Today"
          contacts={queue.today}
          icon={
            <CalendarDays className="h-4 w-4 text-primary" />
          }
          {...contactActionProps}
        />

        <FollowUpSection
          title="Upcoming"
          contacts={queue.upcoming}
          icon={
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          }
          {...contactActionProps}
        />
      </CardContent>
    </Card>
  )
}
