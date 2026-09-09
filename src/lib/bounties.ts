// Superteam Earn bounty radar — authenticated agent feed with public fallback.
// Credentials live in the gitignored .agent-credentials.json (hot-reloadable,
// no dev-server restart needed — Prisma models added at runtime aren't visible
// to the already-running global PrismaClient).
import { readFile } from "fs/promises"

const BASE_URL = "https://superteam.fun"
const PUBLIC_LISTINGS_URL = "https://earn.superteam.fun/api/listings"
const CRED_FILE = "/home/z/my-project/.agent-credentials.json"

interface Credential {
  platform: string
  agentId: string
  username: string
  apiKey: string
  claimCode: string
}

async function getCredential(): Promise<Credential | null> {
  try {
    const raw = await readFile(CRED_FILE, "utf8")
    const cred = JSON.parse(raw) as Credential
    return cred.apiKey ? cred : null
  } catch {
    return null
  }
}

export interface BountyDTO {
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

export interface BountiesPayload {
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

// Stablecoins ≈ $1 for USD estimation; anything else stays null (honest).
const STABLE_USD: Record<string, number> = {
  USDC: 1,
  USDG: 1,
  USDT: 1,
  jupUSD: 1,
}

interface RawListing {
  id: string
  slug: string
  title: string
  type: string
  token: string
  rewardAmount: number | null
  compensationType: string
  minRewardAsk: number | null
  maxRewardAsk: number | null
  deadline: string | null
  agentAccess: string
  status: string
  isFeatured: boolean
  isPro: boolean
  sponsor?: { name?: string; logo?: string; isVerified?: boolean } | null
  _count?: { Submission?: number; Comments?: number }
}

function normalize(x: RawListing): BountyDTO {
  return {
    id: x.id,
    slug: x.slug,
    title: x.title,
    type: x.type ?? "bounty",
    token: x.token ?? "",
    rewardAmount: typeof x.rewardAmount === "number" ? x.rewardAmount : null,
    usdEstimate:
      typeof x.rewardAmount === "number" && (STABLE_USD[x.token ?? ""] !== undefined)
        ? x.rewardAmount * STABLE_USD[x.token]
        : null,
    compensationType: x.compensationType ?? "fixed",
    minRewardAsk: typeof x.minRewardAsk === "number" ? x.minRewardAsk : null,
    maxRewardAsk: typeof x.maxRewardAsk === "number" ? x.maxRewardAsk : null,
    deadline: x.deadline ?? null,
    agentAccess: x.agentAccess ?? "AGENT_ALLOWED",
    status: x.status ?? "OPEN",
    isFeatured: Boolean(x.isFeatured),
    isPro: Boolean(x.isPro),
    sponsorName: x.sponsor?.name ?? null,
    sponsorLogo: x.sponsor?.logo ?? null,
    sponsorVerified: Boolean(x.sponsor?.isVerified),
    submissions: x._count?.Submission ?? 0,
    comments: x._count?.Comments ?? 0,
  }
}

async function fetchJson(
  url: string,
  init?: RequestInit,
  timeoutMs = 15000,
): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

let cache: { at: number; payload: BountiesPayload } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

export async function getBounties(force = false): Promise<BountiesPayload> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.payload
  }

  const cred = await getCredential()

  // 1) Authenticated agent feed (includes AGENT_ONLY listings)
  if (cred) {
    try {
      const data = await fetchJson(
        `${BASE_URL}/api/agents/listings/live?take=50`,
        { headers: { Authorization: `Bearer ${cred.apiKey}` } },
      )
      const list = (Array.isArray(data) ? data : []) as RawListing[]
      const bounties = list
        .filter((x) => x.status === "OPEN")
        .map(normalize)
        .sort((a, b) => (b.usdEstimate ?? b.rewardAmount ?? 0) - (a.usdEstimate ?? a.rewardAmount ?? 0))
      const pool = bounties.reduce((s, b) => s + (b.usdEstimate ?? 0), 0)
      const payload: BountiesPayload = {
        source: "agent",
        registered: true,
        username: cred.username,
        claimCode: cred.claimCode,
        claimUrl: cred.claimCode ? `${BASE_URL}/earn/claim/${cred.claimCode}` : null,
        browseUrl: `${BASE_URL}/earn/agents/listings`,
        fetchedAt: new Date().toISOString(),
        bounties,
        totalPoolUsd: pool > 0 ? pool : null,
      }
      cache = { at: Date.now(), payload }
      return payload
    } catch {
      // fall through to public feed
    }
  }

  // 2) Public fallback (AGENT_ALLOWED only, no AGENT_ONLY visibility)
  try {
    const data = await fetchJson(PUBLIC_LISTINGS_URL)
    const list = (Array.isArray(data) ? data : []) as RawListing[]
    const bounties = list
      .filter((x) => x.agentAccess !== "HUMAN_ONLY" && x.status === "OPEN")
      .map(normalize)
      .sort((a, b) => (b.usdEstimate ?? b.rewardAmount ?? 0) - (a.usdEstimate ?? a.rewardAmount ?? 0))
    const pool = bounties.reduce((s, b) => s + (b.usdEstimate ?? 0), 0)
    const payload: BountiesPayload = {
      source: "public",
      registered: Boolean(cred),
      username: cred?.username ?? null,
      claimCode: cred?.claimCode ?? null,
      claimUrl: cred?.claimCode ? `${BASE_URL}/earn/claim/${cred.claimCode}` : null,
      browseUrl: `${BASE_URL}/earn/agents/listings`,
      fetchedAt: new Date().toISOString(),
      bounties,
      totalPoolUsd: pool > 0 ? pool : null,
    }
    cache = { at: Date.now(), payload }
    return payload
  } catch (err) {
    if (cache) return cache.payload // serve stale
    throw err
  }
}
