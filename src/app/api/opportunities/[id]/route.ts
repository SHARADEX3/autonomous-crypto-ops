import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  status: z.enum(["new", "researching", "active", "earning", "dead"]).optional(),
  notes: z.string().max(1000).optional(),
  autonomous: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
    }
    const o = await db.opportunity.update({
      where: { id },
      data: parsed.data,
    })
    return NextResponse.json({
      opportunity: { ...o, createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString() },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "opportunity update failed" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.opportunity.delete({ where: { id } })
    return NextResponse.json({ deleted: id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "opportunity delete failed" },
      { status: 500 },
    )
  }
}
