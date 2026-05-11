# Split — Complete Agent Build Prompt

Paste this entire prompt to your coding agent to build the full Split app.

---

```
You are building "Split" — a MiniPay-native group expense splitting
app on Celo Mainnet. Users split bills, track who owes what, and
settle debts with cUSD onchain. Built for Celo Proof of Ship.

Read ALL instructions before writing any code.
Build everything completely — no truncation, no placeholders.

════════════════════════════════════════════════════════════════
TECH STACK
════════════════════════════════════════════════════════════════

Frontend:  Next.js 14 App Router, Tailwind CSS
Wallet:    Viem (NO ethers.js), custom MiniPay hook
Database:  Supabase (PostgreSQL)
Chain:     Celo Mainnet (chainId: 42220)
Token:     cUSD (0x765DE816845861e75A25fCA122bb6898B8B1282a)
Contract:  SplitGroup.sol (Hardhat)
Hosting:   Vercel

════════════════════════════════════════════════════════════════
DESIGN SYSTEM — implement EXACTLY as specified
════════════════════════════════════════════════════════════════

Colors (add to globals.css as CSS variables):
--bg:              #0D0D0D
--surface:         #161616
--surface-2:       #1F1F1F
--border:          #2C2C2C
--text-primary:    #F7F3EC
--text-secondary:  #8A8A8A
--text-muted:      #4A4A4A
--brand:           #00C896
--brand-dim:       rgba(0,200,150,0.12)
--brand-dark:      #009E78
--money-positive:  #00C896
--money-negative:  #FF5C5C
--money-settled:   #4A4A4A

Fonts (load from Google Fonts in layout.tsx):
- Clash Display (display/headings)
- DM Sans (body text)
- DM Mono (numbers, addresses, code)

Font import URL:
https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap

For Clash Display use @font-face or Fontsource:
npm install @fontsource/clash-display

Tailwind — add these to tailwind.config.js:
fontFamily: {
  display: ['Clash Display', 'sans-serif'],
  body: ['DM Sans', 'sans-serif'],
  mono: ['DM Mono', 'monospace'],
}

════════════════════════════════════════════════════════════════
ENVIRONMENT VARIABLES
════════════════════════════════════════════════════════════════

Create .env.local:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SPLIT_CONTRACT=
NEXT_PUBLIC_CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_APP_URL=https://your-split-app.vercel.app

Create .env.example with same keys but empty values.

════════════════════════════════════════════════════════════════
INSTALL DEPENDENCIES
════════════════════════════════════════════════════════════════

npm install viem @supabase/supabase-js qrcode.react
npm install @fontsource/clash-display
npm install --save-dev @types/node

════════════════════════════════════════════════════════════════
FILE STRUCTURE — create ALL these files
════════════════════════════════════════════════════════════════

src/
  app/
    layout.tsx
    globals.css
    page.tsx                         ← Landing page
    app/
      layout.tsx                     ← App shell
      page.tsx                       ← Home (groups list)
      create/page.tsx                ← Create group
      join/[groupId]/page.tsx        ← Join group
      group/[groupId]/page.tsx       ← Group detail
      group/[groupId]/add/page.tsx   ← Add expense
      settle/[debtId]/page.tsx       ← Settle debt
      activity/page.tsx              ← Activity feed
  components/
    landing/Navbar.tsx
    landing/Hero.tsx
    landing/HowItWorks.tsx
    landing/Footer.tsx
    app/AppHeader.tsx
    app/BottomNav.tsx
    app/WalletBadge.tsx
    app/GroupCard.tsx
    app/BalanceSummaryCard.tsx
    app/BalanceRow.tsx
    app/ExpenseCard.tsx
    app/ActivityItem.tsx
    app/PaymentSuccess.tsx
    app/CategoryPicker.tsx
    app/SkeletonCard.tsx
    common/Button.tsx
    common/Input.tsx
    common/Card.tsx
    common/AmountDisplay.tsx
    common/WalletAvatar.tsx
  context/
    WalletContext.tsx
  hooks/
    useGroups.ts
    useExpenses.ts
    useBalances.ts
    useSettle.ts
  lib/
    supabase.ts
    viem.ts
    contract.ts
    balanceEngine.ts
    inviteLinks.ts
    utils.ts
  constants/
    chains.ts
    categories.ts
contracts/
  contracts/SplitGroup.sol
  scripts/deploy.ts
  hardhat.config.ts
  package.json
  .env.example

════════════════════════════════════════════════════════════════
SMART CONTRACT — contracts/contracts/SplitGroup.sol
════════════════════════════════════════════════════════════════

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SplitGroup is ReentrancyGuard {
    IERC20 public immutable cUSD;

    struct Group {
        bytes32 id;
        address creator;
        uint256 createdAt;
        bool exists;
    }

    mapping(bytes32 => Group) public groups;
    mapping(bytes32 => mapping(address => bool)) public groupMembers;
    mapping(bytes32 => uint256) public groupMemberCount;

    event GroupCreated(bytes32 indexed groupId, address indexed creator, uint256 timestamp);
    event MemberJoined(bytes32 indexed groupId, address indexed member, uint256 timestamp);
    event DebtSettled(bytes32 indexed groupId, address indexed debtor, address indexed creditor, uint256 amount, uint256 timestamp);
    event ExpenseRecorded(bytes32 indexed groupId, bytes32 indexed expenseId, address indexed payer, uint256 totalAmount, uint256 timestamp);

    constructor(address _cUSD) { cUSD = IERC20(_cUSD); }

    function createGroup(bytes32 groupId) external {
        require(!groups[groupId].exists, "Group exists");
        groups[groupId] = Group(groupId, msg.sender, block.timestamp, true);
        groupMembers[groupId][msg.sender] = true;
        groupMemberCount[groupId] = 1;
        emit GroupCreated(groupId, msg.sender, block.timestamp);
        emit MemberJoined(groupId, msg.sender, block.timestamp);
    }

    function joinGroup(bytes32 groupId) external {
        require(groups[groupId].exists, "Group not found");
        require(!groupMembers[groupId][msg.sender], "Already member");
        groupMembers[groupId][msg.sender] = true;
        groupMemberCount[groupId]++;
        emit MemberJoined(groupId, msg.sender, block.timestamp);
    }

    function recordExpense(bytes32 groupId, bytes32 expenseId, uint256 totalAmount) external {
        require(groups[groupId].exists, "Group not found");
        require(groupMembers[groupId][msg.sender], "Not a member");
        emit ExpenseRecorded(groupId, expenseId, msg.sender, totalAmount, block.timestamp);
    }

    function settleDebt(bytes32 groupId, address creditor, uint256 amount) external nonReentrant {
        require(groups[groupId].exists, "Group not found");
        require(groupMembers[groupId][msg.sender], "Not a member");
        require(groupMembers[groupId][creditor], "Creditor not member");
        require(msg.sender != creditor, "Cannot pay yourself");
        require(amount > 0, "Amount must be positive");
        require(cUSD.transferFrom(msg.sender, creditor, amount), "Transfer failed");
        emit DebtSettled(groupId, msg.sender, creditor, amount, block.timestamp);
    }

    function isGroupMember(bytes32 groupId, address user) external view returns (bool) {
        return groupMembers[groupId][user];
    }

    function getGroup(bytes32 groupId) external view returns (Group memory) {
        return groups[groupId];
    }
}

════════════════════════════════════════════════════════════════
SUPABASE SCHEMA — create this in Supabase SQL editor
════════════════════════════════════════════════════════════════

Create src/lib/supabase-schema.sql with this content
(developer will run this manually in Supabase):

CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '👥',
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT
);

CREATE TABLE group_members (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT,
  PRIMARY KEY (group_id, wallet_address)
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  total_amount DECIMAL(18,6) NOT NULL,
  paid_by TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT
);

CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  is_payer BOOLEAN DEFAULT FALSE
);

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL,
  debtor TEXT NOT NULL,
  creditor TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  onchain_tx TEXT NOT NULL,
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

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

════════════════════════════════════════════════════════════════
LANDING PAGE — src/app/page.tsx
════════════════════════════════════════════════════════════════

Build a full marketing landing page with these sections:

NAVBAR:
- Left: "S" mark logo (SVG — geometric hexagon with split line) + "Split" in Clash Display
- Right: "Open App →" button (brand green, pill shape)
- Sticky with backdrop blur
- Border bottom appears on scroll

HERO (full viewport height):
- Background: #0D0D0D with subtle dot grid pattern (CSS radial-gradient)
  dot pattern: radial-gradient(circle, #2C2C2C 1px, transparent 1px) 0 0 / 24px 24px
  Plus grain overlay: fixed pseudo-element with SVG turbulence noise at 3% opacity
- Content centered, max-width 640px
- Overline: "SPLIT · SETTLE · REPEAT" (DM Mono 11px, --brand, tracking-widest)
- H1:
  Line 1: "SPLIT BILLS."
  Line 2: "SETTLE INSTANTLY." (italic)
  Line 3: "NO AWKWARDNESS."
  Font: Clash Display 700, clamp(36px, 7vw, 72px), line-height 0.92
  Color: --text-primary
- Subtext: "Pay with cUSD. Settle onchain. Works in MiniPay."
  DM Sans 16px, --text-secondary
- CTA: "Open App →" + "See how it works ↓" side by side
- Trust line: "✦ Built on Celo · Powered by MiniPay · Open Source"

HOW IT WORKS (3 steps):
Step 01: 👥 Create a group — "Set up in 10 seconds. Share an invite link."
Step 02: 🧾 Log expenses — "Who paid. Who owes. Auto-calculated."
Step 03: ⚡ Settle with cUSD — "One tap. Instant. Onchain forever."
Each step has large dim number "01" "02" "03" in DM Mono

USE CASES section:
Horizontal pill buttons: 🍕 Food · 🚗 Transport · 🏠 Rent · 🎉 Events · ✈️ Travel
Each pill: dark surface, thin border, emoji + label

CTA SECTION:
"Stop chasing people for money."
Large heading + "Open Split →" button
QR code below for mobile

FOOTER:
"Split · Built on Celo Mainnet · Open Source on GitHub"

════════════════════════════════════════════════════════════════
APP PAGES — implement all with full functionality
════════════════════════════════════════════════════════════════

APP LAYOUT (src/app/app/layout.tsx):
- Dark bg #0D0D0D
- Fixed header 56px top
- Fixed bottom nav 60px
- Content area scrollable with padding-bottom 80px
- Max-width 430px centered on desktop with side borders

HEADER (AppHeader.tsx):
- Left: back arrow OR "Split" logo
- Center: page title
- Right: WalletBadge (address + cUSD in green)
- When NOT connected: show "Connect" button

BOTTOM NAV (BottomNav.tsx):
- 3 tabs: Home (🏠) · Activity (📋) · Settings (⚙️)
- Active: icon + label in --brand
- Inactive: icon in --text-muted
- Safe area bottom padding for iPhone

HOME PAGE (src/app/app/page.tsx):
When NOT connected (and not MiniPay):
  Show: Split logo + "Connect Wallet" button + QR code
  (same as MicroMind pattern)

When connected:
  Show:
  1. Balance summary card (total owed/owing across all groups)
  2. "YOUR GROUPS" section header
  3. Group cards list (tap → /app/group/[id])
  4. "+" Create Group card at bottom

  If no groups: empty state with "Create your first group →"

GROUP CARD component:
- Emoji (40px) + group name (Clash Display 16px) + "X members" (DM Sans 12px muted)
- Right side: balance amount in DM Mono (green if owed, red if owe, gray if settled)
- 52px height, full width, border, rounded-xl, tap navigates

CREATE GROUP PAGE (src/app/app/create/page.tsx):
Step 1: Pick emoji (grid of 20 emojis)
Step 2: Enter group name (large input)
Step 3: Optional description
Submit button: calls supabase to create group + calls contract createGroup
After: show share sheet with invite link, WhatsApp share button, Copy button

JOIN PAGE (src/app/app/join/[groupId]/page.tsx):
- Show group name, emoji, creator, member count
- "Join Group" button
- Calls contract joinGroup + supabase insert to group_members
- Redirect to /app/group/[groupId] after joining

GROUP DETAIL PAGE (src/app/app/group/[groupId]/page.tsx):
Top section: BALANCES
  - Calculate and show who owes who using balanceEngine
  - Each balance row: avatar + "You owe [Name] X cUSD" + PAY button
  - Or: "[Name] owes you X cUSD" + REMIND button (copies message to clipboard)
  - Settled pairs: muted with "✓ SETTLED" badge
  - "ADD MEMBERS" button → copies invite link

Bottom section: EXPENSES (chronological, newest first)
  Each expense card:
  - Category color left border
  - Description + total amount
  - "Paid by [name/you]" + "Your share: X cUSD"
  - Date in muted text

Sticky "+" Add Expense button above bottom nav

ADD EXPENSE PAGE (src/app/app/group/[groupId]/add/page.tsx):
Form fields:
1. Description text input
2. Category picker (emoji grid: 🍕 🚗 🏠 🎉 ⚡ 🛒 ☕ 🎵 💊 ···)
3. Amount input (large, DM Mono, cUSD label)
4. "Who paid?" — radio selection from group members
5. "Split between" — checkbox selection (default: all)
6. Split type: [Equally] [Custom] toggle pills
7. If Custom: input per person
8. Preview: "Each person pays: X cUSD"
Submit:
  - Save to supabase (expense + expense_splits)
  - Call contract recordExpense for onchain record
  - Navigate back to group

SETTLE PAGE (src/app/app/settle/[debtId]/page.tsx):
- Show: You → amount → recipient (visual flow)
- Amount in large DM Mono green
- "For: [expense descriptions]"
- "Confirm & Pay" button
- On confirm:
  1. Approve cUSD (walletClient.writeContract approve)
  2. Call contract settleDebt
  3. Save settlement to supabase
  4. Show success screen with checkmark animation + celoscan link
- "Cancel" text button below

ACTIVITY PAGE (src/app/app/activity/page.tsx):
- All events across all user's groups
- Grouped by date: TODAY / YESTERDAY / earlier dates
- Event types:
  - Settlement sent (green left border, "✓ You paid [name] X cUSD")
  - Settlement received (brand left border, "✓ [name] paid you X cUSD")
  - Expense added (blue left border, "+ [description] — X cUSD")
  - Group joined (muted left border, "👥 Joined [group name]")
- Each event: group name badge + celoscan link for settlements

════════════════════════════════════════════════════════════════
BALANCE ENGINE — src/lib/balanceEngine.ts
════════════════════════════════════════════════════════════════

Implement calculateGroupBalances function that:
1. Fetches all expenses + splits from Supabase for a group
2. Fetches all settlements from Supabase for a group
3. Builds debt map: who owes who and how much
4. Applies settlements to reduce debts
5. Simplifies: if A owes B $5 and B owes A $3, result is A owes B $2
6. Returns array of {from, to, amount} — simplified minimal transactions

Also implement:
- getUserNetBalance(address, balances) → net number
- splitEqually(total, participants[]) → Record<address, amount>
- generateGroupId(uuid) → bytes32 hex string

════════════════════════════════════════════════════════════════
WALLET CONTEXT — src/context/WalletContext.tsx
════════════════════════════════════════════════════════════════

Implement with:
- MiniPay hook: check window.ethereum.isMiniPay → auto-connect silently
- Desktop: connect button → wallet_requestPermissions → eth_requestAccounts
- Auto-switch to Celo Mainnet (0xA4EC), add if missing
- Fetch cUSD balance after connect (cUSD uses 18 decimals)
- Disconnect: clear all state + localStorage.clear() + redirect /app
- Expose: address, isConnected, isMiniPay, cUSDBalance, walletClient, publicClient, connect, disconnect

════════════════════════════════════════════════════════════════
INVITE LINK SYSTEM — src/lib/inviteLinks.ts
════════════════════════════════════════════════════════════════

generateInviteLink(groupId): returns full URL to /app/join/[groupId]
shareViaWhatsApp(groupName, link): opens wa.me with pre-filled message
copyToClipboard(text): navigator.clipboard.writeText

════════════════════════════════════════════════════════════════
CONTRACT INTEGRATION — src/lib/contract.ts
════════════════════════════════════════════════════════════════

Export:
- CONTRACT_ADDRESS from env
- CUSD_ADDRESS constant
- SPLIT_ABI array (createGroup, joinGroup, recordExpense, settleDebt, all events)
- Helper: generateGroupId(uuid: string): `0x${string}`
  Implementation: keccak256(toBytes(uuid)) from viem

════════════════════════════════════════════════════════════════
HARDHAT CONTRACT SETUP
════════════════════════════════════════════════════════════════

contracts/package.json:
{
  "name": "split-contracts",
  "devDependencies": {
    "hardhat": "^2.19.0",
    "@nomicfoundation/hardhat-toolbox": "^3.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@types/node": "^20.0.0"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0",
    "dotenv": "^16.0.0"
  }
}

contracts/hardhat.config.ts:
Standard Hardhat config with celo network:
- url: https://forno.celo.org
- chainId: 42220
- accounts: [process.env.PRIVATE_KEY]
- Celoscan verification config

contracts/scripts/deploy.ts:
- Deploy SplitGroup with cUSD address
- Use provider.getFeeData() for gas
- Print contract address + verify command

════════════════════════════════════════════════════════════════
RESPONSIVE DESIGN RULES
════════════════════════════════════════════════════════════════

ALL app pages (/app/**):
- Default: full width mobile
- md and up: max-width 430px, centered, border-x --border

Landing page (/):
- Mobile: stacked layout, hero text smaller
- Desktop: can use full width, horizontal sections

Input font-size: always 16px minimum (prevents iOS zoom)
Touch targets: minimum 48px height
Padding bottom on all scroll containers: 80px (above bottom nav)
Safe area: padding-bottom: env(safe-area-inset-bottom)

════════════════════════════════════════════════════════════════
PAYMENT FLOW — complete implementation
════════════════════════════════════════════════════════════════

In useSettle.ts, implement settle() function:

1. Get gasPrice from publicClient.getGasPrice()
2. Get nonce from publicClient.getTransactionCount (blockTag: pending)
3. Approve cUSD: walletClient.writeContract({
     address: CUSD, abi: erc20Abi, functionName: 'approve',
     args: [CONTRACT_ADDRESS, amount],
     chain: celo, account: address, gasPrice, nonce
   })
4. Wait for receipt (confirmations: 1)
5. Get new nonce (pending)
6. Settle: walletClient.writeContract({
     address: CONTRACT_ADDRESS, abi: SPLIT_ABI,
     functionName: 'settleDebt',
     args: [groupIdBytes32, creditor, amount],
     chain: celo, account: address, gasPrice, nonce
   })
7. Wait for receipt
8. Save to Supabase settlements table
9. Return txHash

Show payment steps in UI:
Step 1: "Approving cUSD..." (spinner)
Step 2: "Sending payment..." (spinner)
Step 3: "Confirmed ✓" (checkmark)

════════════════════════════════════════════════════════════════
CATEGORIES — src/constants/categories.ts
════════════════════════════════════════════════════════════════

export const CATEGORIES = [
  { id: 'food',          emoji: '🍕', label: 'Food',          color: '#FF9500' },
  { id: 'transport',     emoji: '🚗', label: 'Transport',     color: '#5AC8FA' },
  { id: 'utilities',     emoji: '⚡', label: 'Utilities',     color: '#FFCC00' },
  { id: 'rent',          emoji: '🏠', label: 'Rent',          color: '#AF52DE' },
  { id: 'entertainment', emoji: '🎉', label: 'Entertainment', color: '#FF375F' },
  { id: 'groceries',     emoji: '🛒', label: 'Groceries',     color: '#34C759' },
  { id: 'travel',        emoji: '✈️', label: 'Travel',        color: '#007AFF' },
  { id: 'health',        emoji: '💊', label: 'Health',        color: '#FF6B6B' },
  { id: 'other',         emoji: '···', label: 'Other',        color: '#636366' },
];

════════════════════════════════════════════════════════════════
WALLET AVATAR — src/components/common/WalletAvatar.tsx
════════════════════════════════════════════════════════════════

Generate a colored circle avatar from wallet address:
- Take first 6 chars of address as hex color seed
- Generate hue from address: parseInt(address.slice(2,8), 16) % 360
- HSL color: hsl(hue, 65%, 45%)
- Show first char of address (after 0x) as initial
- Size: 36px default, accept size prop

════════════════════════════════════════════════════════════════
AMOUNT DISPLAY — src/components/common/AmountDisplay.tsx
════════════════════════════════════════════════════════════════

Props: amount (number), variant ('positive'|'negative'|'neutral')
Font: DM Mono
Color: based on variant
Show: "X.XX cUSD"
For large display (payment screen): 48px, centered

════════════════════════════════════════════════════════════════
README.md — create at project root
════════════════════════════════════════════════════════════════

# Split — Group Expense Splitting on Celo

> Split bills. Settle instantly. No awkwardness.

## Live App
[split.vercel.app](https://split.vercel.app) — open in MiniPay

## What It Does
Split lets friend groups track shared expenses and settle
debts instantly using cUSD on Celo. Every settlement is
an onchain transaction.

## Tech Stack
Next.js 14 · Tailwind CSS · Viem · Supabase · Celo Mainnet

## Contract
Network: Celo Mainnet
Address: [FILL AFTER DEPLOY]
Token: cUSD

## MiniPay Hook
Implements window.ethereum.isMiniPay detection for
MiniPay compatibility booster.

## Local Setup
\`\`\`bash
git clone repo
npm install
cp .env.example .env.local
# Fill in Supabase + contract values
npm run dev
\`\`\`

## Deploy Contract
\`\`\`bash
cd contracts
npm install --legacy-peer-deps
npx hardhat compile
npx hardhat run scripts/deploy.ts --network celo
\`\`\`

Built for Celo Proof of Ship Season 2

════════════════════════════════════════════════════════════════
AFTER BUILDING — PRINT THESE MANUAL STEPS
════════════════════════════════════════════════════════════════

Print at end of build:

=================================================
SPLIT — MANUAL SETUP STEPS
=================================================

1. CREATE SUPABASE PROJECT
   - Go to supabase.com → New Project
   - Settings → API → copy URL + anon key
   - SQL Editor → paste content of src/lib/supabase-schema.sql
   - Click Run

2. DEPLOY SMART CONTRACT
   cd contracts
   cp .env.example .env
   # Add PRIVATE_KEY and CELOSCAN_API_KEY to contracts/.env
   npm install --legacy-peer-deps
   npx hardhat compile
   npx hardhat run scripts/deploy.ts --network celo
   # Copy the contract address from output

3. FILL .env.local
   NEXT_PUBLIC_SUPABASE_URL=from step 1
   NEXT_PUBLIC_SUPABASE_ANON_KEY=from step 1
   NEXT_PUBLIC_SPLIT_CONTRACT=from step 2
   NEXT_PUBLIC_APP_URL=your vercel URL (fill after step 4)

4. DEPLOY TO VERCEL
   npx vercel --prod
   # Add all env vars in Vercel dashboard
   # Copy your Vercel URL
   # Update NEXT_PUBLIC_APP_URL

5. VERIFY CONTRACT
   cd contracts
   npx hardhat verify --network celo CONTRACT_ADDRESS \
     0x765DE816845861e75A25fCA122bb6898B8B1282a

6. REGISTER ON TALENT.APP
   - talent.app → create project "Split"
   - Add GitHub repo (must be PUBLIC)
   - Add contract address
   - Add Vercel URL
   - Enroll in Proof of Ship

7. GET cUSD FOR TESTING
   - Open MiniPay → buy cUSD
   - Or receive cUSD from another wallet
   - Need ~1 cUSD for testing

8. TEST IN MINIPAY
   - MiniPay Settings → tap version 10x → Developer Mode
   - Load your Vercel URL
   - Create group → add expense → settle
=================================================
```
