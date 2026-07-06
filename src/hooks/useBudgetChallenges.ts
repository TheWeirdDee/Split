import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { BudgetChallenge, Expense } from '@/types/models';

export const useBudgetChallenges = (groupId: string, expenses: Expense[]) => {
  const [challenges, setChallenges] = useState<BudgetChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);

    try {
      if (groupId.startsWith('local-')) {
        const localData = localStorage.getItem('split_local_budget_challenges');
        const list = localData ? JSON.parse(localData) : [];
        const groupChallenges = list.filter((c: any) => c.group_id === groupId);
        setChallenges(groupChallenges);
      } else {
        const { data, error } = await supabase
          .from('group_budget_challenges')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setChallenges(data || []);
      }
    } catch (err) {
      console.error('Failed to load budget challenges:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const createChallenge = async (
    name: string,
    amount: number,
    category: string,
    durationDays: number
  ) => {
    if (!groupId) return null;

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const newChallenge: Partial<BudgetChallenge> = {
      group_id: groupId,
      name,
      amount,
      category,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active',
    };

    try {
      if (groupId.startsWith('local-')) {
        const challengeId = 'local-challenge-' + Date.now();
        const fullChallenge = {
          ...newChallenge,
          id: challengeId,
          created_at: startDate.toISOString(),
        } as BudgetChallenge;

        const localData = localStorage.getItem('split_local_budget_challenges');
        const list = localData ? JSON.parse(localData) : [];
        localStorage.setItem(
          'split_local_budget_challenges',
          JSON.stringify([fullChallenge, ...list])
        );
      } else {
        const { error } = await supabase.from('group_budget_challenges').insert({
          ...newChallenge,
          created_at: startDate.toISOString(),
        });
        if (error) throw error;
      }
      await fetchChallenges();
      return true;
    } catch (err) {
      console.error('Failed to create budget challenge:', err);
      return false;
    }
  };

  // Helper to compute dynamic spent & status details
  const getChallengeDetails = useCallback((challenge: BudgetChallenge) => {
    // Filter active (non-reversed) expenses in group falling within the challenge window
    const challengeExpenses = expenses.filter((e) => {
      if (e.status === 'reversed') return false;
      
      const expenseDate = new Date(e.created_at);
      const start = new Date(challenge.start_date);
      const end = new Date(challenge.end_date);
      
      if (expenseDate < start || expenseDate > end) return false;

      // Filter by category if restricted
      if (challenge.category !== 'all' && e.category?.toLowerCase() !== challenge.category.toLowerCase()) {
        return false;
      }

      return true;
    });

    const spent = challengeExpenses.reduce((sum, e) => sum + Number(e.total_amount || 0), 0);
    
    // Determine dynamic status
    let calculatedStatus: 'active' | 'completed' | 'exceeded' = 'active';
    if (spent > challenge.amount) {
      calculatedStatus = 'exceeded';
    } else if (new Date() > new Date(challenge.end_date)) {
      calculatedStatus = 'completed';
    }

    // Proactively update status if it changed in backend database / local storage
    if (calculatedStatus !== challenge.status) {
      (async () => {
        try {
          if (groupId.startsWith('local-')) {
            const localData = localStorage.getItem('split_local_budget_challenges');
            if (localData) {
              const list = JSON.parse(localData);
              const idx = list.findIndex((c: any) => c.id === challenge.id);
              if (idx !== -1) {
                list[idx].status = calculatedStatus;
                localStorage.setItem('split_local_budget_challenges', JSON.stringify(list));
              }
            }
          } else {
            await supabase
              .from('group_budget_challenges')
              .update({ status: calculatedStatus })
              .eq('id', challenge.id);
          }
        } catch (updateErr) {
          console.error('Failed to update challenge status in background:', updateErr);
        }
      })();
    }

    return {
      spent,
      percent: Math.min(100, Math.round((spent / challenge.amount) * 100)),
      status: calculatedStatus,
      daysLeft: Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
    };
  }, [groupId, expenses]);

  return { challenges, loading, createChallenge, getChallengeDetails, refreshChallenges: fetchChallenges };
};
