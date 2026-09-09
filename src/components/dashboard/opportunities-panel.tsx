"use client"

// Opportunities tab: researched board with status management + additions.
import { useMemo, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Bot,
  ExternalLink,
  Plus,
  Sprout,
  Target,
  Trash2,
  User,
  Wrench,
  Rocket,
} from "lucide-react"
import {
  CategoryBadge,
  StatusBadge,
  timeAgo,
  useApi,
} from "./bits"
import type { OpportunityDTO } from "@/lib/types"

const FILTERS = ["all", "earning", "active", "researching", "new", "dead"] as const

const EFFORT_ICONS: Record<string, typeof Sprout> = {
  low: Sprout,
  medium: Wrench,
  high: Rocket,
}

function OpportunityCard({
  o,
  onStatusChange,
  onDelete,
}: {
  o: OpportunityDTO
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const EffortIcon = EFFORT_ICONS[o.effort] ?? Wrench
  const isExternal = /^https?:\/\//.test(o.url)

  return (
    <Card className="animate-in fade-in-50 duration-500 transition-colors hover:border-emerald-500/30">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold leading-tight">{o.name}</h3>
              <StatusBadge status={o.status} />
              <CategoryBadge category={o.category} />
              <Badge
                variant="outline"
                className={
                  o.autonomous
                    ? "border-emerald-500/30 text-emerald-400"
                    : "border-muted-foreground/30 text-muted-foreground"
                }
              >
                {o.autonomous ? (
                  <>
                    <Bot className="mr-1 h-3 w-3" /> agent
                  </>
                ) : (
                  <>
                    <User className="mr-1 h-3 w-3" /> manual
                  </>
                )}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.description}</p>
            {o.notes && (
              <p className="mt-2 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                {o.notes}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isExternal && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={o.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${o.name}`}>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400" aria-label={`Remove ${o.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove this opportunity?</AlertDialogTitle>
                  <AlertDialogDescription>
                    “{o.name}” will be removed from the board. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500/90 hover:bg-red-500"
                    onClick={() => onDelete(o.id)}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <EffortIcon className="h-3.5 w-3.5" />
              {o.effort} effort
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              payout: {o.payout}
            </span>
            <span>updated {timeAgo(o.updatedAt)}</span>
          </div>
          <Select value={o.status} onValueChange={(v) => onStatusChange(o.id, v)}>
            <SelectTrigger className="h-7 w-[130px] text-xs" aria-label={`Status for ${o.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["new", "researching", "active", "earning", "dead"].map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

function AddOpportunityDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: "",
    category: "dev",
    url: "",
    description: "",
    effort: "medium",
    payout: "unknown",
    autonomous: true,
    notes: "",
  })

  async function submit() {
    if (form.name.length < 2 || form.url.length < 3) {
      toast.error("Name and URL are required")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          description: form.description || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success("Opportunity added to the board")
      setOpen(false)
      setForm({
        name: "",
        category: "dev",
        url: "",
        description: "",
        effort: "medium",
        payout: "unknown",
        autonomous: true,
        notes: "",
      })
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add opportunity")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add opportunity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an opportunity</DialogTitle>
          <DialogDescription>
            Track a new zero-capital earning lane on the board.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="opp-name">Name</Label>
            <Input
              id="opp-name"
              placeholder="e.g. New agent marketplace"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["dev", "content", "funding", "bounty", "learn", "faucet", "airdrop"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Effort</Label>
              <Select value={form.effort} onValueChange={(v) => setForm({ ...form, effort: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opp-url">URL</Label>
              <Input
                id="opp-url"
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payout</Label>
              <Select value={form.payout} onValueChange={(v) => setForm({ ...form, payout: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["zero", "dust", "small", "variable", "unknown"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-desc">Description</Label>
            <Textarea
              id="opp-desc"
              rows={2}
              placeholder="What is it and what does it pay?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-notes">Notes / warnings</Label>
            <Textarea
              id="opp-notes"
              rows={2}
              placeholder="Constraints, ToS warnings, payout rail details…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-emerald-400" />
              Agent-pursuable (no accounts / keys / CAPTCHA)
            </div>
            <Switch
              checked={form.autonomous}
              onCheckedChange={(v) => setForm({ ...form, autonomous: v })}
              aria-label="Agent-pursuable"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : "Add to board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function OpportunitiesPanel({ refresh }: { refresh: () => void }) {
  const { data, loading } = useApi<{ opportunities: OpportunityDTO[] }>("/api/opportunities")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all")

  const list = useMemo(() => {
    const all = data?.opportunities ?? []
    return filter === "all" ? all : all.filter((o) => o.status === filter)
  }, [data, filter])

  const counts = useMemo(() => {
    const all = data?.opportunities ?? []
    const map: Record<string, number> = { all: all.length }
    for (const o of all) map[o.status] = (map[o.status] ?? 0) + 1
    return map
  }, [data])

  async function onStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success(`Status → ${status}`)
      refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Status update failed")
    }
  }

  async function onDelete(id: string) {
    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success("Removed from board")
      refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter opportunities by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-border text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
              }`}
            >
              {f}
              <span className="ml-1 text-[10px] opacity-70">{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
        <AddOpportunityDialog onCreated={refresh} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="mt-3 h-4 w-full max-w-lg" />
                <Skeleton className="mt-2 h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {list.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No opportunities with status “{filter}”.
              </CardContent>
            </Card>
          ) : (
            list.map((o) => (
              <OpportunityCard key={o.id} o={o} onStatusChange={onStatusChange} onDelete={onDelete} />
            ))
          )}
        </div>
      )}

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            How this board is used
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs leading-relaxed text-muted-foreground">
          Every entry was researched via live web search (scam-checked, ToS-checked). The agent
          works <span className="text-emerald-400">agent-pursuable</span> lanes autonomously and
          keeps statuses honest — <span className="text-foreground">earning</span> only appears
          after a verified payout. Dead lanes are kept visible so the same trap is never walked
          twice.
        </CardContent>
      </Card>
    </div>
  )
}
