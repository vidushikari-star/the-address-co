import { ExternalLink } from "lucide-react"

/**
 * OAuth must leave the CRM through a document navigation. Do not change this
 * to a client fetch/transition: an XHR redirect to Instagram is CORS-blocked.
 */
export function InstagramConnectLink({ connected }: { connected: boolean }) {
  return <a
    href="/api/marketing/instagram/connect?returnTo=/marketing/settings"
    className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
  >
    {connected ? "Reconnect Instagram" : "Connect Instagram"}<ExternalLink className="h-3.5 w-3.5" />
  </a>
}
