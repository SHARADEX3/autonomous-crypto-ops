import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { CHAINS } from "@/lib/chains"
import type { EarningsPayload } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const events = await db.earningEvent.findMany({
      orderBy: { detectedAt: "desc" },
      take: 200,
    })
    const all = await db.earningEvent.findMany({
      select: { symbol: true, amount: true, usdValue: true },
    })

    const bySymbol = new Map<string, { symbol: string; amount: number; usdValue: number }>()
    let totalUsd = 0
    for (const e of all) {
      const usd = e.usdValue ?? 0
      const cur = bySymbol.get(e.symbol) ?? { symbol: e.symbol, amount: 0, usdValue: 0 }
      cur.amount += e.amount
      cur.usdValue += usd
      bySymbol.set(e.symbol, cur)
      totalUsd += usd
    }

    const payload: EarningsPayload = {
      events: events.map((e) => ({
        ...e,
        detectedAt: e.detectedAt.toISOString(),
      })),
      totals: [...bySymbol.values()].sort((a, b) => b.usdValue - a.usdValue),
      totalUsd,
    }
    return NextResponse.json(payload)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "earnings fetch failed" },
      { status: 500 },
    )
  }
}

const manualSchema = z.object({
  chain: z.string().min(1),
  amount: z.number().positive(),
  usdValue: z.number().nonnegative().optional(),
  note: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = manualSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
    }
    const { chain, amount, usdValue, note } = parsed.data
    const info = CHAINS[chain]
    const event = await db.earningEvent.create({
      data: {
        chain,
        symbol: info?.symbol ?? chain.toUpperCase(),
        amount,
        usdValue: usdValue ?? null,
        note: note ?? "Manually logged",
        source: "manual",
      },
    })
    return NextResponse.json({ event }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "manual earning failed" },
      { status: 500 },
    )
  }
}
