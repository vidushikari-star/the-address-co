import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"


export type AppNotificationTone =
  | "urgent"
  | "attention"


export type AppNotification = {
  id: string
  title: string
  description: string
  href: string
  tone: AppNotificationTone
  dueDate: string
}


function getIndiaDateKey(
  date = new Date()
): string {
  const parts = new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  )
    .formatToParts(date)
    .reduce<Record<string, string>>(
      (result, part) => {
        result[part.type] = part.value
        return result
      },
      {}
    )

  return `${parts.year}-${parts.month}-${parts.day}`
}


function addDays(
  dateKey: string,
  days: number
): string {
  const date = new Date(
    `${dateKey}T12:00:00+05:30`
  )

  date.setUTCDate(
    date.getUTCDate() + days
  )

  return date
    .toISOString()
    .slice(0, 10)
}


function formatDate(
  dateKey: string
): string {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    }
  ).format(
    new Date(`${dateKey}T12:00:00+05:30`)
  )
}


function getTaskHref(
  task: {
    contact_id: string | null
    deal_id: string | null
  }
): string {
  if(task.deal_id){
    return `/deals/${task.deal_id}`
  }

  if(task.contact_id){
    return `/contacts/${task.contact_id}`
  }

  return "/tasks"
}


export async function getAppNotifications(
  userId: string
): Promise<AppNotification[]> {
  try {
    const supabase =
      await createServerSupabaseClient()

    const today = getIndiaDateKey()
    const tomorrow = addDays(today, 1)

    const [
      tasksResult,
      contactsResult,
    ] = await Promise.all([
      supabase
        .from("tasks")
        .select(
          "id,title,due_date,contact_id,deal_id"
        )
        .eq("status", "pending")
        .not("due_date", "is", null)
        .lte("due_date", tomorrow)
        .or(
          `assigned_to.eq.${userId},assigned_to.is.null`
        )
        .order("due_date", {
          ascending: true,
        })
        .limit(6),

      supabase
        .from("contacts")
        .select(
          "id,full_name,next_follow_up_at"
        )
        .not("next_follow_up_at", "is", null)
        .lte("next_follow_up_at", `${tomorrow}T23:59:59+05:30`)
        .or(
          `advisor_id.eq.${userId},advisor_id.is.null`
        )
        .order("next_follow_up_at", {
          ascending: true,
        })
        .limit(6),
    ])

    if(tasksResult.error){
      throw tasksResult.error
    }

    if(contactsResult.error){
      throw contactsResult.error
    }

    const taskNotifications =
      (tasksResult.data ?? [])
        .filter(
          task => task.due_date
        )
        .map(
          task => {
            const dueDate =
              task.due_date as string

            const overdue =
              dueDate < today

            return {
              id: `task-${task.id}`,
              title: overdue
                ? `Overdue task: ${task.title}`
                : `Task due ${
                  dueDate === today
                    ? "today"
                    : "tomorrow"
                }: ${task.title}`,
              description: overdue
                ? `Due ${formatDate(dueDate)}`
                : "Open the task to take the next step.",
              href: getTaskHref(task),
              tone: overdue
                ? "urgent" as const
                : "attention" as const,
              dueDate,
            }
          }
        )

    const followUpNotifications =
      (contactsResult.data ?? [])
        .filter(
          contact => contact.next_follow_up_at
        )
        .map(
          contact => {
            const dueDate = getIndiaDateKey(
              new Date(
                contact.next_follow_up_at as string
              )
            )

            const overdue =
              dueDate < today

            const contactName =
              contact.full_name ?? "Contact"

            return {
              id: `follow-up-${contact.id}`,
              title: overdue
                ? `Follow-up overdue: ${contactName}`
                : `Follow up today: ${contactName}`,
              description: overdue
                ? `Due ${formatDate(dueDate)}`
                : "Review the relationship and record the next step.",
              href: `/contacts/${contact.id}`,
              tone: overdue
                ? "urgent" as const
                : "attention" as const,
              dueDate,
            }
          }
        )

    return [
      ...taskNotifications,
      ...followUpNotifications,
    ]
      .sort(
        (a, b) => {
          if(a.tone !== b.tone){
            return a.tone === "urgent"
              ? -1
              : 1
          }

          return a.dueDate.localeCompare(
            b.dueDate
          )
        }
      )
      .slice(0, 8)
  }
  catch(error){
    console.error(
      "Failed to load app notifications:",
      error
    )

    return []
  }
}
