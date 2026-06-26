'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/components/common/Toast';
import { useGroup } from '@/hooks/useGroups';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { CATEGORIES } from '@/constants/categories';

type RecurringRule = {
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

type RecurringRun = {
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

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const isoDate = (value: Date) => value.toISOString().split('T')[0];

export default function GroupRecurringPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const { address } = useWallet();
  const { showToast } = useToast();
  const { members } = useGroup(groupId as string);

  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [runs, setRuns] = useState<RecurringRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRule, setSavingRule] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [cadence, setCadence] = useState<'weekly' | 'monthly'>('monthly');
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [dayOfMonth, setDayOfMonth] = useState(new Date().getDate());
  const [startDate, setStartDate] = useState(isoDate(new Date()));
  const [payer, setPayer] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (address && !payer) setPayer(address.toLowerCase());
  }, [address, payer]);

  useEffect(() => {
    if (members.length > 0 && participants.length === 0) {
      setParticipants(members.map((m) => m.wallet_address.toLowerCase()));
    }
  }, [members, participants.length]);

  const fetchRecurringData = async () => {
    if (!groupId) return;
    setLoading(true);

    const [{ data: ruleData, error: ruleError }, { data: runData, error: runError }] = await Promise.all([
      supabase
        .from('recurring_expense_rules')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false }),
      supabase
        .from('recurring_expense_runs')
        .select('*, recurring_expense_rules(*)')
        .eq('group_id', groupId)
        .order('due_date', { ascending: false }),
    ]);

    if (ruleError) console.error('Error fetching recurring rules:', ruleError);
    if (runError) console.error('Error fetching recurring runs:', runError);

    setRules((ruleData || []) as RecurringRule[]);
    setRuns((runData || []) as RecurringRun[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecurringData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleToggleParticipant = (memberAddress: string) => {
    const normalized = memberAddress.toLowerCase();
    setParticipants((prev) =>
      prev.includes(normalized) ? prev.filter((addr) => addr !== normalized) : [...prev, normalized]
    );
  };

  const handleCreateRule = async () => {
    const amt = Number(amount);
    if (
      !address ||
      !description.trim() ||
      !Number.isFinite(amt) ||
      amt <= 0 ||
      !payer ||
      participants.length === 0
    ) return;
    setSavingRule(true);
    const payload = {
      group_id: groupId,
      created_by: address.toLowerCase(),
      description: description.trim(),
      category,
      amount: amt,
      payer_address: payer.toLowerCase(),
      participant_addresses: participants.map((p) => p.toLowerCase()),
      cadence,
      day_of_week: cadence === 'weekly' ? dayOfWeek : null,
      day_of_month: cadence === 'monthly' ? dayOfMonth : null,
      start_date: startDate,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('recurring_expense_rules').insert(payload);
    if (error) {
      console.error('Error creating recurring rule:', error);
      showToast('Failed to create recurring rule.', 'error');
      setSavingRule(false);
      return;
    }

    setDescription('');
    setAmount('');
    setCategory('other');
    setCadence('monthly');
    setDayOfWeek(new Date().getDay());
    setDayOfMonth(new Date().getDate());
    setStartDate(isoDate(new Date()));
    setSavingRule(false);
    await fetchRecurringData();
  };

  const isRuleDueToday = (rule: RecurringRule) => {
    const today = new Date();
    const todayDate = isoDate(today);
    if (todayDate < rule.start_date) return false;
    if (rule.cadence === 'weekly') {
      return rule.day_of_week === today.getDay();
    }
    return rule.day_of_month === today.getDate();
  };

  const handleGenerateDueDrafts = async () => {
    if (!groupId) return;
    setGenerating(true);
    const today = isoDate(new Date());
    const activeRules = rules.filter((rule) => rule.is_active);
    const pendingByRule = new Set(
      runs
        .filter((run) => run.status === 'pending')
        .map((run) => `${run.rule_id}:${run.due_date}`)
    );

    const duePayload = activeRules
      .filter((rule) => isRuleDueToday(rule))
      .filter((rule) => !pendingByRule.has(`${rule.id}:${today}`))
      .map((rule) => ({
        rule_id: rule.id,
        group_id: groupId,
        due_date: today,
        status: 'pending',
      }));

    if (duePayload.length > 0) {
      const { error } = await supabase.from('recurring_expense_runs').insert(duePayload);
      if (error) {
        console.error('Error generating recurring drafts:', error);
      }
    }

    setGenerating(false);
    await fetchRecurringData();
  };

  const handleToggleRuleActive = async (rule: RecurringRule) => {
    const { error } = await supabase
      .from('recurring_expense_rules')
      .update({ is_active: !rule.is_active, updated_at: new Date().toISOString() })
      .eq('id', rule.id);
    if (error) {
      console.error('Error updating recurring rule:', error);
      return;
    }
    await fetchRecurringData();
  };

  const pendingRuns = useMemo(
    () => runs.filter((run) => run.status === 'pending'),
    [runs]
  );

  return (
    <>
      <AppHeader title="Recurring" showBack />
      <div className="px-4 pt-20 pb-28 space-y-6">
        <div className="rounded-2xl border border-[#2C2C2C] bg-[#121212] p-4 space-y-4">
          <h2 className="clash-display text-lg font-semibold text-[#F7F3EC]">Create recurring rule</h2>

          <Input label="Description" placeholder="e.g. House Rent" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Amount (usdm)" placeholder="0.00" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Category</label>
            <select
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-brand"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCadence('weekly')}
              className={`rounded-xl border px-3 py-2 text-sm ${cadence === 'weekly' ? 'border-brand text-brand bg-brand/10' : 'border-border text-text-secondary'}`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setCadence('monthly')}
              className={`rounded-xl border px-3 py-2 text-sm ${cadence === 'monthly' ? 'border-brand text-brand bg-brand/10' : 'border-border text-text-secondary'}`}
            >
              Monthly
            </button>
          </div>

          {cadence === 'weekly' ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Day of week</label>
              <select
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-brand"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
              >
                {dayNames.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Input
              label="Day of month"
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
            />
          )}

          <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Payer</label>
            <select
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-brand"
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
            >
              {members.map((member) => (
                <option key={member.wallet_address} value={member.wallet_address.toLowerCase()}>
                  {member.display_name || `${member.wallet_address.slice(0, 6)}...${member.wallet_address.slice(-4)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Participants</label>
            <div className="grid grid-cols-1 gap-2">
              {members.map((member) => {
                const memberAddress = member.wallet_address.toLowerCase();
                const selected = participants.includes(memberAddress);
                return (
                  <button
                    key={member.wallet_address}
                    type="button"
                    onClick={() => handleToggleParticipant(memberAddress)}
                    className={`text-left rounded-xl border px-3 py-2 text-sm ${selected ? 'border-brand bg-brand/10 text-brand' : 'border-border text-text-secondary'}`}
                  >
                    {member.display_name || `${member.wallet_address.slice(0, 6)}...${member.wallet_address.slice(-4)}`}
                  </button>
                );
              })}
            </div>
          </div>

          <Button className="w-full" loading={savingRule} onClick={handleCreateRule}>
            Save recurring rule
          </Button>
        </div>

        <div className="rounded-2xl border border-[#2C2C2C] bg-[#121212] p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="clash-display text-lg font-semibold text-[#F7F3EC]">Pending drafts</h2>
            <Button size="sm" loading={generating} onClick={handleGenerateDueDrafts}>
              Generate due
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-text-secondary">Loading...</p>
          ) : pendingRuns.length === 0 ? (
            <p className="text-sm text-text-secondary">No pending drafts yet.</p>
          ) : (
            <div className="space-y-2">
              {pendingRuns.map((run) => (
                <div key={run.id} className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-text-primary font-medium">
                      {run.recurring_expense_rules?.description || 'Recurring draft'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Due {run.due_date} • {run.recurring_expense_rules?.amount ?? '0'} usdm
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/app/group/${groupId}/add?runId=${run.id}`)}
                  >
                    Create expense
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#2C2C2C] bg-[#121212] p-4 space-y-4">
          <h2 className="clash-display text-lg font-semibold text-[#F7F3EC]">Rules</h2>
          {rules.length === 0 ? (
            <p className="text-sm text-text-secondary">No recurring rules created yet.</p>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-text-primary font-medium">{rule.description}</p>
                    <p className="text-xs text-text-secondary">
                      {rule.cadence === 'weekly'
                        ? `Weekly on ${dayNames[rule.day_of_week ?? 0]}`
                        : `Monthly on day ${rule.day_of_month ?? 1}`}{' '}
                      • {Number(rule.amount).toFixed(2)} usdm
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleRuleActive(rule)}
                    className={`rounded-full border px-3 py-1 text-xs ${rule.is_active ? 'border-brand text-brand' : 'border-border text-text-secondary'}`}
                  >
                    {rule.is_active ? 'Active' : 'Paused'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
