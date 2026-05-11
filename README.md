# Split — MiniPay-Native Expense Splitting

**Split bills. Settle instantly. No awkwardness.**  
Built specifically for the Celo MiniPay ecosystem for the **Proof of Ship Season 2** competition.

---

## Live Application

- **URL:** [https://split-five-eta.vercel.app](https://split-five-eta.vercel.app)
- **Environment:** Optimized for **MiniPay** (Opera Browser on Android/iOS).

---

## Overview

**Split** is a mobile-first web application that allows friend groups to manage shared expenses without the "who owes who" headache. Unlike traditional apps like Splitwise, **Split** is integrated directly into the Celo blockchain, allowing users to settle debts instantly using **cUSD** stablecoins with a single tap.

### Key Features

- **MiniPay Native**: Zero-click wallet connection and automatic network switching.
- **Group Management**: Create groups, invite friends via WhatsApp/link, and track shared tabs.
- **On-Chain Settlements**: One-tap cUSD transfers directly through the app shell.
- **Balance Engine**: Sophisticated algorithm that simplifies multi-party debts into the fewest possible transactions.
- **Real-time Sync**: Instant updates across all devices when an expense is added.
- **Transparent Ledger**: All settlements are recorded on the Celo blockchain for immutable proof of payment.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS 4.0
- **Blockchain**: Viem (Lightweight alternative to ethers.js)
- **Database**: Supabase (PostgreSQL with Realtime subscriptions)
- **Network**: Celo Mainnet (Chain ID: `42220`)
- **Token**: cUSD (`0x765DE816845861e75A25fCA122bb6898B8B1282a`)
- **Smart Contract**: Solidity 0.8.20 (Hardhat)

---

## Smart Contract

The core logic resides in `SplitGroup.sol`, deployed on Celo Mainnet.

- **Contract Address:** `0x0f2BcbB95144CAF706Ba7bEb8912D234C2d7D234`
- **Verified on CeloScan:** [View Contract](https://celoscan.io/address/0x0f2BcbB95144CAF706Ba7bEb8912D234C2d7D234#code)

The contract handles:

1.  Group creation and membership registration.
2.  Logging expense metadata (off-chain storage, on-chain hash).
3.  Atomic cUSD settlements using `transferFrom`.

---

## Local Development

### 1. Prerequisites

- Node.js 20+
- A Supabase account

### 2. Environment Setup

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SPLIT_CONTRACT=0x0f2BcbB95144CAF706Ba7bEb8912D234C2d7D234
NEXT_PUBLIC_CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
NEXT_PUBLIC_CHAIN_ID=42220
```

### 3. Running the App

```bash
npm install
npm run dev
```

---

## Security

- **Strict GitIgnore**: We use recursive patterns to ensure no `.env` or `private.key` files ever touch GitHub.
- **ReentrancyGuard**: Smart contracts use OpenZeppelin's security standards to prevent drainage attacks.
- **Supabase RLS**: Database is configured to handle user data isolation.

---

## Future Roadmap

- **Scan-to-Split**: AI-powered receipt scanning and OCR.
- **Recurring Bills**: Automatic tracking for rent and subscriptions.
- **Yield-Bearing Balances**: Option to hold group funds in Aave/Moola for interest.

---

Built for Celo Proof of Ship.
