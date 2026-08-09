import { NextResponse } from "next/server"

// Housing leads are intentionally pulled by this application. Inventory is the
// only resource planned for future outbound publishing.
export async function POST() {
  return NextResponse.json(
    {
      error: "Housing lead push is not supported.",
      message: "This application pulls leads from Housing.com.",
    },
    { status: 410 }
  )
}
