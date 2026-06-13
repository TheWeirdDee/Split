import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

export const useUserBalance = () => {
  const { address } = useWallet();
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwing, setTotalOwing] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUserBalance = useCallback(async () => {
    let localNet = 0;
    if (typeof window !== 'undefined') {
      try {
        const allExpenses = JSON.parse(localStorage.getItem('split_local_expenses') || '[]');
        const allSplits = JSON.parse(localStorage.getItem('split_local_splits') || '[]');
        const allSettlements = JSON.parse(localStorage.getItem('split_local_settlements') || '[]');

        allExpenses.forEach((expense: any) => {
          if (expense.status !== 'active') return;
          const payer = expense.paid_by.toLowerCase();
          const expenseSplits = allSplits.filter((s: any) => s.expense_id === expense.id);

          if (payer === 'local-user') {
            expenseSplits.forEach((split: any) => {
              if (split.wallet_address.toLowerCase() !== 'local-user') {
                localNet += parseFloat(split.amount) || 0;
              }
            });
          } else {
            const userSplit = expenseSplits.find((s: any) => s.wallet_address.toLowerCase() === 'local-user');
            if (userSplit) {
              localNet -= parseFloat(userSplit.amount) || 0;
            }
          }
        });

        allSettlements.forEach((settlement: any) => {
          const debtor = settlement.debtor.toLowerCase();
          const creditor = settlement.creditor.toLowerCase();
          const amt = parseFloat(settlement.amount) || 0;

          if (debtor === 'local-user') {
            localNet += amt; // debt reduced (we paid)
          }
          if (creditor === 'local-user') {
            localNet -= amt; // credit reduced (we got paid)
          }
        });
      } catch (err) {
        console.error('Error calculating local balance summary:', err);
      }
    }

    if (!address) {
      setTotalOwed(Math.max(0, localNet));
      setTotalOwing(Math.max(0, -localNet));
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Get all settlements involving this user
      const { data: settlements, error: settlementError } = await supabase
        .from('settlements')
        .select('*')
        .or(`debtor.eq.${address.toLowerCase()},creditor.eq.${address.toLowerCase()}`);

      if (settlementError) {
        console.error('Error fetching settlements:', settlementError);
        setTotalOwed(Math.max(0, localNet));
        setTotalOwing(Math.max(0, -localNet));
        setLoading(false);
        return;
      }

      // Get all groups this user is in
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('wallet_address', address.toLowerCase());

      if (memberError) {
        console.error('Error fetching groups:', memberError);
        setTotalOwed(Math.max(0, localNet));
        setTotalOwing(Math.max(0, -localNet));
        setLoading(false);
        return;
      }

      const groupIds = memberData?.map(m => m.group_id) || [];
      if (groupIds.length === 0) {
        // Apply settlements only
        let owed = 0;
        let owing = 0;
        settlements?.forEach(s => {
          const amount = parseFloat(s.amount);
          if (s.creditor === address.toLowerCase()) {
            owed += amount;
          } else {
            owing += amount;
          }
        });
        const combinedOwed = owed + Math.max(0, localNet);
        const combinedOwing = owing + Math.max(0, -localNet);
        setTotalOwed(combinedOwed);
        setTotalOwing(combinedOwing);
        setLoading(false);
        return;
      }

      // Get all expenses in these groups
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .in('group_id', groupIds);

      if (expenseError) {
        console.error('Error fetching expenses:', expenseError);
        setTotalOwed(Math.max(0, localNet));
        setTotalOwing(Math.max(0, -localNet));
        setLoading(false);
        return;
      }

      const expenseIds = expenses?.map(e => e.id) || [];
      let splits: any[] = [];
      
      if (expenseIds.length > 0) {
        const { data: splitData, error: splitError } = await supabase
          .from('expense_splits')
          .select('*')
          .in('expense_id', expenseIds);

        if (splitError) {
          console.error('Error fetching splits:', splitError);
        } else {
          splits = splitData || [];
        }
      }

      // Calculate balances
      const netBalances: Record<string, number> = {};

      // Add amounts from expenses
      expenses?.forEach(expense => {
        if ((expense.status || 'active') !== 'active') return;
        const payer = expense.paid_by.toLowerCase();
        const expenseSplits = splits.filter(s => s.expense_id === expense.id);
        
        expenseSplits.forEach(split => {
          const borrower = split.wallet_address.toLowerCase();
          const amount = parseFloat(split.amount);
          
          if (borrower !== payer) {
            netBalances[borrower] = (netBalances[borrower] || 0) - amount;
            netBalances[payer] = (netBalances[payer] || 0) + amount;
          }
        });
      });

      // Apply settlements
      settlements?.forEach(s => {
        const debtor = s.debtor.toLowerCase();
        const creditor = s.creditor.toLowerCase();
        const amount = parseFloat(s.amount);
        
        netBalances[debtor] = (netBalances[debtor] || 0) + amount;
        netBalances[creditor] = (netBalances[creditor] || 0) - amount;
      });

      // Calculate user's totals
      const userBalance = netBalances[address.toLowerCase()] || 0;
      const combined = userBalance + localNet;
      setTotalOwed(Math.max(0, combined));
      setTotalOwing(Math.max(0, -combined));
    } catch (error) {
      console.error('Error in useUserBalance:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchUserBalance();
  }, [fetchUserBalance]);

  return { totalOwed, totalOwing, loading, refresh: fetchUserBalance };
};
