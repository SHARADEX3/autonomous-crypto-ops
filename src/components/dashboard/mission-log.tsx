"use client"

// Mission Log tab: agent run timeline + live worklog.md viewer.
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, RefreshCw, ScrollText, Satellite } from "lucide-react"
import { EmptyState, timeAgo } from "./bits"
import type { AgentPayload } from "@/lib/types"

const TASK_STYLES: Record<string, string> = {
  "webDevReview-15m": "border-teal-500/30 text-teal-400",
  "daily-patrol": "border-amber-500/30 text-amber-400",
  patrol: "border-emerald-500/30 text-emerald-400",
  baseline: "border-muted-foreground/30 text-muted-foreground",
  manual: "border-muted-foreground/30 text-muted-foreground",
}

export function MissionLog({
  data,
  loading,
  refresh,
}: {
  data: AgentPayload | null
  loading: boolean
  refresh: () => void
}) {
  const runs = data?.runs ?? []

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-emerald-400" aria-hidden />
              Agent cycles
            </CardTitle>
            <CardDescription>
              {data ? `${data.totalRuns ?? 0} total runs` : "Loading…"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <EmptyState
              icon={Satellite}
              title="No cycles recorded yet"
              hint="The 15-minute autonomous loop records every wake-up here, with a full summary of what it did."
            />
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto scroll-thin pr-1">
              {runs.map((r) => (
                <li key={r.id} className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.status === "ok" ? "bg-emerald-400 pulse-dot" : "bg-red-400"
                        }`}
                        aria-hidden
                      />
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${TASK_STYLES[r.task] ?? TASK_STYLES.manual}`}
                      >
                        {r.task}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {r.summary || "(no summary)"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="h-4 w-4 text-emerald-400" aria-hidden />
              Worklog
            </CardTitle>
            <CardDescription>
              The agent&apos;s persistent handover journal — every session appends its record
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {data && data.worklogTail ? (
            <ScrollArea className="h-[420px] rounded-md border bg-muted/20">
              <pre className="whitespace-pre-wrap break-words p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {data.worklogTail}
              </pre>
            </ScrollArea>
          ) : loading ? (
            <Skeleton className="h-[420px] w-full rounded-md" />
          ) : (
            <EmptyState
              icon={ScrollText}
              title="Worklog empty"
              hint="The shared journal at worklog.md has no entries yet."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
