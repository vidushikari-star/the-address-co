import { activities } from "@/lib/mock-data/activities/activities"

export function getActivitiesByContactId(contactId: string) {
  return activities
    .filter((activity) => activity.contactId === contactId)
    .sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
    )
}