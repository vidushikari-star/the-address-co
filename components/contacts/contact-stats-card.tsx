type Stat = {
  label: string
  value: number
}

const stats: Stat[] = [
  {
    label: "People",
    value: 421,
  },
  {
    label: "Buyers",
    value: 178,
  },
  {
    label: "Sellers",
    value: 103,
  },
  {
    label: "Developers",
    value: 24,
  },
  {
    label: "Priority",
    value: 18,
  },
]

export function ContactStats() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-border/60 bg-card px-5 py-4 transition-all duration-200 hover:border-primary/20 hover:bg-background"
        >
          <p className="text-3xl font-semibold tracking-tight">
            {stat.value}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {stat.label}
          </p>
        </div>
      ))}
    </section>
  )
}