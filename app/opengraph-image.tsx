import { ImageResponse } from "next/og"

import { PUBLIC_BRAND } from "@/lib/brand/public-brand"

export const alt = PUBLIC_BRAND.socialImageAlt
export const size = {
  width: PUBLIC_BRAND.socialImageWidth,
  height: PUBLIC_BRAND.socialImageHeight,
}
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#F7F7F4",
          color: PUBLIC_BRAND.primaryColor,
          display: "flex",
          height: "100%",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: PUBLIC_BRAND.primaryColor,
            borderRadius: "36px",
            color: "white",
            display: "flex",
            fontSize: 170,
            fontWeight: 600,
            height: "260px",
            justifyContent: "center",
            letterSpacing: "-0.08em",
            width: "260px",
          }}
        >
          {PUBLIC_BRAND.mark}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "52px",
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontWeight: 600,
              letterSpacing: "0.12em",
              lineHeight: 1,
            }}
          >
            THE ADDRESS CO.
          </div>
          <div
            style={{
              fontSize: 34,
              letterSpacing: "0.02em",
              marginTop: "28px",
            }}
          >
            {PUBLIC_BRAND.descriptor}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
