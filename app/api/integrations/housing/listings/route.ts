import { NextResponse } from "next/server"

// Inventory publishing will be enabled only after Housing supplies its
// production endpoint and authentication contract.
export async function POST() {
  return NextResponse.json(
    {
      error: "Housing inventory publishing is not configured.",
    },
    { status: 501 }
  )
}
