"use client"

import Link from "next/link"

type Props = {
  title: string
  description: string
  href: string
}

export function SettingsCard({
  title,
  description,
  href,
}: Props) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">
            {title}
          </h3>

          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className="shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </div>
      </div>
    </Link>
  )
}