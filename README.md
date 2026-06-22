# Split — Split bills & save together on Celo

**Split expenses. Save together. No awkwardness.**

Split is a mobile-first web app for sharing expenses and saving money with friends — settled instantly in **cUSD** on the **Celo** blockchain, and built to feel native inside **MiniPay**. No "who owes who" spreadsheets, no chasing people for money.

> Built for the Celo **Proof of Ship** program.

- **Live app:** https://split-five-eta.vercel.app
- **Best experience:** open inside **MiniPay** (Opera Mini / MiniPay app) — it auto-connects and pays gas in cUSD. Works in any browser wallet (MetaMask, Valora, etc.) too, and even **fully offline with no wallet** for quick splits.

---

## Table of contents
- [What you can do](#what-you-can-do)
- [Feature tour](#feature-tour)
  - [1. Expense groups](#1-expense-groups)
  - [2. Splitting expenses](#2-splitting-expenses)
  - [3. Settling up](#3-settling-up)
  - [4. Savings Circles (Ajo / ROSCA)](#4-savings-circles-ajo--rosca)
  - [5. Explore & the offline calculator](#5-explore--the-offline-calculator)
  - [6. Activity & notifications](#6-activity--notifications)
  - [7. Profiles, contacts & streaks](#7-profiles-contacts--streaks)
  - [8. Wallet & MiniPay](#8-wallet--minipay)
- [How it works (architecture)](#how-it-works-architecture)
- [Tech stack](#tech-stack)
- [Smart contracts](#smart-contracts)
- [Screens / routes](#screens--routes)
- [Local development](#local-development)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Security & privacy](#security--privacy)
- [Roadmap](#roadmap)

---

## What you can do

At a glance, Split lets you:

- 💸 **Split any bill** with friends — equally, by %, by shares, or exact amounts.
- 🧾 **Scan a receipt** and auto-extract items, or import a CSV.
- 🔗 **Create groups** on-chain **or** fully offline (no wallet needed).
- ⚡ **Settle debts in one tap** with cUSD, or **"Settle all"** in a batch.
- 🐷 **Run Savings Circles** — rotating payout pools (Ajo/ROSCA) or shared-goal funds.
- 🔍 **Discover public circles** to join, or compute a split offline with the **calculator**.
- 🔁 **Automate recurring expenses** (rent, subscriptions).
- 🔔 Get **reminders & notifications**, track everything in a unified **activity feed**.
- 🌍 See balances in your **local fiat currency**.

---

## Feature tour

### 1. Expense groups

Create a group for any shared tab — a trip, a flat, a dinner.

- **Two group types:**
  - **On-chain (Celo):** lives on the `SplitGroup` smart contract + Supabase. Members and settlements are verifiable on-chain.
  - **Offline / Local:** stored on your device — **no wallet required**. Perfect for a quick split with people who aren't on-chain. Can later be **synced to the cloud/blockchain** with one tap.
- **Members:** add by wallet address (with optional nicknames saved to your private address book) and share an **invite link** (e.g. via WhatsApp).
- **Group chat:** lightweight in-group messaging so the conversation lives with the expenses.
- **Per-group controls:** rename, delete (when settled), and manage recurring rules.

### 2. Splitting expenses

Adding an expense is flexible and fast:

- **Split types:** **Equal**, **Percentage**, **Share** (weights), or **Exact** amounts — with a live per-person preview and validation (e.g. percentages must total 100%).
- **Receipt OCR:** snap a photo and Split uses on-device OCR (Tesseract.js) to pull out line items and assign them to people.
- **CSV import:** bulk-fill the form from a spreadsheet (`description,amount,category,payer,split_type`).
- **Categories, notes & receipt images** attached to each expense.
- **Edit & reverse** expenses with a full **audit ledger** — every change is recorded with a reason, who did it, and before/after snapshots.
- **Recurring expenses:** set weekly / monthly / yearly rules; Split surfaces **draft reminders** on your dashboard when one is due.
- **Export** any group's expenses to CSV.

### 3. Settling up

- **Debt-simplification engine:** instead of everyone paying everyone, Split nets all balances down to the **fewest possible transfers**.
- **One-tap settle:** pay a specific person their cUSD directly.
- **Settle all:** clear every debt you owe in a batch, tracked with per-item status.
- **Reminders:** nudge someone who owes you with a notification.
- **On-chain proof:** real settlements are cUSD transfers on Celo, viewable on CeloScan.

### 4. Savings Circles (Ajo / ROSCA)

Save toward goals with a group, fully on-chain via the `SavingsCircle` contract.

- **Two modes:**
  - **Rotating Payout (Ajo / ROSCA):** every cycle each member contributes a fixed amount and one member receives the whole pot, rotating until everyone has been paid.
  - **Shared Goal:** everyone contributes toward a target amount; the creator distributes once the goal is reached.
- **Creation wizard:** contribution size, cadence (daily/weekly/monthly/custom), max members, goal amount & deadline, grace period, and max-missed tolerance.
- **Public or Private:** public circles appear in the **Explore** directory for anyone to discover and join; private ones are reachable only by direct link.
- **Lifecycle actions:** join, contribute (cUSD), distribute / distribute-goal, mark a member missed, exit, or dissolve.
- **Member tracking:** contributions, payouts received, missed counts, and per-cycle status.
- **Yield estimate** and a per-circle **history** view.
- **Deadline reminders** delivered via a scheduled job.

### 5. Explore & the offline calculator

- **Public directory:** browse open **Savings Goals** and **Rotating Circles** and join with one tap. Disconnected guests can see public circles too.
- **Offline Split Calculator:** a **wallet-free** tool to split a bill among any names — equal or custom — and copy a shareable summary. Great for a fast calc before anyone opens a wallet.
- **Create your own** circle directly from Explore when connected.

### 6. Activity & notifications

- **Unified activity feed:** settlements, expenses, groups created/joined, savings-circle activity, and notifications — all in one timeline with **search, type filters, date range, and CSV export**.
- **Notifications:** payment reminders, new expenses, messages, group joins, and settlements — delivered in real time (Supabase Realtime).
- **Preferences:** per-type opt-outs and **quiet hours**.
- **Forgery-resistant:** notifications are written through a server endpoint (service-role key), so they can't be spoofed with the public key.

### 7. Profiles, contacts & streaks

- **Public profiles** per wallet address (display name, avatar, savings streak) with a QR code for requests.
- **Address book:** private, per-user saved contacts & nicknames.
- **Daily check-in & streaks:** a light gamification loop to keep people engaged.
- **Invoices:** generate a shareable payment request / invoice page with a QR code.

### 8. Wallet & MiniPay

- **MiniPay-native:** auto-detects MiniPay (`window.ethereum.isMiniPay`), **auto-connects with no "Connect" button**, and pays gas in **cUSD** via `feeCurrency` (MiniPay users hold no native CELO).
- **Any wallet:** EIP-6963 multi-wallet picker for MetaMask / Valora / etc., with automatic Celo network add & switch.
- **Fiat display:** balances and amounts shown in your selected local currency.
- **Optional wallet auth:** a sign-in-with-Ethereum session layer is built in (off by default) that can lock private data (contacts, chat) to its owner when enabled.

---

## How it works (architecture)

Split is a **hybrid on-chain + off-chain** app:

- **On-chain (Celo):** the source of truth for money — group membership, expense records, settlements, and savings-circle state live in the `SplitGroup` and `SavingsCircle` contracts. Settlements are real cUSD transfers.
- **Off-chain (Supabase):** fast metadata and social features — display names, group/member records, chat messages, notifications, address book, recurring rules, audit revisions, and circle visibility (public/private). Realtime subscriptions keep the UI live.
- **Client:** Next.js App Router with React hooks per domain (`useGroups`, `useExpenses`, `useBalances`, `useSavingsCircle`, `useGroupChat`, `useNotifications`, …). On-chain reads are cached in-memory (stale-while-revalidate) so navigating between screens doesn't re-hit the RPC.
- **Gas model:** `gasPrice` always set in CELO; `feeCurrency: cUSD` only for MiniPay — centralized in `src/lib/gas.ts`.

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | **Next.js 16** (App Router), **React 19**, TypeScript |
| Styling | **Tailwind CSS 4** |
| Blockchain | **viem 2** · **Celo Mainnet** (chain `42220`) |
| Database | **Supabase** (PostgreSQL + Realtime + Storage for receipts) |
| Contracts | **Solidity 0.8.x** + **Hardhat** |
| OCR | **Tesseract.js** (on-device receipt scanning) |
| Animation | **GSAP** (landing) |
| QR | **qrcode.react** |
| Tests | **Vitest** |

---

## Smart contracts

Deployed on **Celo Mainnet** (`contracts/contracts/`):

| Contract | Purpose | Address |
|---|---|---|
| `SplitGroup.sol` | Groups, expenses, settlements | [`0x86A76e4AA9B69cF5C86bFfae69F5744Cc2AED044`](https://celoscan.io/address/0x86A76e4AA9B69cF5C86bFfae69F5744Cc2AED044) |
| `SavingsCircle.sol` | Rotating / goal savings circles | [`0x43BF77fEF489B0fe6E715F505f5ce20B3D5525c0`](https://celoscan.io/address/0x43BF77fEF489B0fe6E715F505f5ce20B3D5525c0) |
| cUSD (token) | Celo stablecoin used for all payments | [`0x765DE816845861e75A25fCA122bb6898B8B1282a`](https://celoscan.io/address/0x765DE816845861e75A25fCA122bb6898B8B1282a) |

---

## Screens / routes

| Route | Screen |
|---|---|
| `/` | Landing page |
| `/app` | Home dashboard (balances, groups, circles, check-in) |
| `/app/create` | Create a group (on-chain or offline) |
| `/app/group/[groupId]` | Group detail — balances, expenses, chat, audit ledger |
| `/app/group/[groupId]/add` | Add expense (split types, OCR, CSV) |
| `/app/group/[groupId]/recurring` | Recurring expense rules |
| `/app/join/[groupId]` | Accept a group invite |
| `/app/settle/[debtId]` | Settle a specific debt |
| `/app/save` | Your savings circles |
| `/app/save/create` | Create a savings circle (wizard) |
| `/app/save/[circleId]` | Circle detail & actions |
| `/app/save/[circleId]/history` | Circle history |
| `/app/explore` | Public circle directory + offline calculator |
| `/app/activity` | Unified activity feed |
| `/app/notifications` | Notifications |
| `/app/profile/[address]` | Public profile |
| `/app/invoice/[id]` | Shareable invoice / payment request |
| `/app/settings` | Settings & preferences |
| `/split/[id]` | Shared QuickSplit link |
| `/faq` | FAQ |

---

## Local development

### Prerequisites
- Node.js 20+
- A Supabase project

### 1. Install
```bash
npm install
```

### 2. Environment
Create `.env.local` in the root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SPLIT_CONTRACT=0x86A76e4AA9B69cF5C86bFfae69F5744Cc2AED044
NEXT_PUBLIC_SAVINGS_CIRCLE_ADDRESS=0x43BF77fEF489B0fe6E715F505f5ce20B3D5525c0
NEXT_PUBLIC_CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server-only (do NOT prefix with NEXT_PUBLIC):
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # for server routes (notifications, etc.)
# AUTH_SECRET=...                                  # optional: enables wallet-auth / private data
```

### 3. Database
Run `src/lib/supabase-schema.sql` in the Supabase SQL editor to create the tables and policies.

### 4. Run
```bash
npm run dev      # start the dev server
npm run build    # production build
npm run lint     # eslint
npm test         # vitest unit tests
```

---

## Testing

Unit tests (Vitest) cover the money-critical and integration-sensitive logic:
- `src/lib/split.test.ts` — split math (equal / percentage / share / exact, remainder conservation)
- `src/lib/gas.test.ts` — MiniPay `feeCurrency` gas rule
- `src/lib/session.test.ts` — auth session sign/verify

```bash
npm test
```

---

## Project structure

```
src/
  app/                      # Next.js App Router pages + API routes
    api/                    # server routes (notifications, auth)
  components/               # UI: app/, common/, landing/, groups/
  context/                  # WalletContext, CurrencyContext
  hooks/                    # useGroups, useExpenses, useBalances,
                            # useSavingsCircle, useGroupChat, useNotifications,
                            # useAddressBook, useMiniPay, ...
  lib/                      # contract.ts, gas.ts, minipay.ts, session.ts,
                            # balanceEngine.ts, split.ts, onchainCache.ts,
                            # supabase.ts, supabase-schema.sql, ...
  types/                    # shared data-model types
contracts/                  # Hardhat project (SplitGroup.sol, SavingsCircle.sol)
```

---

## Security & privacy

- **On-chain settlements** are real, verifiable cUSD transfers — immutable proof of payment.
- **Server-mediated writes:** sensitive inserts (e.g. notifications) go through API routes using the Supabase **service-role key**, so the public anon key can't forge them.
- **Optional wallet auth:** enabling `AUTH_SECRET` turns on sign-in-with-Ethereum sessions and locks private tables (contacts, messages) to their owner via server routes + RLS.
- **Secrets stay out of git:** `.env*`, keys, and scratch/scripts are git-ignored.

---

## Roadmap

- Real-time event indexer for instant on-chain → UI sync at scale
- Yield-bearing circle balances (Moola/Aave)
- Richer onboarding for first-time MiniPay users
- Migrate `<img>` to `next/image`, broaden test coverage, accessibility pass

---

Built with ❤️ for the Celo & MiniPay ecosystem.
