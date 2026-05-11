import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateGroupBalances } from '@/lib/balanceEngine';
import { useExpenses } from './useExpenses';

export const useBalances = (groupId: string) => {
  const { expenses, splits, loading: expensesLoading, refreshExpenses } = useExpenses(groupId);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettlements = useCallback(async () => {
    if (!groupId) return;
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('group_id', groupId);
    
    if (error) {
      console.error('Error fetching settlements:', error);
    } else {
      setSettlements(data || []);
    }
  }, [groupId]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  useEffect(() => {
    if (!expensesLoading) {
      const calculatedBalances = calculateGroupBalances(expenses, splits, settlements);
      setBalances(calculatedBalances);
      setLoading(false);
    }
  }, [expenses, splits, settlements, expensesLoading]);

  const refreshBalances = async () => {
    setLoading(true);
    await refreshExpenses();
    await fetchSettlements();
    setLoading(false);
  };

  return { balances, loading, refreshBalances };
};
