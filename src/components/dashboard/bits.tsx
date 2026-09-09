"use client"

// Shared client utilities: data hook, formatters, small building blocks.
import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { LucideIcon } from "lucide-react"
import { Bitcoin, Coins, Swords, Layers, Zap } from "lucide-react"

// ---------- data hook ----------

export function useApi<T>(url: string, intervalMs?: number) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as T
      if (mounted.current) {
        setData(json)
        setError(null)
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [url])

  useEffect(() => {
    mounted.current = true
    load()
    let timer: ReturnType<typeof setInterval> | undefined
    if (intervalMs) timer = setInterval(load, intervalMs)
    return () => {
      mounted.current = false
      if (timer) clearInterval(timer)
    }
  }, [load, intervalMs])

  return { data, loading, error, refresh: load }
}

// ---------- formatters ----------

export function fmtNum(n: number | null | undefined, maxDigits = 8): string {
  if (n === null || n === undefined) return "—"
  if (n === 0) return "0"
  if (Math.abs(n) < 0.000001) return n.toExponential(2)
  return n.toLocaleString("en-US", { maximumFractionDigits: maxDigits })
}

export function fmtUsd(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—"
  const digits = Math.abs(n) > 0 && Math.abs(n) < 1 ? 6 : 2
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: digits })}`
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—"
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 0) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function truncateAddr(addr: string, head = 8, tail = 6): string {
  if (addr.length <= head + tail + 3) return addr
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`
}

// ---------- building blocks ----------

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-7 w-7 ${className ?? ""}`}
      aria-label="Copy to clipboard"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          toast.error("Clipboard unavailable")
        }
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

const CHAIN_ICONS: Record<string, LucideIcon> = {
  bitcoin: Bitcoin,
  ethereum: Coins,
  ronin: Swords,
  solana: Layers,
  tron: Zap,
}

export function ChainIcon({ chain, className }: { chain: string; className?: string }) {
  const Icon = CHAIN_ICONS[chain] ?? Coins
  return <Icon className={className} aria-hidden />
}

const STATUS_STYLES: Record<string, string> = {
  earning: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  researching: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  new: "border-border bg-muted text-muted-foreground",
  dead: "border-red-500/30 bg-red-500/10 text-red-400 line-through decoration-red-400/50",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-[11px] uppercase tracking-wide ${STATUS_STYLES[status] ?? STATUS_STYLES.new}`}>
      {status}
    </Badge>
  )
}

const CATEGORY_STYLES: Record<string, string> = {
  dev: "border-emerald-500/30 text-emerald-400",
  content: "border-amber-500/30 text-amber-400",
  funding: "border-rose-500/30 text-rose-400",
  bounty: "border-orange-500/30 text-orange-400",
  learn: "border-teal-500/30 text-teal-400",
  faucet: "border-border text-muted-foreground",
  airdrop: "border-stone-500/30 text-stone-400",
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <Badge variant="outline" className={`text-[11px] ${CATEGORY_STYLES[category] ?? "border-border text-muted-foreground"}`}>
      {category}
    </Badge>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  loading,
  valueClass,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  loading?: boolean
  valueClass?: string
}) {
  return (
    <Card className="animate-in fade-in-50 duration-500">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 text-emerald-400" aria-hidden />
          <span className="text-[11px] font-medium uppercase tracking-widest">{label}</span>
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-28" />
        ) : (
          <div className={`mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight ${valueClass ?? ""}`}>
            {value}
          </div>
        )}
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export function EmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/50" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  )
}
