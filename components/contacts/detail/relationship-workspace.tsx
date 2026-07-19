import { RelationshipHeader } from "./relationship-header"
import { RelationshipTimeline } from "./relationship-timeline"
import { RelationshipSnapshot } from "./relationship-snapshot"
import { RelationshipProperties } from "./relationship-properties"
import { RelationshipTasks } from "./relationship-tasks"
import { RelationshipNotes } from "./relationship-notes"

export function RelationshipWorkspace() {
  return (
    <div className="space-y-8">
      <RelationshipHeader />

      <div className="grid gap-8 xl:grid-cols-[2fr_380px]">
        <div className="space-y-8">
          <RelationshipTimeline />
          <RelationshipProperties />
          <RelationshipNotes />
        </div>

        <div className="space-y-8">
          <RelationshipSnapshot />
          <RelationshipTasks />
        </div>
      </div>
    </div>
  )
}