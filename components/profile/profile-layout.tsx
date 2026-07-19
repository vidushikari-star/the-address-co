type ProfileLayoutProps = {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function ProfileLayout({
  sidebar,
  children,
}: ProfileLayoutProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <aside className="space-y-6 xl:col-span-4">
        {sidebar}
      </aside>

      <main className="space-y-6 xl:col-span-8">
        {children}
      </main>
    </div>
  )
}