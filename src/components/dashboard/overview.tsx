"use client"

// Overview tab: wallet grid, recent income, mission phase progress.
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ExternalLink, TrendingDown, TrendingUp, CircleAlert, Bot, HandCoins } from "lucide-react"
import {
  ChainIcon,
  CopyButton,
  EmptyState,
  fmtNum,
  fmtUsd,
  timeAgo,
  truncateAddr,
} from "./bits"
import type { EarningsPayload, WalletStatus, WalletsPayload } from "@/lib/types"
import type { LucideIcon } from "lucide-react"
import { Radar, Rocket, Megaphone, HandCoins as TipsIcon } from "lucide-react"

function WalletCard({ w }: { w: WalletStatus }) {
  const change = w.change
  return (
    <Card className="group animate-in fade-in-50 duration-500 transition-colors hover:border-emerald-500/30">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
              <ChainIcon chain={w.chain} className={`h-5 w-5 ${w.accentClass}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{w.name}</span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {w.symbol}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {w.ok ? "live" : "unavailable"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <CopyButton text={w.address} />
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={w.explorerUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${w.name} address on explorer`}>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-2">
          <div className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
            {fmtNum(w.balance)}
          </div>
          {change !== null && change !== 0 && (
            <Badge
              variant="outline"
              className={
                change > 0
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/40 bg-red-500/10 text-red-400"
              }
            >
              {change > 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {change > 0 ? "+" : ""}
              {fmtNum(change)}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {w.usdValue !== null ? fmtUsd(w.usdValue) : "—"}
          {w.balance === 0 && w.ok && " · empty wallet"}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <code className="cursor-default font-mono text-[11px] text-muted-foreground">
                  {truncateAddr(w.address, 10, 8)}
                </code>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px] break-all">
                <span className="font-mono text-[11px]">{w.address}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {w.lastScanAt ? `scanned ${timeAgo(w.lastScanAt)}` : "never scanned"}
          </span>
        </div>

        {!w.ok && w.error && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-500">
            <CircleAlert className="h-3.5 w-3.5" />
            <span className="truncate">RPC error: {w.error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PhaseRow({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: number
  hint: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-emerald-400" aria-hidden />
          {label}
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" />
      <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  )
}

export function Overview({
  walletsData,
  earningsData,
  repoUrl,
  totalRuns,
}: {
  walletsData: WalletsPayload | null
  earningsData: EarningsPayload | null
  repoUrl: string | null
  totalRuns: number
}) {
  const recent = earningsData?.events.slice(0, 6) ?? []

  const phases: { icon: LucideIcon; label: string; value: number; hint: string }[] = [
    {
      icon: Radar,
      label: "1 · Infrastructure",
      value: 100,
      hint: "Ops hub online: 5-chain wallet patrol, earnings detection, opportunity intel, autonomous wake-up loop.",
    },
    {
      icon: Rocket,
      label: "2 · Published assets",
      value: repoUrl ? 100 : 25,
      hint: repoUrl
        ? "Code published to GitHub with tip-rail README — durable, compounding, retro-funding eligible."
        : "Repo not yet published — agent pushes the codebase to GitHub during this session.",
    },
    {
      icon: Megaphone,
      label: "3 · Distribution",
      value: Math.min(100, totalRuns * 3),
      hint: "Agent cycles improve the assets every 15 minutes; content and tools accumulate pull over time.",
    },
    {
      icon: TipsIcon,
      label: "4 · Income",
      value:
        earningsData && earningsData.totalUsd > 0
          ? Math.min(100, Math.round(earningsData.totalUsd * 10))
          : 0,
      hint: "Every balance increase on any watched chain is auto-detected and logged as income.",
    },
  ]

  return (
    <div className="space-y-6">
      <section aria-label="Monitored wallets" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {walletsData
          ? walletsData.wallets.map((w) => <WalletCard key={w.chain} w={w} />)
          : Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="mt-4 h-8 w-32" />
                  <Skeleton className="mt-2 h-3 w-20" />
                  <Skeleton className="mt-3 h-3 w-40" />
                </CardContent>
              </Card>
            ))}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HandCoins className="h-4 w-4 text-emerald-400" aria-hidden />
              Recent income
            </CardTitle>
            <CardDescription>
              Auto-detected balance increases across all watched chains
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState
                icon={HandCoins}
                title="No income detected yet"
                hint="This is expected in phase 1. The patrol scans all 5 chains every 15 minutes — any deposit lands here automatically."
              />
            ) : (
              <ul className="space-y-2.5">
                {recent.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <ChainIcon chain={e.chain} className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium tabular-nums text-emerald-400">
                        +{fmtNum(e.amount)} {e.symbol}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {e.source}
                      </Badge>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {e.usdValue !== null ? fmtUsd(e.usdValue) : "—"} · {timeAgo(e.detectedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Radar className="h-4 w-4 text-emerald-400" aria-hidden />
              Mission phases
            </CardTitle>
            <CardDescription>The compounding strategy, honestly measured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {phases.map((p) => (
              <PhaseRow key={p.label} {...p} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
          <Bot className="h-8 w-8 shrink-0 text-emerald-400" aria-hidden />
          <div className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Primary revenue path:</span> the agent
            competes for <span className="text-emerald-400">Superteam Earn</span> bounties
            ($150–$5,000 USDC each) through its official Agent API — no KYC, no CAPTCHA, payouts
            received directly at the public Solana address. See the{" "}
            <span className="text-foreground">Opportunities</span> tab for the full researched
            board.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
