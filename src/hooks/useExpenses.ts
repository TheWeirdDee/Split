import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export const useExpenses = (groupId: string) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (expenseError) {
      console.error('Error fetching expenses:', expenseError);
    } else {
      setExpenses(expenseData || []);
      
      const expenseIds = expenseData?.map(e => e.id) || [];
      if (expenseIds.length > 0) {
        const { data: splitData, error: splitError } = await supabase
          .from('expense_splits')
          .select('*')
          .in('expense_id', expenseIds);
        
        setSplits(splitData || []);
      }
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, splits, loading, refreshExpenses: fetchExpenses };
};
