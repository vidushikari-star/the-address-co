import { afterEach, describe, expect, it, vi } from "vitest"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

import {
  createPublicBrandMetadata,
  getPublicAppOrigin,
  PUBLIC_BRAND,
} from "@/lib/brand/public-brand"

describe("public link-preview branding", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("emits the canonical brand and a full absolute Open Graph and Twitter image URL", () => {
    const metadata = createPublicBrandMetadata(
      new URL("https://www.example.com"),
      "/share/b2041f1f-89e9-4a59-a8de-00169502f523",
    )

    expect(metadata.title).toBe("The Address Co.")
    expect(metadata.description).toBe("Luxury Real Estate Advisory")
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      url: "https://www.example.com/share/b2041f1f-89e9-4a59-a8de-00169502f523",
      title: "The Address Co.",
      description: "Luxury Real Estate Advisory",
      images: [{
        url: "https://www.example.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "The Address Co. — Luxury Real Estate Advisory",
      }],
    })
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "The Address Co.",
      description: "Luxury Real Estate Advisory",
      images: [{
        url: "https://www.example.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "The Address Co. — Luxury Real Estate Advisory",
      }],
    })
  })

  it("requires the configured canonical HTTPS origin rather than falling back to a preview host", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "")
    expect(() => getPublicAppOrigin()).toThrow("NEXT_PUBLIC_APP_URL must be configured")

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
    expect(() => getPublicAppOrigin()).toThrow("NEXT_PUBLIC_APP_URL must use HTTPS.")

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com")
    expect(getPublicAppOrigin().toString()).toBe("https://app.example.com/")
  })

  it("keeps share metadata generic and uses the revocable public projection before rendering it", async () => {
    const page = await readFile(
      join(process.cwd(), "app", "(public)", "share", "[slug]", "page.tsx"),
      "utf8",
    )
    const metadataSource = page.slice(0, page.indexOf("export default"))

    expect(metadataSource).toContain("export async function generateMetadata")
    expect(metadataSource).toContain("await connection()")
    expect(metadataSource).toContain("getCachedPublicPropertyShare(slug)")
    expect(metadataSource).toContain("if (!share)")
    expect(metadataSource).toContain("notFound()")
    expect(metadataSource).toContain("createPublicBrandMetadata")
    expect(metadataSource).not.toMatch(/share\.(title|location|price|advisor|images|documents)/)
  })

  it("uses the dashboard mark for the public image and removes the legacy operating-system descriptor from public metadata", async () => {
    const root = process.cwd()
    const [layout, manifest, image, appLogo, publicHeader] = await Promise.all([
      readFile(join(root, "app", "layout.tsx"), "utf8"),
      readFile(join(root, "app", "manifest.ts"), "utf8"),
      readFile(join(root, "app", "opengraph-image.tsx"), "utf8"),
      readFile(join(root, "components", "app", "app-logo.tsx"), "utf8"),
      readFile(join(root, "components", "public", "public-header.tsx"), "utf8"),
    ])

    expect(layout).toContain("createPublicBrandMetadata")
    expect(manifest).toContain("PUBLIC_BRAND.descriptor")
    expect(`${layout}\n${manifest}`).not.toContain("Luxury Real Estate Operating System")
    expect(image).toContain("ImageResponse")
    expect(image).toContain("contentType = \"image/png\"")
    expect(image).toContain("PUBLIC_BRAND.mark")
    expect(image).toContain("PUBLIC_BRAND.primaryColor")
    expect(appLogo).toContain("PUBLIC_BRAND.mark")
    expect(publicHeader).toContain("PUBLIC_BRAND.descriptor")
  })

  it("keeps the canonical public-brand contract stable", () => {
    expect(PUBLIC_BRAND).toMatchObject({
      name: "The Address Co.",
      descriptor: "Luxury Real Estate Advisory",
      mark: "A",
      primaryColor: "#1F4D3B",
      socialImagePath: "/opengraph-image",
      socialImageWidth: 1200,
      socialImageHeight: 630,
    })
  })

  it("keeps CRM property messages on token-gated share URLs and leaves anonymous CRM restrictions intact", async () => {
    const root = process.cwd()
    const [message, drawer, qualificationCard, page, publicBrand, stageOneRls] = await Promise.all([
      readFile(join(root, "lib", "communications", "property-message.ts"), "utf8"),
      readFile(join(root, "components", "deals", "share-property-drawer.tsx"), "utf8"),
      readFile(join(root, "components", "communications", "whatsapp", "qualification-card.tsx"), "utf8"),
      readFile(join(root, "app", "(public)", "share", "[slug]", "page.tsx"), "utf8"),
      readFile(join(root, "lib", "brand", "public-brand.ts"), "utf8"),
      readFile(join(root, "supabase", "migrations", "20260812090000_stage_1_remove_anonymous_crm_access.sql"), "utf8"),
    ])

    expect(message).toContain("property.publicLink")
    expect(drawer).toContain("property.publicShareEnabled && property.publicShareToken")
    expect(drawer).toContain("/share/${property.publicShareToken}")
    expect(qualificationCard).toContain("property.public_share_enabled && property.public_share_token")
    expect(qualificationCard).toContain("/share/${property.public_share_token}")
    expect(page).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
    expect(page).not.toContain("createAdminSupabaseClient")
    expect(publicBrand).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
    expect(stageOneRls).toMatch(/revoke all on table[\s\S]*public\.contacts,[\s\S]*from anon;/)
  })
})
