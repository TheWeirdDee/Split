import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/common/Toast';

export type RecurringRule = {
  id: string;
  group_id: string;
  created_by: string;
  description: string;
  category: string;
  amount: string;
  payer_address: string;
  participant_addresses: string[];
  cadence: 'weekly' | 'monthly';
  day_of_week: number | null;
  day_of_month: number | null;
  start_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RecurringRun = {
  id: string;
  rule_id: string;
  group_id: string;
  due_date: string;
  status: 'pending' | 'processed' | 'skipped';
  processed_expense_id: string | null;
  created_at: string;
  processed_at: string | null;
  recurring_expense_rules?: RecurringRule;
};

const isRuleDueToday = (rule: any) => {
  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];
  if (todayDate < rule.start_date) return false;
  if (rule.cadence === 'weekly') {
    return rule.day_of_week === today.getDay();
  }
  return rule.day_of_month === today.getDate();
};

/**
 * Client-side scheduler for recurring expenses. For the given groups it
 * generates today's `recurring_expense_runs` from any active rules due today
 * (de-duplicated per rule/day) and returns the list of pending drafts for the UI.
 *
 * @param groupIds groups to evaluate rules for.
 * @param isConnected gate so the check only runs for a connected wallet.
 */
export const useRecurringCheck = (groupIds: string[], isConnected: boolean) => {
  const { showToast } = useToast();
  const [pendingRuns, setPendingRuns] = useState<RecurringRun[]>([]);
  const [loading, setLoading] = useState(false);

  const performCheck = useCallback(async () => {
    if (!isConnected || groupIds.length === 0) return;
    setLoading(true);

    try {
      // 1. Fetch active recurring rules for these groups
      const { data: rules, error: rulesErr } = await supabase
        .from('recurring_expense_rules')
        .select('*')
        .in('group_id', groupIds)
        .eq('is_active', true);

      if (rulesErr) throw rulesErr;
      if (!rules || rules.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch existing runs for today to prevent duplication
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRuns, error: runsErr } = await supabase
        .from('recurring_expense_runs')
        .select('*')
        .in('group_id', groupIds)
        .eq('due_date', today);

      if (runsErr) throw runsErr;

      const runKey = (ruleId: string, dateStr: string) => `${ruleId}:${dateStr}`;
      const existingKeys = new Set((todayRuns || []).map((r) => runKey(r.rule_id, r.due_date)));

      // 3. Filter rules that are due today and don't have a run generated
      const runsToInsert = rules
        .filter((rule) => isRuleDueToday(rule))
        .filter((rule) => !existingKeys.has(runKey(rule.id, today)))
        .map((rule) => ({
          rule_id: rule.id,
          group_id: rule.group_id,
          due_date: today,
          status: 'pending',
        }));

      if (runsToInsert.length > 0) {
        const { error: insertErr } = await supabase
          .from('recurring_expense_runs')
          .insert(runsToInsert);

        if (insertErr) {
          console.error('Error inserting auto-generated runs:', insertErr);
        } else {
          showToast(`Generated ${runsToInsert.length} new recurring drafts!`, 'success');
        }
      }

      // 4. Fetch all pending runs for these groups to return to UI
      const { data: allPendingRuns, error: pendingErr } = await supabase
        .from('recurring_expense_runs')
        .select('*, recurring_expense_rules(*)')
        .in('group_id', groupIds)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      if (pendingErr) throw pendingErr;
      setPendingRuns((allPendingRuns || []) as RecurringRun[]);
    } catch (err) {
      console.error('Failed to process recurring runs check:', err);
    } finally {
      setLoading(false);
    }
  }, [groupIds, isConnected, showToast]);

  useEffect(() => {
    performCheck();
  }, [performCheck]);

  return { pendingRuns, loading, refetch: performCheck };
};
