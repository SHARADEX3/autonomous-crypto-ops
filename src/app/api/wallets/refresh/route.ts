import { NextResponse } from "next/server"
import { runPatrol, getWalletStatus } from "@/lib/patrol"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const summary = await runPatrol()
    const wallets = await getWalletStatus()
    return NextResponse.json({ ...summary, wallets })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "patrol failed" },
      { status: 500 },
    )
  }
}
