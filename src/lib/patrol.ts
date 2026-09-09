// Patrol engine: scans all monitored wallets, snapshots balances,
// and auto-detects balance increases as EarningEvents (incoming income).
import { db } from "@/lib/db"
import { CHAINS, fetchBalance, fetchPrices } from "@/lib/chains"
import type { WalletsPayload, WalletStatus } from "@/lib/types"

export interface PatrolSummary {
  at: string
  scanned: number
  ok: number
  failed: number
  earnings: { chain: string; symbol: string; amount: number; usdValue: number | null }[]
  totalUsd: number | null
  errors: { chain: string; error: string }[]
}

// Threshold for a delta to count as income (float-noise guard)
function deltaIsIncome(delta: number, prev: number): boolean {
  const eps = 1e-12 + Math.abs(prev) * 1e-9
  return delta > eps
}

/** Full scan: snapshot every wallet, record income deltas, return summary. */
export async function runPatrol(): Promise<PatrolSummary> {
  const wallets = await db.wallet.findMany({
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { chain: "asc" },
  })
  const prices = await fetchPrices()

  const summary: PatrolSummary = {
    at: new Date().toISOString(),
    scanned: wallets.length,
    ok: 0,
    failed: 0,
    earnings: [],
    totalUsd: null,
    errors: [],
  }

  let totalUsd = 0
  let anyPrice = false

  for (const w of wallets) {
    const info = CHAINS[w.chain]
    if (!info) continue
    try {
      const live = await fetchBalance(w.chain, w.address)
      if (!live.ok) throw new Error(live.error ?? "fetch failed")
      summary.ok += 1
      const price = prices[w.chain] ?? null
      const usdValue = price ? live.balance * price : null
      if (price) anyPrice = true
      if (usdValue !== null) totalUsd += usdValue

      const prev = w.snapshots[0]?.balance ?? null
      await db.snapshot.create({
        data: { walletId: w.id, balance: live.balance, usdValue },
      })

      if (prev !== null) {
        const delta = live.balance - prev
        if (deltaIsIncome(delta, prev)) {
          const earning = {
            chain: w.chain,
            symbol: info.symbol,
            amount: delta,
            usdValue: usdValue !== null ? delta * price! : null,
          }
          summary.earnings.push(earning)
          await db.earningEvent.create({
            data: {
              chain: w.chain,
              symbol: info.symbol,
              amount: delta,
              usdValue: earning.usdValue,
              source: "auto",
              note: "Auto-detected balance increase during patrol scan",
            },
          })
        }
      }
    } catch (err) {
      summary.failed += 1
      const message = err instanceof Error ? err.message : String(err)
      summary.errors.push({ chain: w.chain, error: message })
    }
  }

  summary.totalUsd = anyPrice ? totalUsd : null
  return summary
}

/** Read-only status: live balances + latest two snapshots for the UI. */
export async function getWalletStatus(): Promise<WalletsPayload> {
  const wallets = await db.wallet.findMany({
    include: { snapshots: { orderBy: { createdAt: "desc" }, take: 2 } },
    orderBy: { chain: "asc" },
  })
  const prices = await fetchPrices()

  let totalUsd = 0
  const statuses: WalletStatus[] = await Promise.all(
    wallets.map(async (w) => {
      const info = CHAINS[w.chain]
      const live = await fetchBalance(w.chain, w.address).catch(() => null)
      const balance = live?.ok ? live.balance : null
      const price = prices[w.chain] ?? null
      const usdValue = balance !== null && price !== null ? balance * price : null
      if (usdValue !== null) totalUsd += usdValue
      const latest = w.snapshots[0]
      const previous = w.snapshots[1] ?? null
      return {
        chain: w.chain,
        name: info?.name ?? w.chain,
        symbol: info?.symbol ?? "???",
        address: w.address,
        accentClass: info?.accentClass ?? "",
        explorerUrl: info ? info.explorerUrl(w.address) : "#",
        balance,
        usdValue,
        prevBalance: previous?.balance ?? null,
        change:
          latest && previous ? latest.balance - previous.balance : null,
        lastScanAt: latest?.createdAt?.toISOString() ?? null,
        ok: live?.ok ?? false,
        error: live?.error,
      }
    }),
  )

  return {
    wallets: statuses,
    totalUsd,
    prices,
    generatedAt: new Date().toISOString(),
  }
}
