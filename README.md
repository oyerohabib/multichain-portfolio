# Multichain Portfolio

Portfolio-ready EVM frontend that connects a wallet **or** watches a pasted address, shows balances across **Ethereum, Base, and Optimism** (or their Sepolia testnets), and ships a full **send transaction lifecycle** (simulate → sign → pending → confirmed / failed / replaced).

Built to demonstrate the frontend skills common in web3 roles: React + TypeScript, TanStack Query, wagmi/viem, real-time-ish portfolio data, clear transaction UX, and tests.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- wagmi + viem + RainbowKit
- TanStack Query + Zustand
- Alchemy Portfolio API (server-proxied)
- Recharts
- Vitest + Playwright

## Features

- Mainnet / Testnet toggle (ETH·Base·OP ↔ Sepolia·Base Sepolia·OP Sepolia)
- Watch-only and connected wallet share the same data path
- One-click **Try Vitalik’s address** demo (mainnet watch-only)
- Net worth, token table, chain allocation chart, activity feed
- Native + ERC-20 send with pre-broadcast simulation
- Explicit transaction status UI (no explorer required)
- API keys stay on the server for portfolio/activity reads
- Portfolio responses are page-capped + short-TTL cached for snappier UX

## Setup

```bash
pnpm install
cp .env.example .env.local
```

Fill in:

| Variable | Purpose |
| --- | --- |
| `ALCHEMY_API_KEY` | Server Portfolio API (`/api/portfolio`, `/api/activity`) |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Client RPC for wagmi (can match Alchemy key) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | RainbowKit / WalletConnect Cloud |
| `NEXT_PUBLIC_APP_URL` | App origin (e.g. `http://localhost:3000`) for WalletConnect / MetaMask |

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Quick demo (mainnet, no wallet)

1. Stay on **Mainnet**.
2. Click **Try Vitalik’s address** under the watch input.
3. Browse net worth, tokens, and activity for `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`.

Use **Clear** to leave watch mode. This demo is for Mainnet — on Testnet that address will look empty or sparse.

## Exploring safely (testnet)

1. Switch the header toggle to **Testnet**.
2. In MetaMask, select **Sepolia** (enable “Show test networks” in settings if needed). Prefer the network filter / bottom network control in newer MetaMask UIs — not the account switcher.
3. Fund the wallet from a **free** faucet below, wait for the balance in MetaMask, then connect and use **Send** to exercise the full lifecycle without spending real ETH.

### Free Sepolia faucets (recommended)

These do **not** require mainnet ETH:

- [Google Cloud Web3 Sepolia faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- [PoW Sepolia faucet (pk910)](https://sepolia-faucet.pk910.de/#/claim/bc7826c1-53c1-4c2c-891c-5facb85d2028)

### Other faucets (often require mainnet ETH)

Many provider faucets (e.g. Alchemy / QuickNode) ask for **~0.001 ETH on Ethereum mainnet** as anti-spam. Prefer the free links above if you don’t want that.

Optional extras once you already have mainnet dust:

- [Alchemy Sepolia](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Alchemy Base Sepolia](https://www.alchemy.com/faucets/base-sepolia)
- [Alchemy OP Sepolia](https://www.alchemy.com/faucets/optimism-sepolia)

Watch-only still works on testnet: paste any `0x` address after switching modes.

## Scripts

```bash
pnpm dev          # local app
pnpm build        # production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript
pnpm test         # Vitest (tx lifecycle)
pnpm test:e2e     # Playwright e2e (shell, watch, mode toggle, errors)
```

First-time Playwright setup:

```bash
pnpm exec playwright install chromium
```

E2E specs mock `/api/portfolio` and `/api/activity` so runs stay fast and don’t depend on Alchemy.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes to `main`/`master` and on pull requests:

1. **Lint, typecheck & unit tests**
2. **Production build** (placeholder env vars)
3. **Playwright e2e** (Chromium; uploads report on failure)

## What this demonstrates (interview angle)

1. **Data-heavy UI** — multi-chain balances, caching, loading/error/empty states
2. **Wallet UX** — RainbowKit connect + watch-only addresses + network mode
3. **Transaction lifecycle** — typed Zustand state machine with simulate-before-send
4. **Secure API boundary** — Alchemy key never ships to the browser for portfolio reads
5. **Testability** — unit tests for lifecycle transitions + Playwright smoke for watch/toggle flow

## Out of scope (v1)

Solana, NFTs, DeFi positions, Storybook, user accounts / persistence beyond client cache.
