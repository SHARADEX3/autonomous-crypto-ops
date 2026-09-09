import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { z } from "zod"
import { db } from "@/lib/db"
import type { AgentPayload } from "@/lib/types"

export const dynamic = "force-dynamic"

const PROJECT_ROOT = "/home/z/my-project"

async function readOptionalFile(path: string): Promise<string | null> {
  try {
    const content = await readFile(path, "utf8")
    return content.trim() || null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const runs = await db.agentRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    })
    const totalRuns = await db.agentRun.count()

    const worklog = await readOptionalFile(`${PROJECT_ROOT}/worklog.md`)
    const repoUrl = await readOptionalFile(`${PROJECT_ROOT}/.repo-url`)

    const payload: AgentPayload = {
      runs: runs.map((r) => ({
        id: r.id,
        task: r.task,
        status: r.status,
        summary: r.summary,
        createdAt: r.createdAt.toISOString(),
      })),
      totalRuns,
      lastRunAt: runs[0]?.createdAt?.toISOString() ?? null,
      repoUrl,
      worklogTail: (worklog ?? "").slice(-4000),
    }
    return NextResponse.json(payload)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "agent status failed" },
      { status: 500 },
    )
  }
}

const runSchema = z.object({
  task: z.string().min(2).max(60).optional(),
  status: z.enum(["ok", "error"]).optional(),
  summary: z.string().max(2000).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = runSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
    }
    const run = await db.agentRun.create({
      data: {
        task: parsed.data.task ?? "manual",
        status: parsed.data.status ?? "ok",
        summary: parsed.data.summary ?? "",
      },
    })
    return NextResponse.json({ run }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "agent run log failed" },
      { status: 500 },
    )
  }
}
