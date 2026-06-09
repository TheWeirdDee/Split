"use client";

import React, { useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { useGroup } from '@/hooks/useGroups';
import { useBalances } from '@/hooks/useBalances';
import { useExpenses } from '@/hooks/useExpenses';
import { useGroupChat } from '@/hooks/useGroupChat';
import { useWallet } from '@/context/WalletContext';
import { BalanceRow } from '@/components/app/BalanceRow';
import { ExpenseCard } from '@/components/app/ExpenseCard';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/components/common/Toast';
import { GroupIcon } from '@/components/common/GroupIcon';
import {
  Plus,
  Share2,
  CheckCircle2,
  Trash2,
  MessageCircle,
  Send,
  Search,
  Download,
  Repeat2,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateInviteLink, copyToClipboard } from '@/lib/inviteLinks';
import { createNotificationSafe } from '@/lib/notifications';
import { useAddressBook } from '@/hooks/useAddressBook';
import { useSettle } from '@/hooks/useSettle';
import { CATEGORIES } from '@/constants/categories';

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
  const { group, members, loading: groupLoading } = useGroup(groupId as string);
  const { balances } = useBalances(groupId as string);
  const { expenses, splits, loading: expensesLoading } = useExpenses(groupId as string);
  const { messages, loading: messagesLoading, sendMessage } = useGroupChat(groupId as string);
  const { getNickname } = useAddressBook();
  const { settle } = useSettle();

  const [activeTab, setActiveTab] = useState<'balances' | 'expenses' | 'chat'>('balances');
  const [manualAddress, setManualAddress] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [settleAllLoading, setSettleAllLoading] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('all');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const inviteLink = generateInviteLink(groupId as string);
  const isCreator = group?.created_by?.toLowerCase() === address?.toLowerCase();
  const isReadOnly = !address;

  const getMemberDisplayName = (walletAddress: string) => {
    const member = members.find((m) => m.wallet_address.toLowerCase() === walletAddress.toLowerCase());
    return (
      getNickname(walletAddress) ||
      member?.display_name ||
      `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    );
  };

  const personalBalances = useMemo(
    () =>
      balances.filter(
        (balance) =>
          balance.from.toLowerCase() === address?.toLowerCase() ||
          balance.to.toLowerCase() === address?.toLowerCase()
      ),
    [balances, address]
  );

  const oweBalances = useMemo(
    () => personalBalances.filter((balance) => balance.from.toLowerCase() === address?.toLowerCase()),
    [personalBalances, address]
  );

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const bySearch = !expenseSearch || expense.description.toLowerCase().includes(expenseSearch.toLowerCase());
      const byCategory = expenseCategory === 'all' || expense.category === expenseCategory;
      return bySearch && byCategory;
    });
  }, [expenses, expenseSearch, expenseCategory]);

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

  const handleRemind = async (targetAddress: string, amount: number) => {
    const { address } = walletRef.current;
    if (!address) return;
    try {
      const senderName = getMemberDisplayName(address);
      const targetName = getMemberDisplayName(targetAddress);
      await createNotificationSafe({
        userAddress: targetAddress,
        groupId: groupId as string,
        type: 'reminder',
        title: 'Payment Reminder',
        body: `${senderName} reminds you to pay ${amount.toFixed(2)} cUSD in "${group?.name}".`,
        actor: address?.toLowerCase(),
        actionUrl: `/app/group/${groupId}`,
      });
      showToast(`Reminder sent to ${targetName}!`, 'success');
    } catch {
      showToast('Failed to send reminder.', 'error');
    }
  };

  const handleAddManual = async () => {
    const { address } = walletRef.current;
    if (!address) return;
    if (!manualAddress || !manualAddress.startsWith('0x')) {
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
        await supabase.from('address_book').upsert(
          {
            owner_address: address.toLowerCase(),
            contact_address: normalized,
            nickname: newMemberName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'owner_address,contact_address' }
        );
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
      window.location.reload();
    } catch {
      showToast('Failed to add member. They may already be in the group.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGroup = async () => {
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
          await supabase
            .from('settlement_batch_items')
            .update({
              status: 'failed',
              error_message: error?.message || 'Failed settlement',
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
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
      } else {
        showToast(`Settle all finished with ${failures} failure(s).`, 'error');
      }
      window.location.reload();
    } catch (error) {
      console.error(error);
      showToast('Failed to run settle all.', 'error');
    } finally {
      setSettleAllLoading(false);
    }
  };

  const handleReverseExpense = async (expense: any) => {
    const { address } = walletRef.current;
    if (!address) return;
    const reason = window.prompt('Reason for reversing this expense?');
    if (!reason) return;
    try {
      const beforeSnapshot = {
        description: expense.description,
        total_amount: expense.total_amount,
        category: expense.category,
        status: expense.status || 'active',
      };
      const afterSnapshot = {
        ...beforeSnapshot,
        status: 'reversed',
      };

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
      window.location.reload();
    } catch (error) {
      console.error(error);
      showToast('Failed to reverse expense.', 'error');
    }
  };

  const handleEditExpense = async (expense: any) => {
    const { address } = walletRef.current;
    if (!address) return;
    const nextDescription = window.prompt('Update description', expense.description || '');
    if (nextDescription === null) return;
    const nextAmountRaw = window.prompt('Update amount (cUSD)', String(expense.total_amount));
    if (nextAmountRaw === null) return;
    const nextAmount = Number(nextAmountRaw);
    if (!nextDescription.trim() || !Number.isFinite(nextAmount) || nextAmount <= 0) {
      showToast('Invalid description or amount.', 'error');
      return;
    }

    try {
      const relatedSplits = splits.filter((split) => split.expense_id === expense.id);
      const beforeSnapshot = {
        description: expense.description,
        total_amount: expense.total_amount,
        category: expense.category,
      };
      const afterSnapshot = {
        description: nextDescription.trim(),
        total_amount: nextAmount,
        category: expense.category,
      };

      const { error: updateExpenseError } = await supabase
        .from('expenses')
        .update({
          description: nextDescription.trim(),
          total_amount: nextAmount,
        })
        .eq('id', expense.id);
      if (updateExpenseError) throw updateExpenseError;

      if (relatedSplits.length > 0) {
        const share = nextAmount / relatedSplits.length;
        const updates = relatedSplits.map((split) =>
          supabase
            .from('expense_splits')
            .update({ amount: share })
            .eq('id', split.id)
        );
        await Promise.all(updates);
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
      window.location.reload();
    } catch (error) {
      console.error(error);
      showToast('Failed to edit expense.', 'error');
    }
  };

  const handleExportExpenses = () => {
    const rows = [
      ['date', 'description', 'category', 'amount_cusd', 'paid_by', 'status'],
      ...filteredExpenses.map((expense) => [
        new Date(expense.created_at).toISOString(),
        expense.description,
        expense.category,
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
        onConfirm={() => requireConnection(handleDeleteGroup)}
        onCancel={() => setShowDeleteConfirm(false)}
      />

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
          {(['balances', 'expenses', ...(members.length > 1 ? ['chat'] : [])] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'balances' | 'expenses' | 'chat')}
              style={{
                flex: 1, padding: '9px 0', fontSize: '14px', fontWeight: '600',
                borderRadius: '12px', transition: 'all 0.2s', border: 'none',
                cursor: 'pointer', touchAction: 'manipulation',
                fontFamily: 'DM Sans, sans-serif',
                background: activeTab === tab ? '#2C2C2C' : 'transparent',
                color: activeTab === tab ? '#00C896' : '#8A8A8A',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'balances' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isReadOnly ? (
              <>
                {balances.length > 0 ? (
                  <Card className="divide-y divide-[#2C2C2C] p-0 overflow-hidden bg-[#161616] border-[#2C2C2C]">
                    {balances.map((balance, i) => (
                      <div key={i} className="px-4">
                        <BalanceRow
                          address={balance.from}
                          displayName={`${getMemberDisplayName(balance.from)} → ${getMemberDisplayName(balance.to)}`}
                          amount={balance.amount}
                          type="owe"
                          groupId={groupId as string}
                        />
                      </div>
                    ))}
                  </Card>
                ) : (
                  <div style={{
                    textAlign: 'center', padding: '48px 24px',
                    border: '2px dashed #2C2C2C', borderRadius: '20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  }}>
                    <CheckCircle2 style={{ width: '32px', height: '32px', color: '#4A4A4A' }} />
                    <p style={{ color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Everyone is settled!</p>
                  </div>
                )}
                <button
                  onClick={() => requireConnection(() => {})}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)',
                    borderRadius: '16px', color: '#00C896',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', touchAction: 'manipulation',
                  }}
                >
                  Connect wallet to see your balance &amp; settle
                </button>
              </>
            ) : (
              <>
                {oweBalances.length > 0 && (
                  <Button
                    className="w-full"
                    loading={settleAllLoading}
                    onClick={() => requireConnection(handleSettleAll)}
                  >
                    Settle all debts
                  </Button>
                )}

                {personalBalances.length > 0 ? (
                  <Card className="divide-y divide-[#2C2C2C] p-0 overflow-hidden bg-[#161616] border-[#2C2C2C]">
                    {personalBalances.map((balance, i) => {
                      const isUserFrom = balance.from.toLowerCase() === address?.toLowerCase();
                      return (
                        <div key={i} className="px-4">
                          <BalanceRow
                            address={isUserFrom ? balance.to : balance.from}
                            displayName={getMemberDisplayName(isUserFrom ? balance.to : balance.from)}
                            amount={balance.amount}
                            type={isUserFrom ? 'owe' : 'owed'}
                            groupId={groupId as string}
                            onRemind={!isUserFrom ? () => requireConnection(() => handleRemind(balance.from, balance.amount)) : undefined}
                          />
                        </div>
                      );
                    })}
                  </Card>
                ) : (
                  <div style={{
                    textAlign: 'center', padding: '48px 24px',
                    border: '2px dashed #2C2C2C', borderRadius: '20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  }}>
                    <CheckCircle2 style={{ width: '32px', height: '32px', color: '#4A4A4A' }} />
                    <p style={{ color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Everyone is settled!</p>
                  </div>
                )}

                {!isAdding ? (
                  <button
                    onClick={() => setIsAdding(true)}
                    style={{
                      width: '100%', padding: '14px',
                      background: 'transparent', border: '1px dashed #2C2C2C',
                      borderRadius: '16px', color: '#8A8A8A',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                      cursor: 'pointer', touchAction: 'manipulation',
                    }}
                  >
                    + Add Member by Address
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="0x... wallet address"
                      style={{
                        width: '100%', height: '46px', background: '#161616',
                        border: '1px solid #2C2C2C', borderRadius: '12px',
                        padding: '0 14px', color: '#F7F3EC', fontSize: '14px', outline: 'none',
                        fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
                      }}
                    />
                    <input
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Display name (optional)"
                      style={{
                        width: '100%', height: '46px', background: '#161616',
                        border: '1px solid #2C2C2C', borderRadius: '12px',
                        padding: '0 14px', color: '#F7F3EC', fontSize: '14px', outline: 'none',
                        fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button size="sm" onClick={() => requireConnection(handleAddManual)} disabled={isAdding}>Add</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="rounded-2xl border border-[#2C2C2C] bg-[#121212] p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-[#8A8A8A]" />
                <input
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Search expenses"
                  className="w-full bg-transparent text-sm text-[#F7F3EC] outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="flex-1 bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 py-2 text-xs text-[#F7F3EC]"
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={handleExportExpenses}>
                  <Download size={14} />
                  Export
                </Button>
              </div>
            </div>

            {expensesLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} style={{ height: '72px', background: '#161616', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
              ))
            ) : filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => {
                const userSplit = splits.find(
                  (s) => s.expense_id === expense.id && s.wallet_address.toLowerCase() === address?.toLowerCase()
                );
                return (
                  <div key={expense.id} className="space-y-2">
                    <ExpenseCard
                      expense={expense}
                      userShare={userSplit ? parseFloat(userSplit.amount) : 0}
                    />
                    {!isReadOnly && (
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => requireConnection(() => handleEditExpense(expense))}>
                          <Edit3 size={12} />
                          Edit
                        </Button>
                        {(expense.status || 'active') !== 'reversed' && (
                          <Button size="sm" variant="danger" onClick={() => requireConnection(() => handleReverseExpense(expense))}>
                            <RotateCcw size={12} />
                            Reverse
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{
                textAlign: 'center', padding: '48px 24px', color: '#8A8A8A',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                No expenses found.
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <MessageCircle style={{ width: '16px', height: '16px', color: '#00C896' }} />
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: '600', fontSize: '14px', color: '#F7F3EC', margin: 0 }}>
                Group Chat
              </p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8A8A8A', margin: 0 }}>
                · {messages.length} messages
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messagesLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '64px', background: '#161616', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
                ))
              ) : messages.length > 0 ? (
                messages.map((msg: any) => {
                  const senderName = getMemberDisplayName(msg.sender);
                  const isOwn = msg.sender.toLowerCase() === address?.toLowerCase();
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {!isOwn && (
                        <span style={{
                          fontSize: '11px', color: '#00C896', marginBottom: '4px',
                          fontFamily: 'DM Sans, sans-serif', fontWeight: '600', paddingLeft: '4px',
                        }}>
                          {senderName}
                        </span>
                      )}
                      <div style={{
                        maxWidth: '80%',
                        background: isOwn ? 'rgba(0,200,150,0.12)' : '#1A1A1A',
                        border: `1px solid ${isOwn ? 'rgba(0,200,150,0.25)' : '#2C2C2C'}`,
                        borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: '10px 14px',
                        overflow: 'hidden',
                      }}>
                        <p style={{
                          fontSize: '14px', color: '#F7F3EC', margin: 0,
                          fontFamily: 'DM Sans, sans-serif', lineHeight: '1.5',
                        }}>
                          {msg.text}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '10px', color: '#4A4A4A', marginTop: '3px',
                        fontFamily: 'DM Mono, monospace', paddingLeft: isOwn ? 0 : '4px',
                        paddingRight: isOwn ? '4px' : 0,
                      }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  textAlign: 'center', padding: '40px 24px',
                  border: '1px dashed #2C2C2C', borderRadius: '20px',
                  color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                }}>
                  No messages yet. Say hello.
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {isReadOnly ? (
              <button
                onClick={() => requireConnection(() => {})}
                style={{
                  width: '100%', padding: '14px',
                  background: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)',
                  borderRadius: '16px', color: '#00C896',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', touchAction: 'manipulation',
                }}
              >
                Connect wallet to join the conversation
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      requireConnection(handleSendMessage);
                    }
                  }}
                  rows={2}
                  placeholder="Write a message..."
                  style={{
                    width: '100%', background: '#161616', border: '1px solid #2C2C2C',
                    borderRadius: '16px', padding: '12px 14px', color: '#F7F3EC',
                    fontSize: '14px', outline: 'none', resize: 'none',
                    fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', lineHeight: '1.5',
                  }}
                />
                <button
                  onClick={() => requireConnection(handleSendMessage)}
                  disabled={isSendingMessage || !newMessage.trim()}
                  style={{
                    width: '48px', height: '48px', flexShrink: 0,
                    background: '#00C896', border: 'none', borderRadius: '14px',
                    color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: !newMessage.trim() ? 0.4 : 1,
                  }}
                >
                  <Send style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            )}
          </div>
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
