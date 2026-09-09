// One-shot patrol endpoint for the autonomous loop (cron agents curl this):
// scans wallets, detects income, records an AgentRun heartbeat.
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { runPatrol } from "@/lib/patrol"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const task = new URL(request.url).searchParams.get("task") ?? "patrol"
  try {
    const summary = await runPatrol()
    const run = await db.agentRun.create({
      data: {
        task,
        status: summary.failed > 0 && summary.ok === 0 ? "error" : "ok",
        summary: `Patrol: ${summary.scanned} chains scanned, ${summary.ok} ok, ${summary.failed} failed, ${summary.earnings.length} income event(s) detected. Total portfolio ≈ $${summary.totalUsd?.toFixed(2) ?? "?"}`,
      },
    })
    return NextResponse.json({
      runId: run.id,
      at: summary.at,
      scanned: summary.scanned,
      ok: summary.ok,
      failed: summary.failed,
      earnings: summary.earnings,
      totalUsd: summary.totalUsd,
      errors: summary.errors,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "patrol crashed"
    await db.agentRun
      .create({ data: { task, status: "error", summary: message } })
      .catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
