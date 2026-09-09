// Shared API payload types (frontend <-> backend)

export interface WalletStatus {
  chain: string
  name: string
  symbol: string
  address: string
  accentClass: string
  explorerUrl: string
  balance: number | null
  usdValue: number | null
  prevBalance: number | null
  change: number | null
  lastScanAt: string | null
  history: { t: string; v: number }[]
  ok: boolean
  error?: string
}

export interface WalletsPayload {
  wallets: WalletStatus[]
  totalUsd: number
  prices: Record<string, number | null>
  generatedAt: string
}

export interface EarningEventDTO {
  id: string
  chain: string
  symbol: string
  amount: number
  usdValue: number | null
  note: string | null
  source: string
  detectedAt: string
}

export interface EarningsPayload {
  events: EarningEventDTO[]
  totals: { symbol: string; amount: number; usdValue: number }[]
  totalUsd: number
}

export interface OpportunityDTO {
  id: string
  name: string
  category: string
  url: string
  description: string
  effort: string
  payout: string
  autonomous: boolean
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface AgentRunDTO {
  id: string
  task: string
  status: string
  summary: string
  createdAt: string
}

export interface AgentPayload {
  runs: AgentRunDTO[]
  totalRuns: number
  lastRunAt: string | null
  repoUrl: string | null
  worklogTail: string
}

export interface PatrolResultPayload {
  at: string
  scanned: number
  ok: number
  failed: number
  earnings: { chain: string; symbol: string; amount: number; usdValue: number | null }[]
  totalUsd: number | null
  errors: { chain: string; error: string }[]
}

export const OPPORTUNITY_STATUSES = [
  "new",
  "researching",
  "active",
  "earning",
  "dead",
] as const

export const OPPORTUNITY_CATEGORIES = [
  "dev",
  "content",
  "funding",
  "bounty",
  "learn",
  "faucet",
  "airdrop",
] as const
