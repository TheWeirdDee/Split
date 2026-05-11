# Split — Frontend & UI Specification

**Stack:** Next.js 14 · Tailwind CSS · Viem  
**Target:** MiniPay Mini App (390px mobile-first) + Desktop landing page

---

## 1. Design Direction

### Aesthetic: "Modern African Fintech"

Clean, trustworthy, warm. Not cold crypto. Not corporate banking.
Think: the confidence of Flutterwave, the warmth of African market culture,
the clarity of a well-designed receipt.

### Design Principles

- **Clarity first** — every number must be instantly readable
- **Color communicates money** — green = you're owed, red = you owe, always
- **Touch-friendly** — all tap targets minimum 48px
- **No confusion** — one primary action per screen

---

## 2. Color System

```css
/* Base */
--bg: #0d0d0d; /* near black */
--surface: #161616; /* card backgrounds */
--surface-2: #1f1f1f; /* elevated surfaces */
--border: #2c2c2c; /* subtle borders */

/* Text */
--text-primary: #f7f3ec; /* warm white */
--text-secondary: #8a8a8a; /* muted */
--text-muted: #4a4a4a; /* very muted */

/* Brand */
--brand: #00c896; /* Celo green — primary CTA */
--brand-dim: #00c89620; /* brand with opacity */
--brand-dark: #009e78; /* darker green for hover */

/* Semantic Money Colors */
--money-positive: #00c896; /* you are owed — green */
--money-negative: #ff5c5c; /* you owe — red */
--money-settled: #4a4a4a; /* settled — muted */
--money-neutral: #f7f3ec; /* even — white */

/* Categories */
--cat-food: #ff9500;
--cat-transport: #5ac8fa;
--cat-utilities: #ffcc00;
--cat-rent: #af52de;
--cat-entertainment: #ff375f;
--cat-other: #636366;
```

---

## 3. Typography

```css
/* Import in layout.tsx */
/* Display: Clash Display — geometric, modern, African fintech feel */
/* Body: DM Sans — clean, readable at small sizes */
/* Numbers: Tabular DM Mono — monospaced for amounts */

--font-display: "Clash Display", sans-serif;
--font-body: "DM Sans", sans-serif;
--font-mono: "DM Mono", monospace;

/* Scale */
--text-xs: 11px;
--text-sm: 13px;
--text-base: 15px;
--text-lg: 17px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 38px;
--text-hero: 52px;
```

---

## 4. Page Structure & Routes

```
/ (public)              Landing page
/app                    Home — your groups
/app/create             Create new group
/app/join/[groupId]     Join group via invite link
/app/group/[groupId]    Group detail — expenses + balances
/app/group/[id]/add     Add expense to group
/app/settle/[id]        Settle a specific debt
/app/activity           All activity across groups
```

---

## 5. Landing Page (`/`)

### Visual Direction

Full-screen dark hero. Geometric receipt/bill motif in the background
(abstract lines suggesting paper receipts, very subtle).
Bold Clash Display headline. Celo green accents.

### Layout (Desktop — 1280px max)

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR                                                  │
│  [Split logo]              [How it works] [Open App →]   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  HERO (100vh)                                            │
│                                                          │
│  ┌──────────────── centered ────────────────────┐        │
│  │                                               │        │
│  │  SPLIT BILLS.                                 │        │
│  │  SETTLE INSTANTLY.          [receipt mockup]  │        │
│  │  NO AWKWARDNESS.                              │        │
│  │                                               │        │
│  │  Split expenses with anyone.                  │        │
│  │  Settle with cUSD in seconds.                 │        │
│  │                                               │        │
│  │  [Open App →]  [See how it works ↓]           │        │
│  │                                               │        │
│  │  ✦ Built on Celo · Powered by MiniPay         │        │
│  └───────────────────────────────────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  HOW IT WORKS (3 steps)                                  │
│                                                          │
│  [01]          [02]          [03]                        │
│  Create a      Add your      Pay instantly               │
│  group         expenses      with cUSD                   │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  USE CASES (horizontal scroll on mobile)                 │
│                                                          │
│  🍕 Restaurant  🚗 Transport  🏠 Rent  🎉 Events         │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  LIVE PREVIEW — App mockup (phone frame)                 │
│  Show the group screen with fake data                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CTA SECTION                                             │
│  "Ready to split?" [Open in MiniPay →]                   │
│  QR code to open on mobile                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FOOTER                                                  │
│  Split · Built on Celo · Open Source                     │
└─────────────────────────────────────────────────────────┘
```

### Hero Background

Subtle animated receipt lines — thin white lines at 3% opacity,
arranged like stacked paper receipts, very slow parallax on scroll.
CSS only, no canvas.

### Navbar

```
Position: sticky top-0
Background: rgba(13,13,13,0.85) backdrop-blur-md
Border-bottom: 1px solid #2C2C2C (appears on scroll)
Height: 64px

Left: Split logo (S mark + "Split" wordmark in Clash Display)
Center (desktop only): "How it works" text link
Right: "Open App →" pill button (brand green fill)
```

### Hero Text Styling

```
Overline: "SPLIT · SETTLE · REPEAT" in DM Mono 11px tracking-widest
          color: --brand, opacity 0.8

H1: "SPLIT BILLS." line 1
    "SETTLE INSTANTLY." line 2 (italic weight)
    "NO AWKWARDNESS." line 3
    Font: Clash Display 600, clamp(40px, 7vw, 80px)
    Color: --text-primary
    Line height: 0.95

Subtext: DM Sans 16px, --text-secondary, max-width 480px

CTA Button:
  "Open App →"
  Background: --brand
  Color: #000
  Font: DM Sans 500 14px
  Padding: 14px 28px
  Border-radius: 100px
  Hover: background --brand-dark, slight scale(1.02)
```

### How It Works Section

```
Background: --surface (slightly lighter than hero)
Padding: 120px 24px

Title: "Simple by design." (Clash Display, 40px)

3 steps in a row (desktop) / stacked (mobile):

Each step:
  - Large number: "01" in DM Mono 80px, color: --brand, opacity 0.3
  - Icon: 32px emoji or SVG
  - Title: Clash Display 20px
  - Description: DM Sans 14px --text-secondary

Connector: thin dashed line between steps (desktop only)
```

---

## 6. App Shell (`/app/**`)

### Mobile Layout (390px — primary target)

```
┌────────────────────────┐
│ HEADER (56px fixed top)│
│ [←] Title    [avatar]  │
├────────────────────────┤
│                        │
│   PAGE CONTENT         │
│   (scrollable)         │
│   padding-bottom: 80px │
│                        │
├────────────────────────┤
│ BOTTOM NAV (60px fixed)│
│ [Home][Groups][Activity│
└────────────────────────┘
```

### Header Component

```
Height: 56px
Background: --bg
Border-bottom: 1px solid --border
Padding: 0 16px

Left: Back arrow (←) when on sub-page, or "Split" logo on home
Center: Page title (DM Sans 500 16px)
Right: Wallet badge (truncated address + cUSD balance)
```

### Bottom Navigation

```
Height: 60px
Background: --surface
Border-top: 1px solid --border
Safe area padding bottom (iPhone notch)

3 tabs:
- Home (house icon) → /app
- Groups (people icon) → /app (shows groups list)
- Activity (clock icon) → /app/activity

Active tab: icon + label in --brand
Inactive: icon only in --text-muted
```

### Wallet Badge (top right)

```
Background: --surface-2
Border: 1px solid --border
Border-radius: 20px
Padding: 6px 12px
Font: DM Mono 11px

Shows: "0xC688...8Ee  2.40 cUSD"
cUSD amount in --brand color
Tap: copies address to clipboard
```

---

## 7. Home Screen (`/app`)

```
┌────────────────────────┐
│ Split          [0x...] │  ← header
├────────────────────────┤
│                        │
│  Good morning, 0xC6... │  ← greeting
│  You have 2 open debts │  ← summary
│                        │
│  ┌──────────────────┐  │
│  │ YOUR BALANCE     │  │  ← balance summary card
│  │ owe  +4.50 cUSD  │  │
│  │ owed -2.30 cUSD  │  │
│  │ net  +2.20 cUSD  │  │  (green = you're owed)
│  └──────────────────┘  │
│                        │
│  YOUR GROUPS           │  ← section header
│                        │
│  ┌──────────────────┐  │
│  │ 🍕 Friday Dinner  │  │  ← group card
│  │ 4 members        │  │
│  │ You owe 3.20 cUSD│  │  (red)
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ 🏠 House Expenses │  │
│  │ 3 members        │  │
│  │ Owed 8.00 cUSD   │  │  (green)
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │  + Create Group  │  │  ← create button
│  └──────────────────┘  │
│                        │
└────────────────────────┘
```

### Balance Summary Card

```
Background: linear-gradient(135deg, #161616, #1F1F1F)
Border: 1px solid --border
Border-radius: 16px
Padding: 20px

"YOUR BALANCE" label: DM Mono 10px tracking-widest --text-muted

Three rows:
- "You owe" + amount in --money-negative (red)
- "You're owed" + amount in --money-positive (green)
- "Net" + amount — color based on positive/negative

Amounts in DM Mono 20px tabular
```

### Group Card

```
Background: --surface
Border: 1px solid --border
Border-radius: 12px
Padding: 16px
Margin-bottom: 8px

Left: Emoji (32px) + group name (DM Sans 500 15px) + member count (DM Sans 12px --text-muted)
Right: Balance amount (DM Mono 14px) — red if owe, green if owed, gray if settled

Tap: navigates to /app/group/[id]
Long press: options (leave group, etc.)
```

---

## 8. Create Group (`/app/create`)

```
┌────────────────────────┐
│ ← Create Group         │
├────────────────────────┤
│                        │
│  Choose an emoji       │
│                        │
│  [🍕][🏠][🚗][🎉][✈️] │
│  [💊][🎮][🛒][☕][🎵] │
│                        │
│  Group name            │
│  ┌──────────────────┐  │
│  │ e.g. Friday crew │  │
│  └──────────────────┘  │
│                        │
│  Description (opt.)    │
│  ┌──────────────────┐  │
│  │                  │  │
│  └──────────────────┘  │
│                        │
│                        │
│  ┌──────────────────┐  │
│  │  Create Group ✓  │  │  ← primary CTA
│  └──────────────────┘  │
│                        │
└────────────────────────┘
```

### After Creation — Share Sheet

```
┌────────────────────────┐
│ 🎉 Group created!      │
│                        │
│  Friday Dinner         │
│                        │
│  Share this link with  │
│  your group:           │
│                        │
│  ┌──────────────────┐  │
│  │ split.app/join/  │  │  ← invite link
│  │ abc123           │  │
│  └──────────────────┘  │
│                        │
│  [Copy Link]           │
│  [Share via WhatsApp]  │
│                        │
│  [Go to Group →]       │
│                        │
└────────────────────────┘
```

---

## 9. Group Detail (`/app/group/[id]`)

```
┌────────────────────────┐
│ ← 🍕 Friday Dinner    │
│   4 members            │
├────────────────────────┤
│                        │
│  ┌──────────────────┐  │
│  │ BALANCES         │  │  ← balance cards
│  │                  │  │
│  │ You owe John     │  │
│  │ 3.20 cUSD [PAY]  │  │  ← red + pay button
│  │                  │  │
│  │ Sarah owes you   │  │
│  │ 1.80 cUSD [REMIND│  │  ← green
│  │                  │  │
│  │ Mike    SETTLED ✓│  │  ← muted
│  └──────────────────┘  │
│                        │
│  EXPENSES              │
│                        │
│  ┌──────────────────┐  │
│  │ 🍕 Pizza Night   │  │  ← expense card
│  │ John paid 12 cUSD│  │
│  │ Your share: 3 cUSD│ │
│  │ May 9, 2025      │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ 🚗 Uber home     │  │
│  │ You paid 8 cUSD  │  │
│  │ 4 ways split     │  │
│  └──────────────────┘  │
│                        │
├────────────────────────┤
│     [+ Add Expense]    │  ← sticky bottom button
└────────────────────────┘
```

### Balance Row Component

```
Layout: [avatar/initial] [name + amount text] [action button]

Owe state:
  Name: DM Sans 14px --text-primary
  "You owe [Name] X cUSD": --money-negative
  Button: "PAY" — brand green fill, 32px height, 60px wide

Owed state:
  "X cUSD owed to you"
  Amount: --money-positive
  Button: "REMIND" — outlined, muted

Settled state:
  Everything muted
  "SETTLED ✓" badge (small green pill)
```

### Expense Card Component

```
Background: --surface
Border-radius: 12px
Padding: 14px 16px
Border-left: 3px solid [category color]

Top row: [emoji] [description] [total amount in DM Mono]
Bottom row: [who paid] · [your share] · [date in --text-muted]

Tap: expand to see full breakdown per person
```

### Sticky Add Expense Button

```
Position: sticky, bottom: 72px (above bottom nav)
Width: calc(100% - 32px)
Margin: 0 16px
Height: 52px
Background: --brand
Color: #000
Border-radius: 100px
Font: DM Sans 600 15px
Text: "+ Add Expense"
Shadow: 0 8px 24px rgba(0,200,150,0.3)
```

---

## 10. Add Expense (`/app/group/[id]/add`)

```
┌────────────────────────┐
│ ← Add Expense          │
├────────────────────────┤
│                        │
│  What was it for?      │
│  ┌──────────────────┐  │
│  │ Pizza, uber...   │  │  ← description input
│  └──────────────────┘  │
│                        │
│  Category              │
│  [🍕][🚗][🏠][🎉][⚡][•••]  ← category pills
│                        │
│  Total amount (cUSD)   │
│  ┌──────────────────┐  │
│  │  $ 0.00          │  │  ← large number input
│  └──────────────────┘  │
│                        │
│  Who paid?             │
│  ○ You (0xC688...)     │
│  ○ John (0x1234...)    │
│  ○ Sarah (0x5678...)   │
│                        │
│  Split between         │
│  [Select All]          │
│  ☑ You                 │
│  ☑ John                │
│  ☑ Sarah               │
│  ☑ Mike                │
│                        │
│  Split type            │
│  [Equally] [Custom]    │
│                        │
│  Each person pays:     │
│  3.00 cUSD             │
│                        │
│  ┌──────────────────┐  │
│  │  Add Expense     │  │
│  └──────────────────┘  │
└────────────────────────┘
```

### Amount Input

```
Font: DM Mono 48px
Color: --text-primary
Prefix: "cUSD" label above in --text-muted DM Mono 12px
Background: --surface-2
Border: 1px solid --border, focus: --brand
Border-radius: 12px
Padding: 20px
Text-align: center
```

### Who Paid — Radio Selection

```
Each option:
Background: --surface, border --border
On select: border --brand, background --brand-dim
Left: wallet avatar (colored circle with initial)
Right: truncated address + radio indicator

Height: 52px each
Border-radius: 10px
```

### Participant Checkboxes

```
Same style as who paid but with checkboxes
"Select All" pill button at top right
Show avatar + name/address
Check = include in split
```

---

## 11. Settle Debt (`/app/settle/[id]`)

```
┌────────────────────────┐
│ ← Settle Debt          │
├────────────────────────┤
│                        │
│      PAYING            │
│                        │
│   ┌──────────────┐     │
│   │  👤          │     │  ← sender avatar
│   │  You         │     │
│   └──────────────┘     │
│          ↓             │
│      3.20 cUSD         │  ← amount (large, green)
│          ↓             │
│   ┌──────────────┐     │
│   │  👤          │     │  ← recipient avatar
│   │  John        │     │
│   │  0x1234...   │     │
│   └──────────────┘     │
│                        │
│  For: Pizza Night +    │
│  2 other expenses      │
│                        │
│  This will send        │
│  3.20 cUSD directly    │
│  to John's wallet.     │
│                        │
│  ┌──────────────────┐  │
│  │ Confirm & Pay    │  │  ← brand green CTA
│  └──────────────────┘  │
│                        │
│  [Cancel]              │
└────────────────────────┘
```

### After Payment — Success Screen

```
┌────────────────────────┐
│                        │
│         ✓              │  ← large animated checkmark
│                        │
│   Payment Sent!        │
│                        │
│   3.20 cUSD sent       │
│   to John              │
│                        │
│   ┌──────────────────┐ │
│   │ View on Celoscan │ │  ← tx link
│   └──────────────────┘ │
│                        │
│   [Back to Group]      │
│                        │
└────────────────────────┘
```

### Payment Amount Display

```
Font: DM Mono 52px
Color: --brand (green)
Text-align: center
Animation: count up from 0 on mount
```

---

## 12. Activity Feed (`/app/activity`)

```
┌────────────────────────┐
│ ← Activity             │
├────────────────────────┤
│                        │
│  TODAY                 │
│                        │
│  ┌──────────────────┐  │
│  │ ✓ You paid John  │  │  ← settlement (green left border)
│  │ 3.20 cUSD        │  │
│  │ Friday Dinner    │  │
│  │ 2h ago · 0x...   │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ + Pizza Night    │  │  ← expense added (blue left border)
│  │ John paid 12 cUSD│  │
│  │ Friday Dinner    │  │
│  │ 3h ago           │  │
│  └──────────────────┘  │
│                        │
│  YESTERDAY             │
│                        │
│  ┌──────────────────┐  │
│  │ ✓ Sarah paid you │  │
│  │ 1.80 cUSD        │  │
│  └──────────────────┘  │
│                        │
└────────────────────────┘
```

---

## 13. Join Group (`/app/join/[groupId]`)

```
┌────────────────────────┐
│       Split            │
├────────────────────────┤
│                        │
│  You've been invited   │
│  to join:              │
│                        │
│     🍕                 │
│  Friday Dinner         │
│  Created by 0xABC...   │
│  3 members             │
│                        │
│  Members:              │
│  👤 0xABC...           │
│  👤 0xDEF...           │
│  👤 0xGHI...           │
│                        │
│  ┌──────────────────┐  │
│  │  Join Group      │  │  ← brand green
│  └──────────────────┘  │
│                        │
│  You need a MiniPay    │
│  wallet to join.       │
│                        │
└────────────────────────┘
```

---

## 14. Component Library

### Primary Button

```css
height: 52px;
background: var(--brand);
color: #000;
border-radius: 100px;
font: 600 15px "DM Sans";
width: 100%;
transition:
  transform 0.15s,
  background 0.15s;

:hover {
  background: var(--brand-dark);
  transform: scale(1.01);
}
:active {
  transform: scale(0.98);
}
:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

### Secondary Button

```css
height: 52px;
background: transparent;
border: 1px solid var(--border);
color: var(--text-primary);
border-radius: 100px;
font: 500 15px "DM Sans";
width: 100%;
```

### Input Field

```css
height: 52px;
background: var(--surface-2);
border: 1px solid var(--border);
border-radius: 12px;
padding: 0 16px;
font: 15px "DM Sans";
color: var(--text-primary);
width: 100%;

:focus {
  border-color: var(--brand);
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 200, 150, 0.1);
}
```

### Card

```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 16px;
padding: 16px;
```

### Amount Badge (green/red)

```css
font: DM Mono 14px;
padding: 4px 10px;
border-radius: 20px;

.positive {
  color: var(--money-positive);
  background: rgba(0, 200, 150, 0.1);
}
.negative {
  color: var(--money-negative);
  background: rgba(255, 92, 92, 0.1);
}
```

### Wallet Avatar

```css
/* Colored circle with wallet address initial */
width: 36px;
height: 36px;
border-radius: 50%;
background: generated from address hash;
color: white;
font: DM Mono 12px bold;
display: flex;
align-items: center;
justify-content: center;
```

---

## 15. Responsive Breakpoints

```
Mobile (default): 0–430px — full design
Tablet: 430–768px — max-width 430px centered
Desktop: 768px+ —
  - Landing page: full width, horizontal layouts
  - App pages: max-width 430px centered, desktop chrome around it
```

### Desktop App Wrapper

```css
/* On desktop, show app in a phone-like container */
.app-wrapper {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--bg);
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}
```

---

## 16. Animations & Micro-interactions

### Page Transitions

```css
/* Slide in from right on navigation */
.page-enter {
  transform: translateX(100%);
  opacity: 0;
}
.page-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Balance Number Animation

```javascript
// Count up animation when balance loads
// From 0 to final value in 600ms
// Easing: easeOut
```

### Payment Success

```css
/* Checkmark draw animation */
.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: stroke 0.6s forwards;
}
.checkmark-check {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s 0.6s forwards;
}
@keyframes stroke {
  to {
    stroke-dashoffset: 0;
  }
}
```

### Skeleton Loading

```css
/* Show skeleton cards while data loads */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    var(--surface-2) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
```

---

## 17. File Structure

```
src/
  app/
    page.tsx                    ← Landing page
    layout.tsx                  ← Root layout + fonts
    app/
      layout.tsx                ← App shell (header + bottom nav)
      page.tsx                  ← Home (groups list)
      create/page.tsx           ← Create group
      join/[groupId]/page.tsx   ← Join group
      group/[groupId]/
        page.tsx                ← Group detail
        add/page.tsx            ← Add expense
      settle/[id]/page.tsx      ← Settle debt
      activity/page.tsx         ← Activity feed
  components/
    landing/
      Navbar.tsx
      Hero.tsx
      HowItWorks.tsx
      UseCases.tsx
      AppPreview.tsx
      Footer.tsx
    app/
      AppHeader.tsx
      BottomNav.tsx
      WalletBadge.tsx
      GroupCard.tsx
      BalanceSummaryCard.tsx
      BalanceRow.tsx
      ExpenseCard.tsx
      ActivityItem.tsx
      PaymentSuccess.tsx
      CategoryPicker.tsx
      ParticipantSelector.tsx
      SkeletonCard.tsx
    common/
      Button.tsx
      Input.tsx
      Card.tsx
      AmountBadge.tsx
      WalletAvatar.tsx
      LoadingSpinner.tsx
  context/
    WalletContext.tsx
    GroupContext.tsx
  hooks/
    useMiniPay.ts
    useGroups.ts
    useExpenses.ts
    useBalances.ts
    useSettle.ts
  lib/
    supabase.ts
    viem.ts
    contract.ts
    balanceEngine.ts            ← core calculation logic
    storage.ts
    utils.ts
  constants/
    chains.ts
    categories.ts
```
