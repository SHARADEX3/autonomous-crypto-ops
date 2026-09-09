// Seed: user's receiving wallets + researched opportunity board.
// Idempotent — safe to re-run.
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const WALLETS = [
  { chain: "bitcoin", label: "Bitcoin (user)", address: "bc1qh3areygq598ntxht0yp5yv87ej7g6aqvw8fl4z" },
  { chain: "ethereum", label: "MetaMask (user)", address: "0xd6DFE6b54bF3dBC919Fde57009452fe6bbb0D997" },
  { chain: "ronin", label: "Ronin (user)", address: "0xAa4E76e5Be5334c0f2Fe0716C42B2FC61D4c150B" },
  { chain: "solana", label: "Solana (user)", address: "2emXSLoziaB5wdC8y48ovbu41agh9PzR5ro8o7kRDUvM" },
  { chain: "tron", label: "Tron (user)", address: "TJxkyJW57Tb8qmvvv5rCh3L2FYssRvWFEv" },
]

// Curated from the 1-a research pass (20 web searches, verified lead sources).
const OPPORTUNITIES = [
  {
    name: "Superteam Earn Agent API",
    category: "dev",
    url: "https://earn.superteam.fun",
    description:
      "Solana's largest gig marketplace ($1.7M+ paid) with an official Agent API: register via one POST, browse AGENT_ALLOWED bounties, submit work directly. $150–$5,000 USDC per bounty.",
    effort: "high",
    payout: "variable",
    autonomous: true,
    status: "active",
    notes:
      "PRIMARY PATH. Payout uses a human claim-code flow — user redeems the code once to release USDC to the public SOL address (receiving needs no keys). Reputation compounds with completed work.",
  },
  {
    name: "gigs.sh platform registry",
    category: "dev",
    url: "https://gigs.sh",
    description:
      "Curated registry of 46 agent-friendly earning platforms, graded by agent-friendliness and onboarding tier. Master lead list for new agent-economy rails.",
    effort: "low",
    payout: "zero",
    autonomous: true,
    status: "active",
    notes: "Directory, not a payer. Review weekly for new welcome-tier platforms.",
  },
  {
    name: "Agent task marketplaces (Clustly, Agent Hansa, Daydreams, NEAR AI)",
    category: "bounty",
    url: "https://gigs.sh",
    description:
      "Early decentralized task boards built for AI agents: self-register, no KYC, USDC payouts on Solana/Base/Stellar. Small volumes so far.",
    effort: "medium",
    payout: "unknown",
    autonomous: true,
    status: "new",
    notes:
      "Unproven, low liquidity. AVOID anything requiring staking collateral (Claw Earn's 9 USDC min) — asking $0-capital agents to pay first is the rug pattern.",
  },
  {
    name: "Drips Wave (Stellar PR-merge waves)",
    category: "funding",
    url: "https://gigs.sh",
    description:
      "Stellar pays USDC for merged PRs in recurring waves — $255K disbursed across 4 waves. Points convert to USDC.",
    effort: "high",
    payout: "variable",
    autonomous: true,
    status: "new",
    notes: "Requires meaningful OSS contributions to Stellar ecosystem repos. Worth a pilot.",
  },
  {
    name: "Dework DAO bounties",
    category: "dev",
    url: "https://dework.xyz",
    description: "Bounty/task board for DAOs, wallet-only onboarding, on-chain payouts in USDC across 20+ chains.",
    effort: "medium",
    payout: "variable",
    autonomous: false,
    status: "researching",
    notes: "Login requires wallet SIGNATURE (no keys held). Only viable with a one-time user login handoff.",
  },
  {
    name: "Stacker News bounties",
    category: "content",
    url: "https://stacker.news",
    description: "Bitcoin/Lightning forum with bounty posts; SN's own repo pays 20K–1M sats per merged PR.",
    effort: "medium",
    payout: "small",
    autonomous: false,
    status: "researching",
    notes: "Payouts are Lightning sats; we hold an on-chain BTC address only — wrong rail without user support. Good model for content-with-tip-rails.",
  },
  {
    name: "Immunefi bug bounties",
    category: "bounty",
    url: "https://immunefi.com",
    description: "Web3's largest bug-bounty platform, $131M+ paid out in USDC/ETH. AI-assisted reports allowed if rigorous.",
    effort: "high",
    payout: "variable",
    autonomous: false,
    status: "researching",
    notes: "KYC required for payouts ≥ $500. Account needs email. Highest $-per-success — later-phase path after track record.",
  },
  {
    name: "HackenProof bounties",
    category: "bounty",
    url: "https://hackenproof.com",
    description: "Web3 bug-bounty platform (Ethereum Foundation, NEAR, MetaMask programs), USDC payouts, agent MCP server available.",
    effort: "high",
    payout: "variable",
    autonomous: false,
    status: "researching",
    notes: "Friendlier agent tooling than Immunefi, same account/KYC blockers at payout.",
  },
  {
    name: "Cantina & Sherlock audit contests",
    category: "bounty",
    url: "https://cantina.xyz",
    description: "Competitive smart-contract audit contests with USDC prize pools; Sherlock paid $19M+.",
    effort: "high",
    payout: "variable",
    autonomous: false,
    status: "researching",
    notes: "Code4rena is winding down. Contests need accounts + KYC at payout; competitive. Not a first move.",
  },
  {
    name: "Dune Analytics bounties",
    category: "content",
    url: "https://dune.com",
    description: "Sponsors pay $1,000–$2,500 USDC for winning SQL dashboards/analyses.",
    effort: "medium",
    payout: "variable",
    autonomous: false,
    status: "researching",
    notes: "Needs a Dune account (email). Dashboards compound as portfolio. Skill fit is decent.",
  },
  {
    name: "Optimism Retro Funding (RetroPGF)",
    category: "funding",
    url: "https://optimism.io",
    description:
      "Retroactive public-goods funding: up to 8M OP budget rewarding work that already helped the Superchain.",
    effort: "high",
    payout: "variable",
    autonomous: false,
    status: "researching",
    notes: "Strongest compounding path for published OSS work. Eligibility is earned over months; needs project registration + identity eventually.",
  },
  {
    name: "Gitcoin Grants (GG23+)",
    category: "funding",
    url: "https://gitcoin.co",
    description: "Grants program (conviction voting since GG23) + Allo/Grants Stack for ecosystem rounds.",
    effort: "medium",
    payout: "small",
    autonomous: false,
    status: "researching",
    notes: "Small pools now; Sybil-resistance excludes anonymous agents. Long-tail benefit of doing the same public work.",
  },
  {
    name: "Paragraph web3 publishing",
    category: "content",
    url: "https://paragraph.xyz",
    description: "Web3-native publishing with USDC subscriptions/tips, wallet-native login.",
    effort: "medium",
    payout: "unknown",
    autonomous: false,
    status: "new",
    notes: "Login blocked without keys/email. If user does one login, publishing automates via API and tips land at public address.",
  },
  {
    name: "GitHub open-source w/ crypto tip rails",
    category: "dev",
    url: "https://github.com",
    description: "Publish durable code artifacts with donation addresses embedded in README. Zero cost, compounds over time.",
    effort: "medium",
    payout: "variable",
    autonomous: true,
    status: "active",
    notes: "Foundation layer for retro-funding eligibility + passive tips. Agent maintains repo continuously.",
  },
  {
    name: "This ops hub + utility tools (tip rail)",
    category: "dev",
    url: "/",
    description: "Grow useful web tools (wallet monitor, opportunity intel) with donation addresses displayed.",
    effort: "medium",
    payout: "variable",
    autonomous: true,
    status: "active",
    notes: "The site you're looking at. Distribution is the hard part; content phases feed traffic here.",
  },
  {
    name: "Learn-and-earn quizzes (Coinbase/Binance)",
    category: "learn",
    url: "https://www.coinbase.com/earn",
    description: "Watch video + quiz → $1–$10 tokens, one-shot.",
    effort: "low",
    payout: "dust",
    autonomous: false,
    status: "dead",
    notes: "Hard-blocked: exchange account + full KYC + geo-rules. Dust even when it works. Not pursued.",
  },
  {
    name: "Mainnet faucets",
    category: "faucet",
    url: "https://www.google.com/search?q=crypto+faucet",
    description: "CAPTCHA-gated dust dispensers, <$1/yr realistic.",
    effort: "low",
    payout: "dust",
    autonomous: false,
    status: "dead",
    notes: "ToS prohibits bots; botting/multi-accounting is FORBIDDEN (ToS/ethics). Withdrawal-minimum scam pattern common. Not pursued.",
  },
  {
    name: "Airdrop / testnet farming",
    category: "airdrop",
    url: "https://www.coingecko.com/learn/upcoming-crypto-airdrops",
    description: "Farm protocol activity hoping for retroactive token drops.",
    effort: "medium",
    payout: "variable",
    autonomous: false,
    status: "dead",
    notes: "NOT zero-capital: needs funded wallets + private keys + social accounts. Sybil filters exclude automation. Fake claim pages = wallet drainers. Not pursued.",
  },
]

async function main() {
  for (const w of WALLETS) {
    await prisma.wallet.upsert({
      where: { chain: w.chain },
      update: { address: w.address, label: w.label },
      create: w,
    })
  }

  const existing = await prisma.opportunity.count()
  if (existing === 0) {
    for (const o of OPPORTUNITIES) {
      await prisma.opportunity.create({ data: o })
    }
    console.log(`Seeded ${OPPORTUNITIES.length} opportunities`)
  } else {
    console.log(`Opportunities already present (${existing}) — skipping`)
  }

  console.log(`Wallets ensured: ${WALLETS.length}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
