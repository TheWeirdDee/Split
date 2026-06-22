// Shared data-model types for on-chain + Supabase entities. Hooks return these
// instead of `any` so consumers get real field checking.

/** A savings circle as read from the SavingsCircle contract. */
export interface SavingsCircle {
  id: number;
  name: string;
  mode: number;            // 0 = rotating, 1 = goal
  status: number;          // 0 = active, 1 = completed, 2 = dissolved
  contributionAmount: bigint;
  currentPot: bigint;
  currentCycle: bigint;
  nextDeadline: bigint;
  totalSaved: bigint;
  memberAddrs: string[];
  creator: string;
  rotationIndex?: bigint;
  config: { goalAmount: bigint };
}

/** A group (Supabase `groups` row, or an offline `local-` group). */
export interface Group {
  id: string;
  name: string;
  emoji?: string;
  description?: string | null;
  created_by: string;
  created_at?: string;
  onchain_tx?: string;
  // Offline/local groups carry their members inline; Supabase groups may include
  // a joined group_members array.
  members?: GroupMember[];
  group_members?: GroupMember[];
}

/** A group membership row. */
export interface GroupMember {
  group_id?: string;
  wallet_address: string;
  display_name: string | null;
  avatar_emoji?: string;
}

/** An expense (Supabase `expenses` row, or decoded from chain / localStorage). */
export interface Expense {
  id: string;
  group_id?: string;
  description: string;
  total_amount: number | string;
  category?: string;
  paid_by: string;
  created_by?: string;
  created_at: string;
  status?: string;
  attachment_url?: string;
  reversed_at?: string | null;
  reversed_by?: string | null;
  reversed_reason?: string | null;
}

/** A per-member share of an expense. */
export interface ExpenseSplit {
  id: string;
  expense_id: string;
  wallet_address: string;
  amount: string;
  is_payer?: boolean;
}

/** Per-member status within a circle. */
export interface SavingsMember {
  address: string;
  missedCount: number;
  totalContributed: bigint;
  totalReceived: bigint;
  status: number;          // 0 = active, 1 = skipped, 2 = removed, 3 = exited
  hasReceivedPayout: boolean;
  hasContributedThisCycle: boolean;
}
