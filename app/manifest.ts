import type { MetadataRoute } from "next"

import { PUBLIC_BRAND } from "@/lib/brand/public-brand"

export default function manifest(): MetadataRoute.Manifest {

  return {
    name: PUBLIC_BRAND.name,
    short_name: "TAC",
    description: PUBLIC_BRAND.descriptor,

    start_url: "/dashboard",

    display: "standalone",

    background_color: "#ffffff",

    theme_color: "#000000",

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }

}
