import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, SPLIT_ABI } from '@/lib/contract';
import { formatEther } from 'viem';

/**
 * Loads a group's expenses and their per-member splits. For on-chain groups it
 * reads each expense from the contract and unpacks the `|cat:` / `|img:` tags
 * encoded into the description; for `local-` groups it reads from localStorage.
 * Results are sorted newest-first.
 *
 * @param groupId on-chain group id, or a `local-` prefixed offline group id.
 */
export const useExpenses = (groupId: string) => {
  const { publicClient } = useWallet();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!groupId) return;

    if (groupId.startsWith('local-')) {
      setLoading(true);
      if (typeof window !== 'undefined') {
        try {
          const allExpenses = JSON.parse(localStorage.getItem('split_local_expenses') || '[]');
          const allSplits = JSON.parse(localStorage.getItem('split_local_splits') || '[]');

          const filteredExpenses = allExpenses.filter((e: any) => e.group_id === groupId);
          const filteredSplits = allSplits.filter((s: any) => s.expense_id && filteredExpenses.some((e: any) => e.id === s.expense_id));

          // Sort local expenses by newest first
          filteredExpenses.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          setExpenses(filteredExpenses);
          setSplits(filteredSplits);
        } catch (err) {
          console.error('Error loading local expenses:', err);
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
      const countBig = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: SPLIT_ABI,
        functionName: 'getGroupExpenseCount',
        args: [BigInt(groupId)],
      });
      const count = Number(countBig);

      const fetchedExpenses: any[] = [];
      const fetchedSplits: any[] = [];

      const expensePromises = [];
      for (let i = 1; i <= count; i++) {
        expensePromises.push(
          (async (expenseIndex) => {
            try {
              const expenseData = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: SPLIT_ABI,
                functionName: 'getExpense',
                args: [BigInt(groupId), BigInt(expenseIndex)],
              });

              const [paidBy, amountWei, rawDescription, timestampBig] = expenseData as [string, bigint, string, bigint];

              const splitData = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: SPLIT_ABI,
                functionName: 'getExpenseSplits',
                args: [BigInt(groupId), BigInt(expenseIndex)],
              });

              const [splitMembers, splitAmountsWei] = splitData as [string[], bigint[]];

              let cleanDescription = rawDescription;
              let category = 'other';
              let attachmentUrl = '';

              const catMatch = rawDescription.match(/ \|cat:(\S+)/);
              const imgMatch = rawDescription.match(/ \|img:(\S+)/);

              if (catMatch) {
                category = catMatch[1];
              }
              if (imgMatch) {
                attachmentUrl = imgMatch[1];
              }

              cleanDescription = rawDescription
                .replace(/ \|cat:\S+/, '')
                .replace(/ \|img:\S+/, '');

              const expenseId = expenseIndex.toString();

              fetchedExpenses.push({
                id: expenseId,
                group_id: groupId,
                description: cleanDescription,
                category,
                attachment_url: attachmentUrl,
                total_amount: parseFloat(formatEther(amountWei)),
                paid_by: paidBy.toLowerCase(),
                created_by: paidBy.toLowerCase(),
                created_at: new Date(Number(timestampBig) * 1000).toISOString(),
                status: 'active',
              });

              splitMembers.forEach((member, memberIdx) => {
                fetchedSplits.push({
                  id: `${expenseId}-${member.toLowerCase()}`,
                  expense_id: expenseId,
                  wallet_address: member.toLowerCase(),
                  amount: formatEther(splitAmountsWei[memberIdx]),
                  is_payer: member.toLowerCase() === paidBy.toLowerCase(),
                });
              });
            } catch (innerErr) {
              console.error(`Error fetching expense index ${expenseIndex}:`, innerErr);
            }
          })(i)
        );
      }

      await Promise.all(expensePromises);

      fetchedExpenses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setExpenses(fetchedExpenses);
      setSplits(fetchedSplits);
    } catch (err) {
      console.error('Error fetching onchain expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId, publicClient]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, splits, loading, refreshExpenses: fetchExpenses };
};
