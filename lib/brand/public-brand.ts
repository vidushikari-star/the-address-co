import type { Metadata } from "next"

export const PUBLIC_BRAND = {
  name: "The Address Co.",
  descriptor: "Luxury Real Estate Advisory",
  mark: "A",
  primaryColor: "#1F4D3B",
  socialImagePath: "/opengraph-image",
  socialImageAlt: "The Address Co. — Luxury Real Estate Advisory",
  socialImageWidth: 1200,
  socialImageHeight: 630,
} as const

export function getPublicAppOrigin(): URL {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (!configuredOrigin) {
    throw new Error("NEXT_PUBLIC_APP_URL must be configured with the canonical HTTPS application origin.")
  }

  const origin = new URL(configuredOrigin)

  if (origin.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS.")
  }

  return origin
}

export function createPublicBrandMetadata(
  origin: URL,
  canonicalPath = "/",
): Metadata {
  const imageUrl = new URL(PUBLIC_BRAND.socialImagePath, origin).toString()
  const canonicalUrl = new URL(canonicalPath, origin).toString()

  return {
    metadataBase: origin,
    title: PUBLIC_BRAND.name,
    description: PUBLIC_BRAND.descriptor,
    applicationName: PUBLIC_BRAND.name,
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: PUBLIC_BRAND.name,
      title: PUBLIC_BRAND.name,
      description: PUBLIC_BRAND.descriptor,
      images: [{
        url: imageUrl,
        width: PUBLIC_BRAND.socialImageWidth,
        height: PUBLIC_BRAND.socialImageHeight,
        alt: PUBLIC_BRAND.socialImageAlt,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: PUBLIC_BRAND.name,
      description: PUBLIC_BRAND.descriptor,
      images: [{
        url: imageUrl,
        width: PUBLIC_BRAND.socialImageWidth,
        height: PUBLIC_BRAND.socialImageHeight,
        alt: PUBLIC_BRAND.socialImageAlt,
      }],
    },
  }
}
