"use client";

import React, { useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { useGroup } from '@/hooks/useGroups';
import { useBalances } from '@/hooks/useBalances';
import { useExpenses } from '@/hooks/useExpenses';
import { useGroupChat } from '@/hooks/useGroupChat';
import { useWallet } from '@/context/WalletContext';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { GroupIcon } from '@/components/common/GroupIcon';
import {
  Plus,
  Share2,
  Trash2,
  Repeat2,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateInviteLink, copyToClipboard } from '@/lib/inviteLinks';
import { createNotificationSafe, NotificationType } from '@/lib/notifications';
import { useAddressBook } from '@/hooks/useAddressBook';
import { useSettle } from '@/hooks/useSettle';
import { CONTRACT_ADDRESS, SPLIT_ABI } from '@/lib/contract';
import { buildGasParams } from '@/lib/gas';
import { BalancesTab } from './BalancesTab';
import { ExpensesTab } from './ExpensesTab';
import { ChatTab } from './ChatTab';
import { BudgetTab } from './BudgetTab';
import { GroupPredictions } from '@/components/app/GroupPredictions';
import { decodeEventLog, isAddress } from 'viem';
import { celo } from 'viem/chains';

const toCsv = (rows: string[][]) => rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');

const downloadFile = (filename: string, content: string, type = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const wallet = useWallet();
  const { requireConnection } = wallet;
  const { address } = wallet;
  const walletRef = React.useRef(wallet);
  
  React.useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const { showToast } = useToast();
  const { group, members, loading: groupLoading, refreshGroup } = useGroup(groupId as string);
  const { balances, refreshBalances } = useBalances(groupId as string);
  const { expenses, splits, loading: expensesLoading, refreshExpenses } = useExpenses(groupId as string);
  const { messages, loading: messagesLoading, sendMessage } = useGroupChat(groupId as string);
  const { getNickname } = useAddressBook();
  const { settle } = useSettle();

  const [activeTab, setActiveTab] = useState<'balances' | 'expenses' | 'chat' | 'budget' | 'predictions'>('balances');
  const [manualAddress, setManualAddress] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [settleAllLoading, setSettleAllLoading] = useState(false);
  // Expense edit/reverse modals (replace window.prompt)
  const [reverseTarget, setReverseTarget] = useState<any | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('all');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [auditFilter, setAuditFilter] = useState<'all' | 'my'>('all');
  const [syncingGroup, setSyncingGroup] = useState(false);

  const inviteLink = generateInviteLink(groupId as string);
  const isCreator = (groupId as string).startsWith('local-') || group?.created_by?.toLowerCase() === address?.toLowerCase();
  const isReadOnly = !address && !(groupId as string).startsWith('local-');
  const currentUserAddress = (address || 'local-user').toLowerCase();

  const getMemberDisplayName = (walletAddress: string) => {
    if (walletAddress.toLowerCase() === 'local-user') return 'You';
    const member = members.find((m) => m.wallet_address.toLowerCase() === walletAddress.toLowerCase());
    return (
      getNickname(walletAddress) ||
      member?.display_name ||
      (walletAddress.startsWith('local-member-') 
        ? walletAddress.replace('local-member-', 'Member ')
        : walletAddress.length > 10 ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : walletAddress)
    );
  };

  const personalBalances = useMemo(
    () =>
      balances.filter(
        (balance) =>
          balance.from.toLowerCase() === currentUserAddress ||
          balance.to.toLowerCase() === currentUserAddress
      ),
    [balances, currentUserAddress]
  );

  const oweBalances = useMemo(
    () => personalBalances.filter((balance) => balance.from.toLowerCase() === currentUserAddress),
    [personalBalances, currentUserAddress]
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const bySearch = !expenseSearch || expense.description.toLowerCase().includes(expenseSearch.toLowerCase());
      const byCategory = expenseCategory === 'all' || expense.category === expenseCategory;
      return bySearch && byCategory;
    });
  }, [expenses, expenseSearch, expenseCategory]);

  const itemizedDebts = useMemo(() => {
    const list: any[] = [];
    expenses.forEach((expense) => {
      if (expense.status === 'reversed') return;
      const expenseSplits = splits.filter((s) => s.expense_id === expense.id);
      expenseSplits.forEach((s) => {
        const debtor = s.wallet_address.toLowerCase();
        const creditor = expense.paid_by.toLowerCase();
        if (debtor !== creditor) {
          list.push({
            expenseId: expense.id,
            description: expense.description,
            date: expense.created_at,
            from: debtor,
            to: creditor,
            amount: parseFloat(s.amount),
          });
        }
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, splits]);

  const filteredAuditDebts = useMemo(() => {
    if (auditFilter === 'my' && address) {
      return itemizedDebts.filter(
        (d) => d.from === address.toLowerCase() || d.to === address.toLowerCase()
      );
    }
    return itemizedDebts;
  }, [itemizedDebts, auditFilter, address]);

  const handleShare = () => {
    const shareData = {
      title: `Join ${group?.name}`,
      text: `Join my Split group "${group?.name}":`,
      url: inviteLink,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share(shareData).catch(() => {
        copyToClipboard(inviteLink).then((ok) => {
          if (ok) showToast('Invite link copied!', 'success');
          else showToast('Could not share. Please copy the link manually.', 'error');
        });
      });
    } else {
      copyToClipboard(inviteLink).then((ok) => {
        if (ok) showToast('Invite link copied!', 'success');
        else showToast('Could not copy link.', 'error');
      });
    }
  };

  const handleNudge = async (targetAddress: string, amount: number, nudgeType: 'broom' | 'runner' | 'bell') => {
    const { address } = walletRef.current;
    if (!address) return;
    try {
      const senderName = getMemberDisplayName(address);
      const targetName = getMemberDisplayName(targetAddress);
      
      let title = 'Payment Nudge';
      let body = `${senderName} nudged you to pay ${amount.toFixed(2)} usdm in "${group?.name}".`;
      let type: NotificationType = 'reminder';

      if (nudgeType === 'broom') {
        title = '🧹 Sweep Up!';
        body = `${senderName} is sweeping you to pay ${amount.toFixed(2)} usdm in "${group?.name}".`;
        type = 'nudge_broom';
      } else if (nudgeType === 'runner') {
        title = '🏃‍♂️ Chasing You!';
        body = `${senderName} is chasing you for ${amount.toFixed(2)} usdm in "${group?.name}".`;
        type = 'nudge_runner';
      } else if (nudgeType === 'bell') {
        title = '🔔 Ring Ring!';
        body = `${senderName} is ringing a bell for ${amount.toFixed(2)} usdm in "${group?.name}".`;
        type = 'nudge_bell';
      }

      await createNotificationSafe({
        userAddress: targetAddress,
        groupId: groupId as string,
        type,
        title,
        body,
        actor: address?.toLowerCase(),
        actionUrl: `/app/group/${groupId}`,
      });
      showToast(`Nudge sent to ${targetName}!`, 'success');
    } catch {
      showToast('Failed to send nudge.', 'error');
    }
  };

  const handleSyncLocalGroupToCloud = async () => {
    const { address: walletAddr, walletClient, publicClient, isMiniPay } = walletRef.current;
    if (!walletAddr || !group) return;
    setSyncingGroup(true);
    try {
      const gasParams = await buildGasParams(publicClient, isMiniPay);

      // 1. Create group onchain
      const tx = await walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: SPLIT_ABI,
        functionName: 'createGroup',
        args: [group.name, []],
        chain: celo,
        account: walletAddr as `0x${string}`,
        ...gasParams,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      
      let onchainGroupId = '';
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: SPLIT_ABI,
            eventName: 'GroupCreated',
            data: log.data,
            topics: log.topics,
          });
          if (decoded && decoded.args) {
            onchainGroupId = (decoded.args as any).groupId.toString();
            break;
          }
        } catch {}
      }

      if (!onchainGroupId) {
        const count = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: SPLIT_ABI,
          functionName: 'groupCount',
        });
        onchainGroupId = count.toString();
      }

      // 2. Insert group in Supabase
      const { error: groupError } = await supabase.from('groups').insert({
        id: onchainGroupId,
        name: group.name,
        emoji: group.emoji || 'Users',
        description: group.description || '',
        created_by: walletAddr.toLowerCase(),
        onchain_tx: tx,
      });

      if (groupError) throw groupError;

      // 3. Insert local members into Supabase group_members
      const memberInsertRows = members.map((m: any) => {
        const isMe = m.wallet_address.toLowerCase() === 'local-user';
        return {
          group_id: onchainGroupId,
          wallet_address: isMe ? walletAddr.toLowerCase() : m.wallet_address.toLowerCase(),
          display_name: m.display_name,
        };
      });

      const { error: membersError } = await supabase.from('group_members').insert(memberInsertRows);
      if (membersError) throw membersError;

      // 4. Remove this group from local storage list
      const localGroups = JSON.parse(localStorage.getItem('split_local_groups') || '[]');
      const filteredGroups = localGroups.filter((g: any) => g.id !== groupId);
      localStorage.setItem('split_local_groups', JSON.stringify(filteredGroups));

      showToast('Group successfully synced onchain!', 'success');
      router.push(`/app/group/${onchainGroupId}`);
    } catch (err) {
      console.error('Migration failed:', err);
      showToast('Failed to sync group to blockchain.', 'error');
    } finally {
      setSyncingGroup(false);
    }
  };

  const handleAddManual = async () => {
    if (groupId && (groupId as string).startsWith('local-')) {
      if (!newMemberName.trim()) {
        showToast('Please enter a member name', 'error');
        return;
      }
      setIsAdding(true);
      try {
        const localGroups = JSON.parse(localStorage.getItem('split_local_groups') || '[]');
        const groupIdx = localGroups.findIndex((g: any) => g.id === groupId);
        if (groupIdx !== -1) {
          const fakeAddress = 'local-member-' + Date.now();
          const newMember = {
            wallet_address: fakeAddress,
            display_name: newMemberName.trim(),
            avatar_emoji: '👤'
          };
          localGroups[groupIdx].members.push(newMember);
          localStorage.setItem('split_local_groups', JSON.stringify(localGroups));
          showToast('Member added!', 'success');
          setNewMemberName('');
          refreshGroup();
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to add local member', 'error');
      } finally {
        setIsAdding(false);
      }
      return;
    }

    const { address } = walletRef.current;
    if (!address) return;
    if (!isAddress(manualAddress)) {
      showToast('Please enter a valid wallet address (0x...)', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const normalized = manualAddress.toLowerCase();
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        wallet_address: normalized,
        display_name: newMemberName || null,
      });
      if (error) throw error;

      if (address && newMemberName) {
        await wallet.ensureSession();
        await fetch('/api/address-book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: address.toLowerCase(), contactAddress: normalized, nickname: newMemberName }),
        }).catch((error) => console.error('Failed to save contact:', error));
      }

      if (group?.created_by && group.created_by.toLowerCase() !== address?.toLowerCase()) {
        const adderName = getMemberDisplayName(address || '');
        await createNotificationSafe({
          userAddress: group.created_by,
          groupId: groupId as string,
          type: 'group_joined',
          title: 'New Member',
          body: `${adderName} added a new member to ${group.name}`,
          actor: address?.toLowerCase(),
          actionUrl: `/app/group/${groupId}`,
        });
      }

      showToast('Member added!', 'success');
      setManualAddress('');
      setNewMemberName('');
      setIsAdding(false);
      refreshGroup();
    } catch {
      showToast('Failed to add member. They may already be in the group.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (groupId && (groupId as string).startsWith('local-')) {
      setShowDeleteConfirm(false);
      setIsDeleting(true);
      try {
        const localGroups = JSON.parse(localStorage.getItem('split_local_groups') || '[]');
        const filtered = localGroups.filter((g: any) => g.id !== groupId);
        localStorage.setItem('split_local_groups', JSON.stringify(filtered));

        // Clean up expenses and splits
        const allExpenses = JSON.parse(localStorage.getItem('split_local_expenses') || '[]');
        const allSplits = JSON.parse(localStorage.getItem('split_local_splits') || '[]');
        
        const filteredExpenses = allExpenses.filter((e: any) => e.group_id !== groupId);
        const expenseIds = allExpenses.filter((e: any) => e.group_id === groupId).map((e: any) => e.id);
        const filteredSplits = allSplits.filter((s: any) => !expenseIds.includes(s.expense_id));
        
        localStorage.setItem('split_local_expenses', JSON.stringify(filteredExpenses));
        localStorage.setItem('split_local_splits', JSON.stringify(filteredSplits));

        router.push('/app');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete local group', 'error');
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    const { address } = walletRef.current;
    if (!address) return;
    if (balances.length > 0) {
      showToast('Cannot delete group with unsettled debts.', 'error');
      return;
    }
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throw error;
      router.push('/app');
    } catch {
      showToast('Failed to delete group.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendMessage = async () => {
    const { address } = walletRef.current;
    if (!address || !newMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      await sendMessage(groupId as string, address, newMessage.trim(), null);
      const senderName = getMemberDisplayName(address);
      await Promise.all(
        members
          .filter((m) => m.wallet_address.toLowerCase() !== address.toLowerCase())
          .map((m) =>
            createNotificationSafe({
              userAddress: m.wallet_address,
              groupId: groupId as string,
              type: 'message',
              title: `New message in ${group?.name}`,
              body: `${senderName}: ${newMessage.trim().slice(0, 120)}`,
              actor: address.toLowerCase(),
              actionUrl: `/app/group/${groupId}`,
            }).catch((error) => console.error(error))
          )
      );
      setNewMessage('');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
    } catch {
      showToast('Failed to send message.', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSettleAll = async () => {
    const { address } = walletRef.current;
    if (!address || oweBalances.length === 0) return;
    setSettleAllLoading(true);
    try {
      const totalAmount = oweBalances.reduce((sum, item) => sum + Number(item.amount), 0);
      const { data: batch, error: batchError } = await supabase
        .from('settlement_batches')
        .insert({
          group_id: groupId,
          debtor: address.toLowerCase(),
          total_amount: totalAmount,
          status: 'processing',
        })
        .select()
        .single();
      if (batchError) throw batchError;

      let failures = 0;
      for (const debt of oweBalances) {
        const { data: item, error: itemError } = await supabase
          .from('settlement_batch_items')
          .insert({
            batch_id: batch.id,
            creditor: debt.to.toLowerCase(),
            amount: debt.amount,
            status: 'pending',
          })
          .select()
          .single();
        if (itemError || !item) {
          failures += 1;
          continue;
        }

        try {
          const txHash = await settle(groupId as string, debt.to, Number(debt.amount));
          await supabase
            .from('settlement_batch_items')
            .update({
              status: 'success',
              tx_hash: txHash,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
        } catch (error: any) {
          failures += 1;
          const errMsg = error?.shortMessage || error?.message || 'Failed settlement';
          await supabase
            .from('settlement_batch_items')
            .update({
              status: 'failed',
              error_message: errMsg,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          showToast(`Settlement failed: ${errMsg}`, 'error');
        }
      }

      await supabase
        .from('settlement_batches')
        .update({
          status: failures === 0 ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', batch.id);

      if (failures === 0) {
        showToast('All debts settled successfully.', 'success');
      }
      await Promise.all([refreshBalances(), refreshExpenses()]);
    } catch (error) {
      console.error(error);
      showToast('Failed to run settle all.', 'error');
    } finally {
      setSettleAllLoading(false);
    }
  };

  // Open the reverse/edit modals (the actual writes happen in submit* below).
  const handleReverseExpense = (expense: any) => {
    setReverseReason('');
    setReverseTarget(expense);
  };

  const handleEditExpense = (expense: any) => {
    setEditDescription(expense.description || '');
    setEditAmount(String(expense.total_amount ?? ''));
    setEditTarget(expense);
  };

  const submitReverse = async () => {
    const { address } = walletRef.current;
    if (!address || !reverseTarget) return;
    const expense = reverseTarget;
    const reason = reverseReason.trim();
    if (!reason) {
      showToast('Please enter a reason.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const beforeSnapshot = {
        description: expense.description,
        total_amount: expense.total_amount,
        category: expense.category,
        status: expense.status || 'active',
      };
      const afterSnapshot = { ...beforeSnapshot, status: 'reversed' };

      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          status: 'reversed',
          reversed_at: new Date().toISOString(),
          reversed_by: address.toLowerCase(),
          reversed_reason: reason,
        })
        .eq('id', expense.id);
      if (updateError) throw updateError;

      await supabase.from('expense_revisions').insert({
        expense_id: expense.id,
        group_id: groupId,
        actor: address.toLowerCase(),
        action: 'reverse',
        before_snapshot: beforeSnapshot,
        after_snapshot: afterSnapshot,
        reason,
      });

      showToast('Expense reversed.', 'success');
      setReverseTarget(null);
      await Promise.all([refreshExpenses(), refreshBalances()]);
    } catch (error) {
      console.error(error);
      showToast('Failed to reverse expense.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const submitEdit = async () => {
    const { address } = walletRef.current;
    if (!address || !editTarget) return;
    const expense = editTarget;
    const nextDescription = editDescription.trim();
    const nextAmount = Number(editAmount);
    if (!nextDescription || !Number.isFinite(nextAmount) || nextAmount <= 0) {
      showToast('Enter a valid description and amount.', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const relatedSplits = splits.filter((split) => split.expense_id === expense.id);
      const beforeSnapshot = {
        description: expense.description,
        total_amount: expense.total_amount,
        category: expense.category,
      };
      const afterSnapshot = {
        description: nextDescription,
        total_amount: nextAmount,
        category: expense.category,
      };

      const { error: updateExpenseError } = await supabase
        .from('expenses')
        .update({ description: nextDescription, total_amount: nextAmount })
        .eq('id', expense.id);
      if (updateExpenseError) throw updateExpenseError;

      if (relatedSplits.length > 0) {
        const share = nextAmount / relatedSplits.length;
        await Promise.all(
          relatedSplits.map((split) =>
            supabase.from('expense_splits').update({ amount: share }).eq('id', split.id)
          )
        );
      }

      await supabase.from('expense_revisions').insert({
        expense_id: expense.id,
        group_id: groupId,
        actor: address.toLowerCase(),
        action: 'edit',
        before_snapshot: beforeSnapshot,
        after_snapshot: afterSnapshot,
      });

      showToast('Expense updated.', 'success');
      setEditTarget(null);
      await Promise.all([refreshExpenses(), refreshBalances()]);
    } catch (error) {
      console.error(error);
      showToast('Failed to edit expense.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportExpenses = () => {
    const rows = [
      ['date', 'description', 'category', 'amount_usdm', 'paid_by', 'status'],
      ...filteredExpenses.map((expense) => [
        new Date(expense.created_at).toISOString(),
        expense.description,
        expense.category || 'other',
        Number(expense.total_amount).toFixed(2),
        getMemberDisplayName(expense.paid_by),
        expense.status || 'active',
      ]),
    ];
    const csv = toCsv(rows);
    downloadFile(`group-${groupId}-expenses.csv`, csv);
  };

  if (groupLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>Loading group...</div>
      </div>
    );
  }

  return (
    <>
      <AppHeader />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to delete "${group?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={() => groupId && (groupId as string).startsWith('local-') ? handleDeleteGroup() : requireConnection(handleDeleteGroup)}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Edit expense modal */}
      {editTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm" onClick={() => !actionLoading && setEditTarget(null)}>
          <div className="w-full max-w-[360px] bg-[#161616] border border-[#2C2C2C] rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="clash-display text-lg font-bold text-[#F7F3EC]">Edit expense</h3>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-[#8A8A8A]">Description</label>
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full h-11 bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 text-sm text-[#F7F3EC] outline-none focus:border-[#00C896]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-[#8A8A8A]">Amount (usdm)</label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full h-11 bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 text-sm dm-mono text-[#00C896] outline-none focus:border-[#00C896]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditTarget(null)} disabled={actionLoading}>Cancel</Button>
              <Button size="sm" className="flex-1" onClick={() => requireConnection(submitEdit)} loading={actionLoading}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reverse expense modal */}
      {reverseTarget && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm" onClick={() => !actionLoading && setReverseTarget(null)}>
          <div className="w-full max-w-[360px] bg-[#161616] border border-[#2C2C2C] rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="clash-display text-lg font-bold text-[#F7F3EC]">Reverse expense</h3>
            <p className="text-xs text-[#8A8A8A]">This marks &quot;{reverseTarget.description}&quot; as reversed. Add a reason for the audit log.</p>
            <textarea
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              rows={3}
              placeholder="Reason for reversing"
              className="w-full bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl p-3 text-sm text-[#F7F3EC] outline-none resize-none focus:border-[#00C896]"
            />
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setReverseTarget(null)} disabled={actionLoading}>Cancel</Button>
              <Button size="sm" variant="danger" className="flex-1" onClick={() => requireConnection(submitReverse)} loading={actionLoading}>Reverse</Button>
            </div>
          </div>
        </div>
      )}

      {isReadOnly && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 40,
          background: 'rgba(0,200,150,0.08)', borderBottom: '1px solid rgba(0,200,150,0.2)',
          padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px',
        }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#8A8A8A', margin: 0 }}>
            Viewing as guest — connect to settle or add expenses
          </p>
          <button
            onClick={() => requireConnection(() => {})}
            style={{
              background: '#00C896', color: '#000', border: 'none',
              borderRadius: '8px', padding: '5px 12px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '12px', fontWeight: '700',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Connect
          </button>
        </div>
      )}

      <div className="pt-20 px-4 pb-28 space-y-5" style={isReadOnly ? { paddingTop: '100px' } : {}}>
        {groupId && (groupId as string).startsWith('local-') && (
          <div className="p-4 border border-brand/20 rounded-2xl bg-brand/5 text-xs text-[#00C896] flex flex-col gap-3 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-bold text-[11px] uppercase tracking-wider text-brand flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Offline Local Group</span>
                </p>
                <p className="text-[#8A8A8A] leading-relaxed text-[11px] leading-relaxed">
                  This group is stored locally on your device. You do not need a wallet to split bills here.
                </p>
              </div>
              {address && (
                <Button
                  size="sm"
                  onClick={handleSyncLocalGroupToCloud}
                  loading={syncingGroup}
                  className="shrink-0 text-black bg-brand hover:bg-brand-dark font-bold text-[11px] px-3.5 py-1.5 h-auto rounded-lg"
                >
                  Sync to Cloud
                </Button>
              )}
            </div>
            {!address && (
              <p className="text-[10px] text-text-muted italic border-t border-[#2C2C2C] pt-2">
                Connect your wallet at the top of the screen to sync this group to the cloud/blockchain.
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '48px', height: '48px', flexShrink: 0,
              background: '#161616', border: '1px solid #2C2C2C',
              borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GroupIcon name={group?.emoji || 'Users'} size={28} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{
                fontFamily: 'Clash Display, sans-serif', fontWeight: '700',
                fontSize: '20px', color: '#F7F3EC', margin: 0,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {group?.name}
              </h1>
              <p style={{ fontSize: '12px', color: '#8A8A8A', margin: '2px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {members.slice(0, 4).map((m) => (
                  <span key={m.wallet_address} style={{
                    fontSize: '10px', color: '#8A8A8A', background: '#111',
                    padding: '2px 8px', borderRadius: '100px', fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {getMemberDisplayName(m.wallet_address)}
                  </span>
                ))}
                {members.length > 4 && (
                  <span style={{ fontSize: '10px', color: '#8A8A8A', background: '#111', padding: '2px 8px', borderRadius: '100px' }}>
                    +{members.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {isCreator && (
              <button
                onClick={() => balances.length === 0 && setShowDeleteConfirm(true)}
                disabled={isDeleting || balances.length > 0}
                style={{
                  width: '36px', height: '36px',
                  background: 'rgba(255,92,92,0.1)',
                  border: '1px solid rgba(255,92,92,0.3)',
                  borderRadius: '50%', color: balances.length > 0 ? '#4A4A4A' : '#FF5C5C',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: balances.length > 0 ? 'not-allowed' : 'pointer', touchAction: 'manipulation',
                  opacity: balances.length > 0 ? 0.5 : 1,
                }}
                title={balances.length > 0 ? "Settle debts to delete" : "Delete Group"}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
              </button>
            )}
            <button
              onClick={() => router.push(`/app/group/${groupId}/recurring`)}
              style={{
                width: '36px', height: '36px',
                background: 'rgba(0,200,150,0.1)',
                border: '1px solid rgba(0,200,150,0.3)',
                borderRadius: '50%', color: '#00C896',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
              title="Recurring rules"
            >
              <Repeat2 style={{ width: '16px', height: '16px' }} />
            </button>
            <button
              onClick={handleShare}
              style={{
                width: '36px', height: '36px',
                background: 'rgba(0,200,150,0.1)',
                border: '1px solid rgba(0,200,150,0.3)',
                borderRadius: '50%', color: '#00C896',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              <Share2 style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex', padding: '4px', background: '#161616',
          borderRadius: '16px', border: '1px solid #2C2C2C',
        }}>
          {(['balances', 'expenses', 'budget', 'predictions', ...(members.length > 1 ? ['chat'] : [])] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                flex: 1, padding: '9px 0', fontSize: '14px', fontWeight: '600',
                borderRadius: '12px', transition: 'all 0.2s', border: 'none',
                cursor: 'pointer', touchAction: 'manipulation',
                fontFamily: 'DM Sans, sans-serif',
                background: activeTab === tab ? '#2C2C2C' : 'transparent',
                color: activeTab === tab ? '#00C896' : '#8A8A8A',
              }}
            >
              {tab === 'predictions' ? 'Bets' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'balances' && (
          <BalancesTab
            isReadOnly={isReadOnly}
            balances={balances}
            personalBalances={personalBalances}
            oweBalances={oweBalances}
            getMemberDisplayName={getMemberDisplayName}
            groupId={groupId as string}
            address={address}
            requireConnection={requireConnection}
            handleSettleAll={handleSettleAll}
            settleAllLoading={settleAllLoading}
            handleNudge={handleNudge}
            isAdding={isAdding}
            setIsAdding={setIsAdding}
            manualAddress={manualAddress}
            setManualAddress={setManualAddress}
            newMemberName={newMemberName}
            setNewMemberName={setNewMemberName}
            handleAddManual={handleAddManual}
            showAudit={showAudit}
            setShowAudit={setShowAudit}
            auditFilter={auditFilter}
            setAuditFilter={setAuditFilter}
            filteredAuditDebts={filteredAuditDebts}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            expenseSearch={expenseSearch}
            setExpenseSearch={setExpenseSearch}
            expenseCategory={expenseCategory}
            setExpenseCategory={setExpenseCategory}
            handleExportExpenses={handleExportExpenses}
            expensesLoading={expensesLoading}
            filteredExpenses={filteredExpenses}
            splits={splits}
            address={address}
            isReadOnly={isReadOnly}
            requireConnection={requireConnection}
            handleEditExpense={handleEditExpense}
            handleReverseExpense={handleReverseExpense}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetTab
            groupId={groupId as string}
            expenses={expenses}
            isReadOnly={isReadOnly}
            requireConnection={requireConnection}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            messages={messages}
            messagesLoading={messagesLoading}
            getMemberDisplayName={getMemberDisplayName}
            address={address}
            isReadOnly={isReadOnly}
            requireConnection={requireConnection}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            isSendingMessage={isSendingMessage}
            chatEndRef={chatEndRef}
          />
        )}

        {activeTab === 'predictions' && (
          <GroupPredictions groupId={groupId as string} />
        )}
      </div>

      <div style={{
        position: 'fixed', bottom: '88px', left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)', maxWidth: '382px', pointerEvents: 'none',
      }}>
        <Button
          className="w-full h-14 rounded-2xl shadow-xl"
          onClick={() => requireConnection(() => router.push(`/app/group/${groupId}/add`))}
          style={{ background: '#00C896', color: '#000', fontWeight: '700', pointerEvents: 'auto', touchAction: 'manipulation' }}
        >
          <Plus style={{ width: '22px', height: '22px', marginRight: '8px' }} />
          Add Expense
        </Button>
      </div>
    </>
  );
}
