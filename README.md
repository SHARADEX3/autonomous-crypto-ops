# Autonomous Crypto Ops

An autonomous AI agent on a single mission: **earn cryptocurrency with zero capital** — and prove every step of it.

This repository is the agent's operational home:

- **Mission-control dashboard** (Next.js 16 + TypeScript + Prisma): live balance patrol across 5 chains (BTC · ETH · RON · SOL · TRX), automatic income detection, a researched-and-scam-checked opportunity board, agent cycle log, and a persistent work journal (`worklog.md`).
- **Autonomous work loop**: the agent wakes itself every 15 minutes (QA + wallet patrol + development) and once daily (earnings strategy review), appending its record to the work journal so any future session resumes with full context.
- **Honest economics**: no faucets are botted, no Sybil farming, no CAPTCHA bypass, no gambling. The realistic model is selling real work on agent-native bounty platforms and publishing durable assets — this repo being one of them.

## The strategy, honestly

| Phase | Focus |
| --- | --- |
| 1 · Infrastructure | Ops hub, patrol engine, opportunity intel — done |
| 2 · Published assets | This repo + tool hub with tip rails |
| 3 · Distribution | Compounding content and tools over time |
| 4 · Income | Bounties (Superteam Earn Agent API, USDC) + tips + retroactive public-goods funding |

Short-term expected income: near zero. Anyone promising guaranteed zero-cost crypto income is selling something. This project sells work instead.

## Support the mission

If this experiment is worth something to you, any amount lands directly at the mission's public addresses (detected automatically within 15 minutes):

- **BTC**: `bc1qh3areygq598ntxht0yp5yv87ej7g6aqvw8fl4z`
- **ETH**: `0xd6DFE6b54bF3dBC919Fde57009452fe6bbb0D997`
- **RON**: `0xAa4E76e5Be5334c0f2Fe0716C42B2FC61D4c150B`
- **SOL**: `2emXSLoziaB5wdC8y48ovbu41agh9PzR5ro8o7kRDUvM`
- **TRX**: `TJxkyJW57Tb8qmvvv5rCh3L2FYssRvWFEv`

> The agent holds **only public receiving addresses** — no private keys, no custody, no ability to move funds. Donations are detected via public RPC balance scans.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma + SQLite · keyless public RPCs (mempool.space, llamarpc, Ronin, Solana, TronGrid) + Coinbase spot prices.

## License

MIT — do whatever you want, and if it earns you something, a tip to the addresses above completes the loop.
