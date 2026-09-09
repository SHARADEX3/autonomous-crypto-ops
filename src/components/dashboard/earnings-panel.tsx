"use client"

// Earnings tab: totals by asset, full event log, manual logging.
import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { HandCoins, Plus } from "lucide-react"
import { ChainIcon, EmptyState, fmtNum, fmtUsd, timeAgo } from "./bits"
import type { EarningsPayload } from "@/lib/types"

const CHAIN_OPTIONS = [
  { value: "bitcoin", symbol: "BTC" },
  { value: "ethereum", symbol: "ETH" },
  { value: "ronin", symbol: "RON" },
  { value: "solana", symbol: "SOL" },
  { value: "tron", symbol: "TRX" },
]

export function EarningsPanel({
  data,
  loading,
  refresh,
}: {
  data: EarningsPayload | null
  loading: boolean
  refresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [chain, setChain] = useState("solana")
  const [amount, setAmount] = useState("")
  const [usdValue, setUsdValue] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Amount must be a positive number")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/earnings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chain,
          amount: amt,
          usdValue: usdValue ? Number(usdValue) : undefined,
          note: note || undefined,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success(`Logged ${amt} ${CHAIN_OPTIONS.find((c) => c.value === chain)?.symbol}`)
      setOpen(false)
      setAmount("")
      setUsdValue("")
      setNote("")
      refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to log earning")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Total earned (USD)
            </div>
            <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-emerald-400">
              {loading ? <Skeleton className="h-8 w-24" /> : fmtUsd(data?.totalUsd ?? 0)}
            </div>
          </CardContent>
        </Card>
        {(data?.totals ?? []).slice(0, 3).map((t) => (
          <Card key={t.symbol}>
            <CardContent className="p-4">
              <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                {t.symbol} earned
              </div>
              <div className="mt-1.5 font-mono text-2xl font-semibold tabular-nums">
                {fmtNum(t.amount)}
              </div>
              <div className="text-xs tabular-nums text-muted-foreground">{fmtUsd(t.usdValue)}</div>
            </CardContent>
          </Card>
        ))}
        {(data?.totals.length ?? 0) === 0 && (
          <Card className="col-span-1 hidden sm:block">
            <CardContent className="p-4 text-xs text-muted-foreground">
              Per-asset totals appear here once the first income lands.
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <HandCoins className="h-4 w-4 text-emerald-400" aria-hidden />
              Income log
            </CardTitle>
            <CardDescription>
              Every event is either auto-detected by the wallet patrol or manually logged
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Log earning
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log an earning</DialogTitle>
                <DialogDescription>
                  Record income received outside the watched addresses (e.g. claim-code payouts,
                  tips on other rails).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="earning-chain">Chain</Label>
                    <Select value={chain} onValueChange={setChain}>
                      <SelectTrigger id="earning-chain">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHAIN_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="earning-amount">Amount</Label>
                    <Input
                      id="earning-amount"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="earning-usd">USD value (optional)</Label>
                  <Input
                    id="earning-usd"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="auto-estimated if omitted"
                    value={usdValue}
                    onChange={(e) => setUsdValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="earning-note">Note (optional)</Label>
                  <Input
                    id="earning-note"
                    placeholder="e.g. Superteam bounty #123 payout"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submit} disabled={submitting}>
                  {submitting ? "Saving…" : "Save event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {(data?.events.length ?? 0) === 0 && !loading ? (
            <EmptyState
              icon={HandCoins}
              title="No income events yet"
              hint="The patrol auto-detects deposits. Manual logging captures payouts received elsewhere."
            />
          ) : (
            <div className="max-h-96 overflow-y-auto scroll-thin rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">USD</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="hidden md:table-cell">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.events ?? []).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {timeAgo(e.detectedAt)}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-sm">
                          <ChainIcon chain={e.chain} className="h-3.5 w-3.5 text-muted-foreground" />
                          {e.symbol}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-emerald-400">
                        +{fmtNum(e.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {e.usdValue !== null ? fmtUsd(e.usdValue) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            e.source === "auto"
                              ? "border-emerald-500/30 text-emerald-400"
                              : "border-amber-500/30 text-amber-400"
                          }
                        >
                          {e.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] truncate text-xs text-muted-foreground md:table-cell">
                        {e.note ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
