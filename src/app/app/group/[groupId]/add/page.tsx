"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { CategoryPicker } from '@/components/app/CategoryPicker';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { useGroup } from '@/hooks/useGroups';
import { CONTRACT_ADDRESS, SPLIT_ABI } from '@/lib/contract';
import { cn, truncateAddress } from '@/lib/utils';
import { parseEther } from 'viem';
import { celo } from 'viem/chains';
import { createNotificationSafe } from '@/lib/notifications';

export default function AddExpensePage() {
  const { groupId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');
  const wallet = useWallet();
  const { requireConnection } = wallet;
  const walletRef = React.useRef(wallet);
  
  React.useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const { address } = wallet;
  const { members } = useGroup(groupId as string);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [payer, setPayer] = useState('');
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Logging Expense...');
  const [prefilledFromRun, setPrefilledFromRun] = useState(false);

  useEffect(() => {
    if (address && !payer) setPayer(address.toLowerCase());
    if (members.length > 0 && splitWith.length === 0) {
      setSplitWith(members.map((m) => m.wallet_address.toLowerCase()));
    }
  }, [address, members, payer, splitWith.length]);

  useEffect(() => {
    const loadRecurringDraft = async () => {
      if (!runId || prefilledFromRun) return;

      const { data, error } = await supabase
        .from('recurring_expense_runs')
        .select('*, recurring_expense_rules(*)')
        .eq('id', runId)
        .maybeSingle();

      if (error || !data?.recurring_expense_rules) {
        console.error('Unable to load recurring draft:', error);
        return;
      }

      const rule = data.recurring_expense_rules as any;
      setDescription(rule.description || '');
      setAmount(String(rule.amount || ''));
      setCategory(rule.category || 'other');
      setPayer((rule.payer_address || '').toLowerCase());
      setSplitWith((rule.participant_addresses || []).map((item: string) => item.toLowerCase()));
      setPrefilledFromRun(true);
    };

    loadRecurringDraft();
  }, [runId, prefilledFromRun]);

  const handleSubmit = async () => {
    const { address, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!address || !description || !amount || !payer || splitWith.length === 0) return;
    setLoading(true);

    try {
      const totalAmountNum = parseFloat(amount);
      const totalAmountWei = parseEther(amount);
      const memberCount = BigInt(splitWith.length);
      const baseShare = totalAmountWei / memberCount;
      const remainder = totalAmountWei % memberCount;

      const splitAmounts = splitWith.map((member, index) => {
        return index < remainder ? baseShare + 1n : baseShare;
      });

      const splitMembers = splitWith.map(addr => addr as `0x${string}`);
      const descriptionWithMeta = `${description} |cat:${category}`;

      const gasPrice = await publicClient.getGasPrice();
      // gasPrice always set (CELO). feeCurrency only for MiniPay, which holds no CELO.
      // No explicit nonce — let the wallet manage it (public RPC nonce can be stale).
      const gasParams = {
        gasPrice,
        feeCurrency: isMiniPay ? ('0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`) : undefined,
      };
      setLoadingText('Logging Expense...');
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: SPLIT_ABI,
        functionName: 'addExpense',
        args: [BigInt(groupId as string), totalAmountWei, descriptionWithMeta, splitMembers, splitAmounts],
        chain: celo,
        account: address as `0x${string}`,
        ...gasParams,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: tx });

      const creatorName =
        members.find((m) => m.wallet_address.toLowerCase() === address?.toLowerCase())?.display_name ||
        'Someone';

      const targetMembers = splitWith.filter(
        (memberAddress) => memberAddress.toLowerCase() !== address?.toLowerCase()
      );

      if (targetMembers.length > 0) {
        await Promise.all(
          targetMembers.map((memberAddress) =>
            createNotificationSafe({
              userAddress: memberAddress.toLowerCase(),
              groupId: groupId as string,
              type: 'expense',
              title: 'New Expense',
              body: `${creatorName} added an expense for ${totalAmountNum.toFixed(2)} cUSD`,
              actor: address?.toLowerCase(),
              actionUrl: `/app/group/${groupId}`,
            }).catch((error) => {
              console.error('Error creating notification:', error);
            })
          )
        );
      }

      if (runId) {
        const { error: runError } = await supabase
          .from('recurring_expense_runs')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', runId);
        if (runError) console.error('Error marking recurring run as processed:', runError);
      }

      router.push(`/app/group/${groupId}`);
    } catch (err) {
      console.error('Adding expense failed:', err);
      alert('Failed to add expense onchain.');
    } finally {
      setLoading(false);
      setLoadingText('Logging Expense...');
    }
  };

  const toggleMember = (addr: string) => {
    setSplitWith((prev) =>
      prev.includes(addr) ? prev.filter((a) => a !== addr) : [...prev, addr]
    );
  };

  return (
    <>
      <AppHeader />

      <div className="px-6 pt-24 pb-12 space-y-10 animate-fade-in">
        <div className="space-y-6">
          <Input
            label="Description"
            placeholder="What was it for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Category</label>
            <CategoryPicker selectedId={category} onSelect={setCategory} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Amount (cUSD)</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-surface border border-border rounded-xl px-4 py-4 text-3xl dm-mono text-brand focus:outline-none focus:border-brand transition-colors"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">cUSD</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Paid by</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {members.map((m) => (
                <button
                  key={m.wallet_address}
                  onClick={() => setPayer(m.wallet_address.toLowerCase())}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium transition-all",
                    payer === m.wallet_address.toLowerCase() ? "bg-brand text-bg border-brand" : "bg-surface border-border text-text-secondary"
                  )}
                >
                  {m.wallet_address.toLowerCase() === address?.toLowerCase() ? 'You' : truncateAddress(m.wallet_address)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider ml-1">Split with</label>
            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => (
                <button
                  key={m.wallet_address}
                  onClick={() => toggleMember(m.wallet_address.toLowerCase())}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    splitWith.includes(m.wallet_address.toLowerCase()) ? "bg-surface-2 border-brand" : "bg-surface border-border opacity-60"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", splitWith.includes(m.wallet_address.toLowerCase()) ? "bg-brand border-brand" : "border-text-muted")}>
                    {splitWith.includes(m.wallet_address.toLowerCase()) && <div className="w-1.5 h-1.5 bg-bg rounded-full" />}
                  </div>
                  <span className="text-xs font-medium truncate">
                    {m.wallet_address.toLowerCase() === address?.toLowerCase() ? 'You' : truncateAddress(m.wallet_address)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <div className="bg-surface-2 p-4 rounded-2xl border border-border flex justify-between items-center">
            <span className="text-sm text-text-secondary">Each pays:</span>
            <span className="text-xl dm-mono font-bold text-text-primary">
              {amount && splitWith.length > 0 ? (parseFloat(amount) / splitWith.length).toFixed(2) : '0.00'} cUSD
            </span>
          </div>

          <Button
            size="lg"
            className="w-full h-16 text-lg font-bold rounded-2xl"
            disabled={!description || !amount || splitWith.length === 0}
            onClick={() => requireConnection(handleSubmit)}
            loading={loading}
          >
            {loading ? loadingText : 'Log Expense'}
          </Button>
        </div>
      </div>
    </>
  );
}
