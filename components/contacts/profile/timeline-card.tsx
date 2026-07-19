import { ProfileCard } from "@/components/profile/profile-card"

const timeline = [
  {
    date: "Yesterday",
    title: "Follow-up Call",
    description: "Discussed shortlisted villas in Assagao.",
  },
  {
    date: "Monday",
    title: "Site Visit",
    description: "Visited Casa Verde with family.",
  },
  {
    date: "Last Week",
    title: "Requirements Updated",
    description: "Budget increased to ₹15 Cr.",
  },
]

export function TimelineCard() {
  return (
    <ProfileCard
      title="Timeline"
      description="Relationship history"
    >
      <div className="space-y-6">
        {timeline.map((event, index) => (
          <div
            key={event.title}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-primary" />

              {index !== timeline.length - 1 && (
                <div className="mt-2 h-full w-px bg-border" />
              )}
            </div>

            <div className="pb-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {event.date}
              </p>

              <h3 className="mt-1 font-medium">
                {event.title}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ProfileCard>
  )
}