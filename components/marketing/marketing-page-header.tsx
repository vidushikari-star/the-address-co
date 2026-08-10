import type { ReactNode } from "react"

import { MarketingNav } from "@/components/marketing/marketing-nav"

export function MarketingPageHeader(input: {
  pathname: string
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <>
      <div className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            {input.eyebrow && <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">{input.eyebrow}</p>}
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{input.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{input.description}</p>
          </div>
          {input.action}
        </div>
      </div>
      <MarketingNav currentPath={input.pathname} />
    </>
  )
}
