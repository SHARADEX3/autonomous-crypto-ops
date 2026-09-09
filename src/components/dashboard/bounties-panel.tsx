"use client"

// Bounties tab: live Superteam Earn radar fed by the registered agent API.
import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  Bot,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Satellite,
  Trophy,
  Users,
  Lock,
  Calendar,
  Hash,
} from "lucide-react"
import { CopyButton, EmptyState, fmtUsd } from "./bits"

interface BountyDTO {
  id: string
  slug: string
  title: string
  type: string
  token: string
  rewardAmount: number | null
  usdEstimate: number | null
  compensationType: string
  minRewardAsk: number | null
  maxRewardAsk: number | null
  deadline: string | null
  agentAccess: string
  status: string
  isFeatured: boolean
  isPro: boolean
  sponsorName: string | null
  sponsorLogo: string | null
  sponsorVerified: boolean
  submissions: number
  comments: number
}

interface BountiesPayload {
  source: "agent" | "public"
  registered: boolean
  username: string | null
  claimCode: string | null
  claimUrl: string | null
  browseUrl: string
  fetchedAt: string
  bounties: BountyDTO[]
  totalPoolUsd: number | null
}

type Filter = "all" | "agent-only" | "agent-allowed"
type Sort = "reward" | "competition"

function BountyCard({ b, browseUrl }: { b: BountyDTO; browseUrl: string }) {
  const agentOnly = b.agentAccess === "AGENT_ONLY"
  const rewardLabel =
    b.rewardAmount !== null
      ? `${b.rewardAmount.toLocaleString("en-US")} ${b.token}`
      : b.compensationType === "range" && b.maxRewardAsk
        ? `up to ${b.maxRewardAsk.toLocaleString("en-US")} ${b.token}`
        : "variable"

  return (
    <Card className="group animate-in fade-in-50 duration-500 transition-colors hover:border-emerald-500/30">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                {rewardLabel}
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase">
                {b.type}
              </Badge>
              {agentOnly ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="border-teal-500/40 bg-teal-500/10 text-teal-400">
                        <Lock className="mr-1 h-3 w-3" />
                        agent-only
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Hidden from public feeds — visible only via the agent API</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                  agent-allowed
                </Badge>
              )}
              {b.isFeatured && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                  <Trophy className="mr-1 h-3 w-3" />
                  featured
                </Badge>
              )}
            </div>
            <h3 className="mt-2 text-sm font-semibold leading-snug">{b.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {b.sponsorName && (
                <span className="flex items-center gap-1">
                  {b.sponsorLogo && (
                    <img
                      src={b.sponsorLogo}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {b.sponsorName}
                  {b.sponsorVerified && <span className="text-emerald-400">✓</span>}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" aria-hidden />
                {b.submissions} subs
              </span>
              {b.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden />
                  listed deadline {b.deadline.slice(0, 10)}
                </span>
              )}
              <span className="font-mono opacity-60">#{b.slug.slice(0, 24)}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <a href={browseUrl} target="_blank" rel="noopener noreferrer" aria-label="Browse on Superteam Earn">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function BountiesPanel({
  data,
  loading,
  refresh,
}: {
  data: BountiesPayload | null
  loading: boolean
  refresh: () => void
}) {
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<Sort>("reward")
  const [refreshing, setRefreshing] = useState(false)

  const list = useMemo(() => {
    let l = data?.bounties ?? []
    if (filter === "agent-only") l = l.filter((b) => b.agentAccess === "AGENT_ONLY")
    if (filter === "agent-allowed") l = l.filter((b) => b.agentAccess === "AGENT_ALLOWED")
    if (sort === "competition") l = [...l].sort((a, b) => a.submissions - b.submissions)
    return l
  }, [data, filter, sort])

  async function refetch() {
    setRefreshing(true)
    try {
      await fetch("/api/bounties?force=1", { cache: "no-store" })
      await refresh()
      toast.success("Bounty radar refreshed")
    } catch {
      toast.error("Refresh failed")
    } finally {
      setRefreshing(false)
    }
  }

  const counts = useMemo(() => {
    const all = data?.bounties ?? []
    return {
      all: all.length,
      agentOnly: all.filter((b) => b.agentAccess === "AGENT_ONLY").length,
      agentAllowed: all.filter((b) => b.agentAccess === "AGENT_ALLOWED").length,
    }
  }, [data])

  return (
    <div className="space-y-4">
      {/* Agent identity + claim rail */}
      <Card className="border-emerald-500/30 bg-emerald-500/[0.04]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    Registered on Superteam Earn
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      data?.source === "agent"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/40 text-amber-400"
                    }
                  >
                    {data?.source === "agent" ? "live agent feed" : "public fallback feed"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data?.username ? (
                    <>
                      Agent identity:{" "}
                      <code className="font-mono text-emerald-400">{data.username}</code> —
                      submissions accepted directly from this mission hub.
                    </>
                  ) : (
                    "Agent identity: registering…"
                  )}
                </p>
              </div>
            </div>
            {data?.claimCode && (
              <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
                <KeyRound className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                <div className="min-w-0">
                  <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Payout claim code
                  </div>
                  <div className="flex items-center gap-1">
                    <code className="font-mono text-sm font-semibold tracking-wide text-amber-400">
                      {data.claimCode}
                    </code>
                    <CopyButton text={data.claimCode} />
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="ml-2 shrink-0">
                  <a href={data.claimUrl ?? "#"} target="_blank" rel="noopener noreferrer">
                    Claim page
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            )}
          </div>
          {data?.claimCode && (
            <p className="mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
              When the agent wins a bounty, a human (you) redeems this claim code at the claim page
              to receive the USDC payout — that is the single manual step in the whole pipeline.
              Until then the agent researches listings and prepares submissions autonomously.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats + controls */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              <Satellite className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
              Open bounties
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {loading ? <Skeleton className="h-8 w-10" /> : counts.all}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              <Hash className="h-3.5 w-3.5 text-teal-400" aria-hidden />
              Agent-only
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-teal-400">
              {loading ? <Skeleton className="h-8 w-10" /> : counts.agentOnly}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
              Reward pool
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-emerald-400">
              {loading ? <Skeleton className="h-8 w-20" /> : fmtUsd(data?.totalPoolUsd ?? null)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex h-full items-center justify-end p-3">
            <Button variant="outline" size="sm" onClick={refetch} disabled={refreshing}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh radar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter bounties">
          {(
            [
              ["all", `all (${counts.all})`],
              ["agent-only", `agent-only (${counts.agentOnly})`],
              ["agent-allowed", `agent-allowed (${counts.agentAllowed})`],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-border text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          sort:
          <button
            onClick={() => setSort(sort === "reward" ? "competition" : "reward")}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-emerald-500/30"
          >
            {sort === "reward" ? "reward ↓" : "least competition ↑"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-3 h-4 w-full max-w-lg" />
                <Skeleton className="mt-2 h-3 w-56" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Satellite}
          title="No bounties match this filter"
          hint="The radar re-scans Superteam Earn every 5 minutes."
        />
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <BountyCard key={b.id} b={b} browseUrl={data?.browseUrl ?? "https://superteam.fun/earn/agents/listings"} />
          ))}
        </div>
      )}

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Submission pipeline
          </CardTitle>
          <CardDescription className="text-xs">
            How a bounty turns into income
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs leading-relaxed text-muted-foreground">
          1. The agent picks a skill-matched listing (e.g. the $3,000 Solana repo security audit). 2.
          It builds the deliverable in its sandbox and submits via the official agent submission
          API (link + notes + eligibility answers). 3. If the submission wins, you redeem the claim
          code above once — USDC lands at the public Solana address. 4. The wallet patrol detects
          the deposit within 15 minutes and logs it as mission income automatically.
        </CardContent>
      </Card>
    </div>
  )
}
