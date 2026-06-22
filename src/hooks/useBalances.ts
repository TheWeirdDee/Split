import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, SPLIT_ABI } from '@/lib/contract';
import { formatEther } from 'viem';
import { calculateGroupBalancesFromOnchain, calculateGroupBalances, type GroupBalance } from '@/lib/balanceEngine';

/**
 * Returns the simplified (minimized) set of who-owes-whom balances for a group.
 * Reads per-member net balances on-chain for real groups, or recomputes from
 * localStorage for offline `local-` groups, then runs the debt-simplification.
 *
 * @param groupId on-chain group id, or a `local-` prefixed offline group id.
 */
export const useBalances = (groupId: string) => {
  const { publicClient } = useWallet();
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
    if (!groupId) return;

    if (groupId.startsWith('local-')) {
      setLoading(true);
      if (typeof window !== 'undefined') {
        try {
          const allExpenses = JSON.parse(localStorage.getItem('split_local_expenses') || '[]');
          const allSplits = JSON.parse(localStorage.getItem('split_local_splits') || '[]');

          const filteredExpenses = allExpenses.filter((e: any) => e.group_id === groupId);
          const filteredSplits = allSplits.filter((s: any) => s.expense_id && filteredExpenses.some((e: any) => e.id === s.expense_id));

          // Compute balances offline
          const calculatedBalances = calculateGroupBalances(filteredExpenses, filteredSplits, []);
          setBalances(calculatedBalances);
        } catch (err) {
          console.error('Error calculating local balances:', err);
        }
      }
      setLoading(false);
      return;
    }

    if (!publicClient) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      const groupData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: SPLIT_ABI,
        functionName: 'getGroup',
        args: [BigInt(groupId)],
      });

      const [, , members] = groupData as [string, string, string[], bigint];

      const onchainBalances: Record<string, number> = {};
      const balancePromises = members.map(async (member) => {
        try {
          const balanceWei = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: SPLIT_ABI,
            functionName: 'getMemberBalance',
            args: [BigInt(groupId), member as `0x${string}`],
          });
          onchainBalances[member.toLowerCase()] = parseFloat(formatEther(balanceWei as bigint));
        } catch (innerErr) {
          console.error(`Error fetching balance for member ${member}:`, innerErr);
          onchainBalances[member.toLowerCase()] = 0;
        }
      });

      await Promise.all(balancePromises);

      const calculatedBalances = calculateGroupBalancesFromOnchain(onchainBalances);
      setBalances(calculatedBalances);
    } catch (err) {
      console.error('Error fetching onchain balances:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId, publicClient]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const refreshBalances = async () => {
    await fetchBalances();
  };

  return { balances, loading, refreshBalances };
};
