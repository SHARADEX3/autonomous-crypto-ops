// Chain registry + public RPC/explorer adapters for balance monitoring.
// All endpoints are free, keyless, server-side only.

export interface ChainInfo {
  id: string
  name: string
  symbol: string
  coingeckoId: string
  decimals: number
  accentClass: string
  explorerUrl: (address: string) => string
}

export const CHAIN_LIST: ChainInfo[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    coingeckoId: "bitcoin",
    decimals: 8,
    accentClass: "text-orange-400",
    explorerUrl: (a) => `https://blockstream.info/address/${a}`,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    coingeckoId: "ethereum",
    decimals: 18,
    accentClass: "text-emerald-400",
    explorerUrl: (a) => `https://etherscan.io/address/${a}`,
  },
  {
    id: "ronin",
    name: "Ronin",
    symbol: "RON",
    coingeckoId: "ronin",
    decimals: 18,
    accentClass: "text-rose-400",
    explorerUrl: (a) => `https://app.roninchain.com/address/${a}`,
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    coingeckoId: "solana",
    decimals: 9,
    accentClass: "text-teal-300",
    explorerUrl: (a) => `https://solscan.io/account/${a}`,
  },
  {
    id: "tron",
    name: "Tron",
    symbol: "TRX",
    coingeckoId: "tron",
    decimals: 6,
    accentClass: "text-red-400",
    explorerUrl: (a) => `https://tronscan.org/#/address/${a}`,
  },
]

export const CHAINS: Record<string, ChainInfo> = Object.fromEntries(
  CHAIN_LIST.map((c) => [c.id, c]),
)

export interface BalanceResult {
  ok: boolean
  balance: number
  error?: string
}

async function jsonFetch(
  url: string,
  init?: RequestInit,
  timeoutMs = 12000,
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as Record<string, unknown>
}

async function evmBalance(rpcUrls: string[], address: string): Promise<BalanceResult> {
  let lastError = ""
  for (const rpc of rpcUrls) {
    try {
      const j = await jsonFetch(rpc, {
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [address, "latest"],
        }),
      })
      const raw = typeof j.result === "string" ? j.result : "0x0"
      const wei = BigInt(raw)
      // 12-decimal precision, then scale — avoids float noise below 1e-6
      return { ok: true, balance: Number(wei / 10n ** 12n) / 1e6 }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }
  return { ok: false, balance: 0, error: lastError }
}

export async function fetchBalance(chainId: string, address: string): Promise<BalanceResult> {
  switch (chainId) {
    case "bitcoin": {
      // mempool.space primary, blockstream fallback
      try {
        const j = await jsonFetch(`https://mempool.space/api/address/${address}`)
        const stats = (j.chain_stats ?? {}) as Record<string, number>
        const sats = (stats.funded_txo_sum ?? 0) - (stats.spent_txo_sum ?? 0)
        return { ok: true, balance: sats / 1e8 }
      } catch {
        const j = await jsonFetch(`https://blockstream.info/api/address/${address}`)
        const stats = (j.chain_stats ?? {}) as Record<string, number>
        const sats = (stats.funded_txo_sum ?? 0) - (stats.spent_txo_sum ?? 0)
        return { ok: true, balance: sats / 1e8 }
      }
    }
    case "ethereum":
      return evmBalance(
        ["https://eth.llamarpc.com", "https://cloudflare-eth.com"],
        address,
      )
    case "ronin":
      return evmBalance(["https://api.roninchain.com/rpc"], address)
    case "solana": {
      const j = await jsonFetch("https://api.mainnet-beta.solana.com", {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
      })
      const result = (j.result ?? {}) as Record<string, unknown>
      const lamports = typeof result.value === "number" ? result.value : 0
      return { ok: true, balance: lamports / 1e9 }
    }
    case "tron": {
      try {
        const j = await jsonFetch(`https://api.trongrid.io/v1/accounts/${address}`)
        const data = (j.data ?? []) as Array<Record<string, unknown>>
        const sun = typeof data[0]?.balance === "number" ? (data[0].balance as number) : 0
        return { ok: true, balance: sun / 1e6 }
      } catch {
        const j2 = await jsonFetch(
          `https://apilist.tronscanapi.com/api/accountv2?address=${address}`,
        )
        const sun = typeof j2.balance === "number" ? j2.balance : 0
        return { ok: true, balance: sun / 1e6 }
      }
    }
    default:
      return { ok: false, balance: 0, error: `unknown chain: ${chainId}` }
  }
}

// ---- USD price cache (Coinbase primary, CoinGecko fallback; 10-minute TTL) ----

let priceCache: { at: number; prices: Record<string, number | null> } | null = null
const PRICE_TTL_MS = 10 * 60 * 1000

async function coinbasePrices(): Promise<Record<string, number | null>> {
  const prices: Record<string, number | null> = {}
  await Promise.all(
    CHAIN_LIST.map(async (c) => {
      try {
        const j = await jsonFetch(
          `https://api.coinbase.com/v2/prices/${c.symbol}-USD/spot`,
          undefined,
          8000,
        )
        const data = j.data as Record<string, unknown> | undefined
        const amount = data ? Number(data.amount) : NaN
        prices[c.id] = Number.isFinite(amount) ? amount : null
      } catch {
        prices[c.id] = null
      }
    }),
  )
  return prices
}

export async function fetchPrices(): Promise<Record<string, number | null>> {
  if (priceCache && Date.now() - priceCache.at < PRICE_TTL_MS) {
    return priceCache.prices
  }
  // Primary: Coinbase (one spot quote per chain, very lenient limits)
  try {
    const prices = await coinbasePrices()
    if (Object.values(prices).some((p) => p !== null)) {
      priceCache = { at: Date.now(), prices }
      return prices
    }
  } catch {
    // fall through to CoinGecko
  }
  // Fallback: CoinGecko simple price
  const ids = CHAIN_LIST.map((c) => c.coingeckoId).join(",")
  try {
    const j = await jsonFetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    )
    const prices: Record<string, number | null> = {}
    for (const c of CHAIN_LIST) {
      const entry = j[c.coingeckoId] as Record<string, unknown> | undefined
      prices[c.id] = typeof entry?.usd === "number" ? entry.usd : null
    }
    priceCache = { at: Date.now(), prices }
    return prices
  } catch {
    // serve stale if possible, otherwise nulls
    return priceCache?.prices ?? Object.fromEntries(CHAIN_LIST.map((c) => [c.id, null]))
  }
}
