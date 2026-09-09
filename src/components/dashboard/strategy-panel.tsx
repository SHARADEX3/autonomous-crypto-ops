"use client"

// Strategy tab: the honest plan, ethics rails, wake-up schedule, donation rail.
import QRCode from "react-qr-code"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Scale,
  ShieldAlert,
  Clock,
  HandCoins,
  Github,
  Radar,
  Rocket,
  Megaphone,
  Lock,
  Ban,
  Bot,
} from "lucide-react"
import { ChainIcon, CopyButton } from "./bits"
import type { WalletStatus } from "@/lib/types"

export function StrategyPanel({
  wallets,
  repoUrl,
}: {
  wallets: WalletStatus[] | null
  repoUrl: string | null
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4 text-emerald-400" aria-hidden />
              The honest math
            </CardTitle>
            <CardDescription>What $0 capital, no accounts and no keys can really do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Short term:</span> near-zero income is
              the honest expectation. Faucets are dust, learn-to-earn needs KYC accounts, airdrop
              farming needs funded wallets and keys. Anyone promising guaranteed zero-cost crypto
              income is selling something.
            </p>
            <p>
              <span className="font-medium text-foreground">The real model:</span> sell work, not
              hope. The agent competes for bounties on agent-native platforms (Superteam Earn
              first) and publishes durable assets — code, tools, content — with public tip rails
              attached. Those compound slowly and become eligible for retroactive public-goods
              funding later.
            </p>
            <p>
              <span className="font-medium text-foreground">Payout rails:</span> with public
              addresses only, the mission can <em>receive</em> transfers (USDC on Solana, ETH, RON,
              TRX, BTC) but never <em>claim</em> anything requiring a signature. Every opportunity
              on the board was filtered by this test.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4 w-4 text-emerald-400" aria-hidden />
              Attack routes
            </CardTitle>
            <CardDescription>Sequenced by realism, not hype</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                icon: Radar,
                title: "Now · Agent bounties",
                text: "Register on Superteam Earn's Agent API, submit real work for $150–$5,000 USDC bounties. Receiving USDC at the public SOL address needs no keys.",
              },
              {
                icon: Github,
                title: "Now · Published assets",
                text: "This codebase on GitHub + a growing tool hub, with donation addresses embedded. Slow compounding, zero cost.",
              },
              {
                icon: Megaphone,
                title: "Ongoing · Distribution",
                text: "Every 15-minute cycle improves the assets; content phases feed traffic toward the tools and tip rails.",
              },
              {
                icon: HandCoins,
                title: "Later · Retro funding",
                text: "Once the public work has real usage, it becomes eligible for Optimism RetroPGF / Gitcoin-style programs — the only mechanism that pays meaningfully for zero-capital work.",
              },
            ].map((r) => (
              <div key={r.title} className="flex gap-3">
                <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                <div>
                  <div className="text-sm font-medium">{r.title}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{r.text}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden />
              Ethics & safety rails
            </CardTitle>
            <CardDescription>Hard constraints — no exceptions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                { icon: Ban, text: "No botting faucets, CAPTCHA bypass, or multi-account (Sybil) farming — ToS violations and fraud-adjacent." },
                { icon: Ban, text: "No gambling or trading — there is no capital to trade with, and that path loses." },
                { icon: Lock, text: "No private keys, ever. Only public receiving addresses are held. Nothing here can sign or move funds." },
                { icon: Ban, text: "No collateral-staking 'opportunities' — asking a $0 agent to pay first is the rug pattern." },
                { icon: Ban, text: "No engagement with 'claim your airdrop' links — the #1 wallet-drainer pattern." },
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5">
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-red-400/80" aria-hidden />
                  <span className="leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-emerald-400" aria-hidden />
              How the agent wakes up
            </CardTitle>
            <CardDescription>Three independent persistence mechanisms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <Badge variant="outline" className="h-fit shrink-0 border-teal-500/30 text-teal-400">
                every 15 min
              </Badge>
              <p className="leading-relaxed">
                A scheduled <span className="font-mono text-xs">webDevReview</span> loop: QA the
                site, run the wallet patrol, fix bugs or push the next feature, then append its
                record to the worklog.
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="h-fit shrink-0 border-amber-500/30 text-amber-400">
                daily
              </Badge>
              <p className="leading-relaxed">
                A daily patrol reviews earnings, re-researches the opportunity board, and advances
                the strategy.
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="h-fit shrink-0 border-emerald-500/30 text-emerald-400">
                “continue working”
              </Badge>
              <p className="leading-relaxed">
                Your daily message in chat re-triggers the agent for a fresh full session on top of
                the persisted worklog.
              </p>
            </div>
            {repoUrl && (
              <>
                <Separator />
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    Published asset: GitHub repository
                  </a>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-emerald-500/30 bg-emerald-500/[0.04]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HandCoins className="h-4 w-4 text-emerald-400" aria-hidden />
            Support the mission — donation rail
          </CardTitle>
          <CardDescription>
            Every satoshi, lamport and gwei sent here is detected automatically within 15 minutes
            and logged as mission income.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(wallets ?? []).map((w) => (
              <div
                key={w.chain}
                className="flex flex-col items-center gap-3 rounded-lg border bg-card p-4 text-center"
              >
                <div className="flex items-center gap-2">
                  <ChainIcon chain={w.chain} className={`h-4 w-4 ${w.accentClass}`} />
                  <span className="text-sm font-semibold">
                    {w.name} · {w.symbol}
                  </span>
                </div>
                <div className="rounded-lg bg-white p-2.5">
                  <QRCode value={w.address} size={120} bgColor="#ffffff" fgColor="#0a0a0a" />
                </div>
                <div className="flex w-full items-center gap-1">
                  <code className="min-w-0 flex-1 truncate rounded bg-muted/50 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                    {w.address}
                  </code>
                  <CopyButton text={w.address} />
                </div>
              </div>
            ))}
            {wallets === null &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex h-56 items-center justify-center rounded-lg border border-dashed">
                  <Bot className="h-6 w-6 text-muted-foreground/40" aria-hidden />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
