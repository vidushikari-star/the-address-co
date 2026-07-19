import { ProfileCard } from "@/components/profile/profile-card"

export function NotesCard() {
  return (
    <ProfileCard
      title="Notes"
      description="Private advisor notes"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <p className="text-sm leading-6">
            Client prefers contemporary architecture over Portuguese-style
            homes. Looking for privacy, but still wants to be within
            15–20 minutes of Panjim.
          </p>

          <p className="mt-3 text-xs text-muted-foreground">
            Added yesterday
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <p className="text-sm leading-6">
            Wife prefers larger outdoor spaces while the client is focused
            on construction quality and long-term appreciation.
          </p>

          <p className="mt-3 text-xs text-muted-foreground">
            Added last week
          </p>
        </div>
      </div>
    </ProfileCard>
  )
}