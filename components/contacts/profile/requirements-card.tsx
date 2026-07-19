import { ProfileCard } from "@/components/profile/profile-card"

export function RequirementsCard() {
  return (
    <ProfileCard
      title="Requirements"
      description="Current property preferences"
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Property Type
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {["Villa"].map((type) => (
              <span
                key={type}
                className="rounded-full bg-muted px-3 py-1 text-sm"
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Lifestyle Priorities
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Private Pool",
              "Garden",
              "Quiet Area",
              "Gated Community",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full bg-muted px-3 py-1 text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Additional Notes
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Looking for a permanent family residence with modern
            architecture, generous outdoor space, and close
            proximity to international schools.
          </p>
        </div>
      </div>
    </ProfileCard>
  )
}