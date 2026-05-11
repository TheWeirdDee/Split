# Split — Engineering Specification

**Covers:** Smart Contract · Supabase Schema · Balance Engine · Frontend Integration

---

## 1. Smart Contract

### `SplitGroup.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SplitGroup is ReentrancyGuard {

    IERC20 public immutable cUSD;

    // cUSD on Celo Mainnet
    // 0x765DE816845861e75A25fCA122bb6898B8B1282a

    struct Group {
        bytes32 id;
        address creator;
        uint256 createdAt;
        bool exists;
    }

    mapping(bytes32 => Group) public groups;
    mapping(bytes32 => mapping(address => bool)) public groupMembers;
    mapping(bytes32 => uint256) public groupMemberCount;

    event GroupCreated(
        bytes32 indexed groupId,
        address indexed creator,
        uint256 timestamp
    );

    event MemberJoined(
        bytes32 indexed groupId,
        address indexed member,
        uint256 timestamp
    );

    event DebtSettled(
        bytes32 indexed groupId,
        address indexed debtor,
        address indexed creditor,
        uint256 amount,
        uint256 timestamp
    );

    event ExpenseRecorded(
        bytes32 indexed groupId,
        bytes32 indexed expenseId,
        address indexed payer,
        uint256 totalAmount,
        uint256 timestamp
    );

    constructor(address _cUSD) {
        cUSD = IERC20(_cUSD);
    }

    // Create a group onchain
    function createGroup(bytes32 groupId) external {
        require(!groups[groupId].exists, "Group exists");

        groups[groupId] = Group({
            id: groupId,
            creator: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        // Creator auto-joins
        groupMembers[groupId][msg.sender] = true;
        groupMemberCount[groupId] = 1;

        emit GroupCreated(groupId, msg.sender, block.timestamp);
        emit MemberJoined(groupId, msg.sender, block.timestamp);
    }

    // Join an existing group
    function joinGroup(bytes32 groupId) external {
        require(groups[groupId].exists, "Group not found");
        require(!groupMembers[groupId][msg.sender], "Already member");

        groupMembers[groupId][msg.sender] = true;
        groupMemberCount[groupId]++;

        emit MemberJoined(groupId, msg.sender, block.timestamp);
    }

    // Record an expense (metadata stored offchain, amount logged onchain)
    function recordExpense(
        bytes32 groupId,
        bytes32 expenseId,
        uint256 totalAmount
    ) external {
        require(groups[groupId].exists, "Group not found");
        require(groupMembers[groupId][msg.sender], "Not a member");

        emit ExpenseRecorded(
            groupId,
            expenseId,
            msg.sender,
            totalAmount,
            block.timestamp
        );
    }

    // Settle a debt — transfers cUSD directly to creditor
    function settleDebt(
        bytes32 groupId,
        address creditor,
        uint256 amount
    ) external nonReentrant {
        require(groups[groupId].exists, "Group not found");
        require(groupMembers[groupId][msg.sender], "Not a member");
        require(groupMembers[groupId][creditor], "Creditor not member");
        require(msg.sender != creditor, "Cannot pay yourself");
        require(amount > 0, "Amount must be positive");

        require(
            cUSD.transferFrom(msg.sender, creditor, amount),
            "Transfer failed"
        );

        emit DebtSettled(
            groupId,
            msg.sender,
            creditor,
            amount,
            block.timestamp
        );
    }

    // View functions
    function isGroupMember(
        bytes32 groupId,
        address user
    ) external view returns (bool) {
        return groupMembers[groupId][user];
    }

    function getGroup(
        bytes32 groupId
    ) external view returns (Group memory) {
        return groups[groupId];
    }

    function getMemberCount(
        bytes32 groupId
    ) external view returns (uint256) {
        return groupMemberCount[groupId];
    }
}
```

### Contract Addresses

```
cUSD (Celo Mainnet):   0x765DE816845861e75A25fCA122bb6898B8B1282a
SplitGroup (deploy):   [FILL AFTER DEPLOY]
```

### ABI (key functions for frontend)

```typescript
export const SPLIT_ABI = [
  {
    name: "createGroup",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "groupId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "joinGroup",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "groupId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "recordExpense",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "groupId", type: "bytes32" },
      { name: "expenseId", type: "bytes32" },
      { name: "totalAmount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "settleDebt",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "groupId", type: "bytes32" },
      { name: "creditor", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "DebtSettled",
    type: "event",
    inputs: [
      { name: "groupId", type: "bytes32", indexed: true },
      { name: "debtor", type: "address", indexed: true },
      { name: "creditor", type: "address", indexed: true },
      { name: "amount", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
  },
  {
    name: "GroupCreated",
    type: "event",
    inputs: [
      { name: "groupId", type: "bytes32", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "timestamp", type: "uint256" },
    ],
  },
] as const;
```

---

## 2. Hardhat Configuration

### `hardhat.config.ts`

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: { celo: process.env.CELOSCAN_API_KEY || "" },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
    ],
  },
};
export default config;
```

### `scripts/deploy.ts`

```typescript
import { ethers } from "hardhat";

async function main() {
  const CUSD = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

  console.log("Deploying SplitGroup to Celo Mainnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "CELO");

  const feeData = await ethers.provider.getFeeData();
  const Factory = await ethers.getContractFactory("SplitGroup");
  const contract = await Factory.deploy(CUSD, {
    gasPrice: feeData.gasPrice ?? undefined,
  });

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n✅ SplitGroup deployed!");
  console.log("Address:", address);
  console.log("Explorer: https://celoscan.io/address/" + address);
  console.log("\nAdd to .env.local:");
  console.log("NEXT_PUBLIC_SPLIT_CONTRACT=" + address);
  console.log("\nVerify:");
  console.log(`npx hardhat verify --network celo ${address} ${CUSD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

### Deploy Commands

```bash
cd contracts
npm install --legacy-peer-deps
npx hardhat compile
npx hardhat run scripts/deploy.ts --network celo
```

---

## 3. Supabase Schema

### Setup

1. Go to https://supabase.com → New project
2. Get your URL and anon key
3. Run the SQL below in the Supabase SQL editor

### SQL Schema

```sql
-- Groups table
CREATE TABLE groups (
  id TEXT PRIMARY KEY,              -- UUID, also used as onchain groupId (bytes32)
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '👥',
  description TEXT,
  created_by TEXT NOT NULL,         -- wallet address
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT                   -- tx hash of createGroup call
);

-- Group members
CREATE TABLE group_members (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT,                  -- tx hash of joinGroup call
  PRIMARY KEY (group_id, wallet_address)
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  total_amount DECIMAL(18, 6) NOT NULL,  -- in cUSD
  paid_by TEXT NOT NULL,                 -- wallet address
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT                        -- tx hash of recordExpense
);

-- Expense splits (who owes what per expense)
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL(18, 6) NOT NULL,        -- amount this person owes
  is_payer BOOLEAN DEFAULT FALSE
);

-- Settlements
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id),
  debtor TEXT NOT NULL,                  -- who paid
  creditor TEXT NOT NULL,                -- who received
  amount DECIMAL(18, 6) NOT NULL,
  onchain_tx TEXT NOT NULL,              -- REQUIRED — celoscan link
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_group_members_wallet ON group_members(wallet_address);
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_settlements_group ON settlements(group_id);
CREATE INDEX idx_settlements_debtor ON settlements(debtor);
CREATE INDEX idx_settlements_creditor ON settlements(creditor);

-- Row Level Security (allow all for MVP)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON groups FOR ALL USING (true);
CREATE POLICY "Allow all" ON group_members FOR ALL USING (true);
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow all" ON expense_splits FOR ALL USING (true);
CREATE POLICY "Allow all" ON settlements FOR ALL USING (true);
```

---

## 4. Balance Engine (`src/lib/balanceEngine.ts`)

```typescript
import { createClient } from "@supabase/supabase-js";

export interface Balance {
  from: string; // wallet address — owes money
  to: string; // wallet address — is owed money
  amount: number; // in cUSD
}

export interface PersonBalance {
  address: string;
  netBalance: number; // positive = owed, negative = owes
}

// Calculate who owes who in a group
export async function calculateGroupBalances(
  groupId: string,
  supabase: any,
): Promise<Balance[]> {
  // 1. Get all expense splits
  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      `
      id,
      paid_by,
      expense_splits (wallet_address, amount, is_payer)
    `,
    )
    .eq("group_id", groupId);

  // 2. Get all settlements
  const { data: settlements } = await supabase
    .from("settlements")
    .select("debtor, creditor, amount")
    .eq("group_id", groupId);

  // 3. Build raw debt map
  const debts: Record<string, Record<string, number>> = {};
  // debts[A][B] = amount A owes B

  const addDebt = (from: string, to: string, amount: number) => {
    if (from === to) return;
    if (!debts[from]) debts[from] = {};
    debts[from][to] = (debts[from][to] || 0) + amount;
  };

  // Process expenses
  expenses?.forEach((expense: any) => {
    const payer = expense.paid_by;
    expense.expense_splits
      ?.filter((s: any) => !s.is_payer && s.wallet_address !== payer)
      .forEach((split: any) => {
        addDebt(split.wallet_address, payer, Number(split.amount));
      });
  });

  // Process settlements (reduce debts)
  settlements?.forEach((s: any) => {
    addDebt(s.creditor, s.debtor, Number(s.amount));
  });

  // 4. Simplify debts (net out A→B and B→A)
  const simplified: Balance[] = [];
  const processed = new Set<string>();

  Object.entries(debts).forEach(([from, toMap]) => {
    Object.entries(toMap).forEach(([to, amount]) => {
      const key = [from, to].sort().join("-");
      if (processed.has(key)) return;
      processed.add(key);

      const reverse = debts[to]?.[from] || 0;
      const net = amount - reverse;

      if (net > 0.001) {
        simplified.push({ from, to, amount: Math.round(net * 1000) / 1000 });
      } else if (net < -0.001) {
        simplified.push({
          from: to,
          to: from,
          amount: Math.round(-net * 1000) / 1000,
        });
      }
    });
  });

  return simplified;
}

// Get net balance for a specific user in a group
export function getUserNetBalance(
  userAddress: string,
  balances: Balance[],
): number {
  let net = 0;
  balances.forEach((b) => {
    if (b.to.toLowerCase() === userAddress.toLowerCase()) net += b.amount;
    if (b.from.toLowerCase() === userAddress.toLowerCase()) net -= b.amount;
  });
  return Math.round(net * 1000) / 1000;
}

// Split amount equally
export function splitEqually(
  totalAmount: number,
  participants: string[],
): Record<string, number> {
  const perPerson =
    Math.round((totalAmount / participants.length) * 1000) / 1000;
  const result: Record<string, number> = {};
  participants.forEach((p) => {
    result[p] = perPerson;
  });
  return result;
}

// Generate groupId for onchain use
export function generateGroupId(groupUUID: string): `0x${string}` {
  // Pad UUID to bytes32
  const hex = groupUUID.replace(/-/g, "");
  return `0x${hex.padEnd(64, "0")}` as `0x${string}`;
}
```

---

## 5. Wallet Context (`src/context/WalletContext.tsx`)

```typescript
'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPublicClient, createWalletClient, custom, http, erc20Abi } from 'viem';
import { celo } from 'viem/chains';

const CUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

export const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
});

const WalletContext = createContext<any>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [cUSDBalance, setCUSDBalance] = useState('0');
  const [walletClient, setWalletClient] = useState<any>(null);

  const fetchBalances = useCallback(async (addr: string) => {
    try {
      const raw = await publicClient.readContract({
        address: CUSD as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [addr as `0x${string}`]
      });
      setCUSDBalance((Number(raw) / 1e18).toFixed(2));
    } catch { setCUSDBalance('0'); }
  }, []);

  // MiniPay hook — auto connect
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    // MiniPay hook (required for Proof of Ship booster)
    const miniPay = window.ethereum?.isMiniPay === true;
    if (!miniPay) return;

    setIsMiniPay(true);
    window.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(async (accounts: string[]) => {
        if (!accounts?.[0]) return;
        const addr = accounts[0];
        const client = createWalletClient({
          chain: celo,
          transport: custom(window.ethereum)
        });
        setAddress(addr);
        setIsConnected(true);
        setWalletClient(client);
        await fetchBalances(addr);
      })
      .catch(console.error);
  }, [fetchBalances]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please open in MiniPay or install MetaMask');
      return;
    }
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Switch to Celo Mainnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xA4EC' }]
        });
      } catch (e: any) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xA4EC',
              chainName: 'Celo Mainnet',
              nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
              rpcUrls: ['https://forno.celo.org'],
              blockExplorerUrls: ['https://celoscan.io']
            }]
          });
        }
      }

      const addr = accounts[0];
      const client = createWalletClient({
        chain: celo,
        transport: custom(window.ethereum)
      });
      setAddress(addr);
      setIsConnected(true);
      setIsMiniPay(window.ethereum?.isMiniPay === true);
      setWalletClient(client);
      await fetchBalances(addr);
    } catch (e: any) {
      if (e.code !== 4001) console.error('Connect failed:', e);
    }
  }, [fetchBalances]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setCUSDBalance('0');
    setWalletClient(null);
    setIsMiniPay(false);
    try { localStorage.clear(); } catch {}
    window.location.replace('/app');
  }, []);

  return (
    <WalletContext.Provider value={{
      address, isConnected, isMiniPay,
      cUSDBalance, walletClient, publicClient,
      connect, disconnect, fetchBalances
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be inside WalletProvider');
  return ctx;
};
```

---

## 6. Settlement Hook (`src/hooks/useSettle.ts`)

```typescript
import { parseUnits, erc20Abi } from "viem";
import { celo } from "viem/chains";
import { useWallet } from "@/context/WalletContext";
import { SPLIT_ABI } from "@/lib/contract";

const CUSD = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
const CONTRACT = process.env.NEXT_PUBLIC_SPLIT_CONTRACT as `0x${string}`;

export function useSettle() {
  const { address, walletClient, publicClient } = useWallet();

  async function settle(
    groupId: `0x${string}`,
    creditor: string,
    amountCUSD: number,
    supabase: any,
    dbGroupId: string,
  ) {
    if (!address || !walletClient) throw new Error("Not connected");

    const amount = parseUnits(amountCUSD.toString(), 18);

    // 1. Approve cUSD
    const gasPrice = await publicClient.getGasPrice();
    const approveNonce = await publicClient.getTransactionCount({
      address: address as `0x${string}`,
      blockTag: "pending",
    });

    const approveTx = await walletClient.writeContract({
      address: CUSD as `0x${string}`,
      abi: erc20Abi,
      functionName: "approve",
      args: [CONTRACT, amount],
      chain: celo,
      account: address as `0x${string}`,
      gasPrice,
      nonce: approveNonce,
    });
    await publicClient.waitForTransactionReceipt({
      hash: approveTx,
      confirmations: 1,
    });

    // 2. Settle onchain
    const settleNonce = await publicClient.getTransactionCount({
      address: address as `0x${string}`,
      blockTag: "pending",
    });

    const settleTx = await walletClient.writeContract({
      address: CONTRACT,
      abi: SPLIT_ABI,
      functionName: "settleDebt",
      args: [groupId, creditor as `0x${string}`, amount],
      chain: celo,
      account: address as `0x${string}`,
      gasPrice,
      nonce: settleNonce,
    });
    await publicClient.waitForTransactionReceipt({
      hash: settleTx,
      confirmations: 1,
    });

    // 3. Save to Supabase
    await supabase.from("settlements").insert({
      group_id: dbGroupId,
      debtor: address,
      creditor,
      amount: amountCUSD,
      onchain_tx: settleTx,
    });

    return settleTx;
  }

  return { settle };
}
```

---

## 7. Environment Variables

### `.env.local`

```env
# Supabase (get from supabase.com dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Smart contract
NEXT_PUBLIC_SPLIT_CONTRACT=0x_after_deploy

# cUSD on Celo Mainnet
NEXT_PUBLIC_CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a

# Chain
NEXT_PUBLIC_CHAIN_ID=42220

# App URL (for invite links + QR code)
NEXT_PUBLIC_APP_URL=https://split.vercel.app
```

### `contracts/.env`

```env
PRIVATE_KEY=0x_your_private_key
CELOSCAN_API_KEY=your_celoscan_key
```

---

## 8. Invite Link System

```typescript
// Generate invite link
export function generateInviteLink(groupId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  return `${baseUrl}/app/join/${groupId}`;
}

// Share via WhatsApp (popular in Africa)
export function shareViaWhatsApp(groupName: string, inviteLink: string): void {
  const text = encodeURIComponent(
    `Hey! Join my "${groupName}" group on Split to track our shared expenses.\n\n${inviteLink}`,
  );
  window.open(`https://wa.me/?text=${text}`, "_blank");
}

// Copy to clipboard
export async function copyInviteLink(link: string): Promise<void> {
  await navigator.clipboard.writeText(link);
}
```

---

## 9. Deployment Steps

```bash
# 1. Deploy smart contract
cd contracts
npm install --legacy-peer-deps
npx hardhat compile
npx hardhat run scripts/deploy.ts --network celo
# Copy contract address

# 2. Set up Supabase
# - Create project at supabase.com
# - Run SQL schema in SQL Editor
# - Copy URL and anon key

# 3. Fill .env.local with all values

# 4. Deploy frontend
cd ..
npx vercel --prod
# Add all env vars in Vercel dashboard

# 5. Verify contract
cd contracts
npx hardhat verify --network celo YOUR_CONTRACT_ADDRESS \
  0x765DE816845861e75A25fCA122bb6898B8B1282a
```

---

## 10. Security Checklist

- [ ] Smart contract audited with Slither
- [ ] No private keys in frontend
- [ ] Contract verified on Celoscan
- [ ] ReentrancyGuard on settleDebt
- [ ] Supabase RLS enabled
- [ ] Input validation on all amount inputs
- [ ] Group membership verified before all operations
- [ ] Self-payment prevented in contract
