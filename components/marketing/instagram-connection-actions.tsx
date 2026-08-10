"use client"

import { useState, useTransition } from "react"
import { Loader2, Unplug, Wifi } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function InstagramConnectionActions({ connected }: { connected: boolean }) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function testConnection() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch("/api/marketing/instagram/test", { method: "POST" })
      const data = await response.json().catch(() => ({})) as { message?: string }
      setMessage(data.message ?? "Connection test could not be completed.")
      router.refresh()
    })
  }

  function disconnect() {
    if (!window.confirm("Disconnect Instagram? Scheduled posts will be marked as blocked until you reconnect.")) return
    setMessage(null)
    startTransition(async () => {
      const response = await fetch("/api/marketing/instagram/disconnect", { method: "POST" })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Instagram has been disconnected. Scheduled posts remain in your library and are marked for reconnection." : data.error ?? "Could not disconnect Instagram.")
      router.refresh()
    })
  }

  return <div className="mt-5"><div className="flex flex-wrap gap-2">{connected && <Button type="button" variant="outline" onClick={testConnection} disabled={isPending}><Wifi className="h-4 w-4" />Test connection</Button>}{connected && <Button type="button" variant="outline" onClick={disconnect} disabled={isPending}><Unplug className="h-4 w-4" />Disconnect</Button>}{isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div>{message && <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">{message}</p>}</div>
}
