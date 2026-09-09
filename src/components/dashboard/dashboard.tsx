"use client"

// Autonomous Crypto Ops — mission control (single / route).
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Radar,
  RefreshCw,
  Sun,
  Moon,
  HandCoins,
  Target,
  Activity,
  Wallet,
} from "lucide-react"
import { Overview } from "./overview"
import { EarningsPanel } from "./earnings-panel"
import { OpportunitiesPanel } from "./opportunities-panel"
import { MissionLog } from "./mission-log"
import { StrategyPanel } from "./strategy-panel"
import { BountiesPanel } from "./bounties-panel"
import { StatCard, fmtUsd, timeAgo, useApi } from "./bits"
import type {
  AgentPayload,
  EarningsPayload,
  WalletsPayload,
} from "@/lib/types"
import type { BountiesPayload } from "@/lib/bounties"

interface RefreshPayload {
  ok?: number
  scanned?: number
  failed?: number
  earnings?: { chain: string; symbol: string; amount: number }[]
}

export default function Dashboard() {
  const { theme, setTheme } = useTheme()
  const [scanning, setScanning] = useState(false)
  // Hydration guard: next-themes resolves the theme on the client only.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const wallets = useApi<WalletsPayload>("/api/wallets", 120_000)
  const earnings = useApi<EarningsPayload>("/api/earnings", 120_000)
  const agent = useApi<AgentPayload>("/api/agent", 120_000)
  const opportunities = useApi<{ opportunities: { status: string; autonomous: boolean }[] }>(
    "/api/opportunities",
  )
  const bounties = useApi<BountiesPayload>("/api/bounties", 300_000)

  const oppList = opportunities.data?.opportunities ?? []
  const activeLanes = oppList.filter((o) => o.autonomous && ["active", "researching", "new"].includes(o.status)).length
  const totalOpportunities = oppList.length
  const eventCount = earnings.data?.events?.length ?? 0

  const lastRun = agent.data?.lastRunAt ?? null
  const lastRunAgeMs = lastRun ? Date.now() - new Date(lastRun).getTime() : null
  const agentOnline = lastRunAgeMs !== null && lastRunAgeMs < 20 * 60 * 1000

  async function scanNow() {
    setScanning(true)
    try {
      const res = await fetch("/api/wallets/refresh", { method: "POST" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const payload = (await res.json()) as RefreshPayload
      const detected = payload.earnings ?? []
      if (detected.length > 0) {
        toast.success(
          `Income detected: ${detected.map((e) => `+${e.amount} ${e.symbol}`).join(", ")}`,
          { description: "Logged automatically as mission income." },
        )
      } else {
        toast.info(
          `Scan complete — ${payload.ok ?? "?"}/${payload.scanned ?? "?"} chains reachable, no new income.`,
        )
      }
      await Promise.all([wallets.refresh(), earnings.refresh(), agent.refresh()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed")
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground">
      <div aria-hidden className="mission-grid pointer-events-none fixed inset-0 z-0" />

      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Radar className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-mono text-sm font-bold uppercase tracking-[0.2em] sm:text-base">
                Autonomous Crypto Ops
              </h1>
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                Goal: earn crypto · $0 capital · 5 chains monitored · no keys held
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:flex ${
                agentOnline
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-400"
              }`}
              role="status"
              aria-label="Agent status"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${agentOnline ? "bg-emerald-400 pulse-dot" : "bg-amber-400"}`}
                aria-hidden
              />
              {agentOnline
                ? "AGENT ONLINE"
                : agent.data && agent.data.totalRuns > 0
                  ? `IDLE · last ${timeAgo(lastRun)}`
                  : "AWAITING FIRST CYCLE"}
            </div>

            <Button onClick={scanNow} disabled={scanning} size="sm" className="min-w-[110px]">
              <RefreshCw className={`mr-1.5 h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
              {scanning ? "Scanning…" : "Scan now"}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <section aria-label="Key metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Wallet}
            label="Portfolio value"
            value={wallets.data ? fmtUsd(wallets.data.totalUsd) : "…"}
            sub={
              wallets.data
                ? `live · ${wallets.data.wallets?.length ?? 0} chains · prices refresh 10 min`
                : "fetching live balances"
            }
            loading={wallets.loading}
          />
          <StatCard
            icon={HandCoins}
            label="Earnings detected"
            value={earnings.data ? fmtUsd(earnings.data.totalUsd) : "…"}
            sub={
              earnings.data
                ? `${eventCount} event${eventCount === 1 ? "" : "s"} logged`
                : "loading income log"
            }
            loading={earnings.loading}
            valueClass="text-emerald-400"
          />
          <StatCard
            icon={Target}
            label="Agent-pursuable lanes"
            value={opportunities.data ? `${activeLanes}/${totalOpportunities}` : "…"}
            sub={
              opportunities.data
                ? "researched, scam-checked, ToS-checked"
                : "loading opportunity board"
            }
            loading={opportunities.loading}
          />
          <StatCard
            icon={Activity}
            label="Agent cycles"
            value={agent.data ? String(agent.data.totalRuns ?? 0) : "…"}
            sub={
              agent.data?.lastRunAt
                ? `last wake-up ${timeAgo(agent.data.lastRunAt)}`
                : "scheduled every 15 minutes"
            }
            loading={agent.loading}
          />
        </section>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="overflow-x-auto scroll-thin">
            <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview" className="px-4 py-1.5 text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="bounties" className="gap-1.5 px-4 py-1.5 text-xs sm:text-sm">
                Bounties
                {(bounties.data?.bounties?.length ?? 0) > 0 && (
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                    {bounties.data?.bounties?.length ?? 0}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="earnings" className="px-4 py-1.5 text-xs sm:text-sm">
                Earnings
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="px-4 py-1.5 text-xs sm:text-sm">
                Opportunities
              </TabsTrigger>
              <TabsTrigger value="mission" className="px-4 py-1.5 text-xs sm:text-sm">
                Mission Log
              </TabsTrigger>
              <TabsTrigger value="strategy" className="px-4 py-1.5 text-xs sm:text-sm">
                Strategy
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0">
            <Overview
              walletsData={wallets.data}
              earningsData={earnings.data}
              repoUrl={agent.data?.repoUrl ?? null}
              totalRuns={agent.data?.totalRuns ?? 0}
            />
          </TabsContent>

          <TabsContent value="bounties" className="mt-0">
            <BountiesPanel
              data={bounties.data}
              loading={bounties.loading}
              refresh={bounties.refresh}
            />
          </TabsContent>

          <TabsContent value="earnings" className="mt-0">
            <EarningsPanel
              data={earnings.data}
              loading={earnings.loading}
              refresh={() => {
                earnings.refresh()
                agent.refresh()
              }}
            />
          </TabsContent>

          <TabsContent value="opportunities" className="mt-0">
            <OpportunitiesPanel refresh={opportunities.refresh} />
          </TabsContent>

          <TabsContent value="mission" className="mt-0">
            <MissionLog data={agent.data} loading={agent.loading} refresh={agent.refresh} />
          </TabsContent>

          <TabsContent value="strategy" className="mt-0">
            <StrategyPanel
              wallets={wallets.data?.wallets ?? null}
              repoUrl={agent.data?.repoUrl ?? null}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="relative z-10 mt-auto border-t bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Autonomous Crypto Ops · $0 capital · public addresses only
          </p>
          <p className="text-[10px] text-muted-foreground">
            BTC · ETH · RON · SOL · TRX — tips keep the mission running (Strategy tab)
          </p>
        </div>
      </footer>
    </div>
  )
}
