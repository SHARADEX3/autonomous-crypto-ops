import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const STATUS_ORDER = ["earning", "active", "researching", "new", "dead"]

export async function GET() {
  try {
    const rows = await db.opportunity.findMany()
    const sorted = rows.sort((a, b) => {
      const sa = STATUS_ORDER.indexOf(a.status)
      const sb = STATUS_ORDER.indexOf(b.status)
      if (sa !== sb) return sa - sb
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
    return NextResponse.json({
      opportunities: sorted.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "opportunities fetch failed" },
      { status: 500 },
    )
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(40),
  url: z.string().min(3).max(300),
  description: z.string().max(1000).optional(),
  effort: z.enum(["low", "medium", "high"]).optional(),
  payout: z.enum(["zero", "dust", "small", "variable", "unknown"]).optional(),
  autonomous: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
    }
    const o = await db.opportunity.create({ data: parsed.data })
    return NextResponse.json(
      { opportunity: { ...o, createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString() } },
      { status: 201 },
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "opportunity create failed" },
      { status: 500 },
    )
  }
}
