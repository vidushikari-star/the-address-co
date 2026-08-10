import Link from "next/link"
import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react"

import { saveMarketingBrandSettings } from "@/app/(app)/marketing/settings/actions"
import { InstagramConnectionActions } from "@/components/marketing/instagram-connection-actions"
import { MarketingAudioLibrary } from "@/components/marketing/marketing-audio-library"
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

type Props = { searchParams: Promise<{ instagram?: string; reason?: string }> }

export default async function MarketingSettingsPage({ searchParams }: Props) {
  await requireMarketingAdminPage()
  const [settings, account, tracks, params] = await Promise.all([
    MarketingRepository.getBrandSettings(),
    MarketingRepository.getInstagramAccount(),
    MarketingRepository.listAudioTracks(),
    searchParams,
  ])
  const connected = account?.status === "connected" || account?.status === "expiring"

  return <>
    <MarketingPageHeader
      pathname="/marketing/settings"
      eyebrow="Marketing settings"
      title="Keep the voice and connection in your hands."
      description="Brand settings guide every draft. Instagram access tokens remain encrypted on the server and never enter an AI request."
    />
    <main className="mx-auto grid w-full max-w-7xl gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_0.75fr] lg:p-8">
      <div className="space-y-6"><form action={saveMarketingBrandSettings} className="rounded-2xl border bg-card p-5 sm:p-6">
        <div><h2 className="font-semibold">Brand voice</h2><p className="mt-1 text-sm text-muted-foreground">Applied to structured creative generation, never used to alter source property facts.</p></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">Brand name<Input name="brandName" defaultValue={settings.brandName ?? ""} /></label>
          <label className="grid gap-1.5 text-sm font-medium">Instagram handle<Input name="instagramHandle" defaultValue={settings.instagramHandle ?? ""} placeholder="theaddressco" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Website<Input name="website" defaultValue={settings.website ?? ""} /></label>
          <label className="grid gap-1.5 text-sm font-medium">WhatsApp / contact CTA<Input name="whatsappCta" defaultValue={settings.whatsappCta ?? ""} /></label>
        </div>
        <label className="mt-4 grid gap-1.5 text-sm font-medium">Preferred tone<Textarea name="preferredTone" defaultValue={settings.preferredTone} rows={3} /></label>
        <label className="mt-4 grid gap-1.5 text-sm font-medium">Preferred CTA<Input name="preferredCta" defaultValue={settings.preferredCta ?? ""} /></label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">Default hashtags <span className="text-xs font-normal text-muted-foreground">Separate with commas or new lines</span><Textarea name="defaultHashtags" defaultValue={settings.defaultHashtags.join(", ")} rows={3} /></label>
          <label className="grid gap-1.5 text-sm font-medium">Excluded words / phrases<Textarea name="excludedWords" defaultValue={settings.excludedWords.join(", ")} rows={3} /></label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">Font<Input name="fontFamily" defaultValue={settings.fontFamily ?? ""} placeholder="Inter" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Primary color<Input name="primaryColor" defaultValue={settings.brandColors.primary ?? "#1f4d3b"} /></label>
          <label className="grid gap-1.5 text-sm font-medium">Accent color<Input name="accentColor" defaultValue={settings.brandColors.accent ?? "#c9a96a"} /></label>
        </div>
        <input type="hidden" name="timezone" value={settings.timezone} />
        <Button className="mt-6" type="submit">Save brand settings</Button>
      </form><MarketingAudioLibrary tracks={tracks} /></div>

      <aside className="space-y-6">
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-2 ${connected ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}><ShieldCheck className="h-5 w-5" /></div>
            <div><h2 className="font-semibold">Instagram professional account</h2><p className="mt-1 text-sm text-muted-foreground">{connected ? `Connected as @${account?.username || "Instagram"}` : "Not connected"}</p></div>
          </div>
          {params.instagram === "error" && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Instagram connection failed{params.reason ? `: ${params.reason}` : ". Check your Meta configuration and try again."}</p>}
          {params.instagram === "connected" && <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />Instagram is connected.</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/api/marketing/instagram/connect?returnTo=/marketing/settings" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{connected ? "Reconnect Instagram" : "Connect Instagram"}<ExternalLink className="h-3.5 w-3.5" /></Link>
          </div>
          <InstagramConnectionActions connected={connected} />
          {account && <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Account type</dt><dd className="font-medium">{account.accountType || "Professional"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Connection</dt><dd className="font-medium capitalize">{account.status}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Publishing</dt><dd className="font-medium">{process.env.INSTAGRAM_PUBLISHING_ENABLED === "true" ? "Enabled" : "Disabled by flag"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Last verified</dt><dd className="font-medium">{account.lastVerifiedAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(account.lastVerifiedAt)) : "Not yet verified"}</dd></div>
          </dl>}
        </section>
        <section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Connection requirements</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">The account must be a Meta-supported professional account. This module requests <code>instagram_business_basic</code> and <code>instagram_business_content_publish</code>.</p></section>
      </aside>
    </main>
  </>
}
