import { NextResponse } from "next/server"
import { getWalletStatus } from "@/lib/patrol"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const payload = await getWalletStatus()
    return NextResponse.json(payload)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "wallet status failed" },
      { status: 500 },
    )
  }
}
