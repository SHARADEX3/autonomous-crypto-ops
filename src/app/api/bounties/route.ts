import { NextResponse } from "next/server"
import { getBounties } from "@/lib/bounties"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const force = new URL(request.url).searchParams.get("force") === "1"
    const payload = await getBounties(force)
    return NextResponse.json(payload)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "bounties fetch failed" },
      { status: 500 },
    )
  }
}
