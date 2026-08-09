import { notFound } from "next/navigation"

import { CalendarEventForm } from "@/components/calendar/calendar-event-form"
import { getServerCalendarEvent } from "@/lib/repositories/calendar-event-server-repository"

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function EditCalendarEventPage({
  params,
}: Props) {
  const { id } = await params
  const event = await getServerCalendarEvent(id)

  if (!event) {
    notFound()
  }

  return (
    <div className="p-4 md:p-8">
      <CalendarEventForm mode="edit" event={event} />
    </div>
  )
}
