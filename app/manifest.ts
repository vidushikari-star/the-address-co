import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {

  return {
    name: "The Address Co.",
    short_name: "TAC",
    description:
      "Luxury Real Estate Operating System",

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