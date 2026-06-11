import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, SPLIT_ABI } from '@/lib/contract';
import { formatEther } from 'viem';

export const useExpenses = (groupId: string) => {
  const { publicClient } = useWallet();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!groupId || !publicClient) return;
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
