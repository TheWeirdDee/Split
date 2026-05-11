"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { useGroup } from '@/hooks/useGroups';
import { useBalances } from '@/hooks/useBalances';
import { useExpenses } from '@/hooks/useExpenses';
import { useWallet } from '@/context/WalletContext';
import { BalanceRow } from '@/components/app/BalanceRow';
import { ExpenseCard } from '@/components/app/ExpenseCard';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Plus, UserPlus, Share2, PartyPopper, CheckCircle2, Trash2, Settings2, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateInviteLink, copyToClipboard } from '@/lib/inviteLinks';
import { cn } from '@/lib/utils';

import { GroupIcon } from '@/components/common/GroupIcon';

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const { address } = useWallet();
  const { group, members, loading: groupLoading } = useGroup(groupId as string);
  const { balances, loading: balancesLoading } = useBalances(groupId as string);
  const { expenses, splits, loading: expensesLoading } = useExpenses(groupId as string);
  
  const [activeTab, setActiveTab] = useState<'balances' | 'expenses'>('balances');
  const [showSettings, setShowSettings] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const inviteLink = generateInviteLink(groupId as string);

  const handleShare = async () => {
    const copied = await copyToClipboard(inviteLink);
    if (copied) alert('Invite link copied to clipboard!');
  };

  const handleAddManual = async () => {
    if (!manualAddress || !manualAddress.startsWith('0x')) {
      alert('Please enter a valid wallet address');
      return;
    }
    
    setIsAdding(true);
    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        wallet_address: manualAddress.toLowerCase(),
      });

      if (error) throw error;
      alert('Member added successfully!');
      setManualAddress('');
      window.location.reload(); // Refresh to show new member
    } catch (err) {
      console.error(err);
      alert('Failed to add member. They might already be in the group.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throw error;
      
      router.push('/app');
    } catch (err) {
      console.error(err);
      alert('Failed to delete group.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isCreator = group?.created_by?.toLowerCase() === address?.toLowerCase();

  if (groupLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <AppHeader title={group?.name || 'Group'} showBack />
      
      <div className="pt-20 px-4 pb-24 space-y-6">
        {/* Group Header Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-surface-2 rounded-xl flex items-center justify-center text-brand">
              <GroupIcon name={group?.emoji || 'Users'} size={32} />
            </div>
            <div>
              <h1 className="clash-display font-bold text-xl">{group?.name}</h1>
              <p className="text-xs text-text-muted">{members.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="secondary" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" onClick={() => setShowSettings(!showSettings)}>
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Group Settings / Management */}
        {showSettings && (
          <div className="bg-surface-2 border border-border rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1">
                Add Member by Address
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="0x..."
                  className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand transition-colors"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                />
                <Button size="sm" onClick={handleAddManual} loading={isAdding} disabled={!manualAddress}>
                  <UserCheck className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isCreator && (
              <div className="pt-2 border-t border-border/50">
                <Button 
                  variant="outline" 
                  className="w-full text-red-500 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40" 
                  onClick={handleDeleteGroup}
                  loading={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Group
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex p-1 bg-surface-2 rounded-2xl border border-border">
          <button 
            onClick={() => setActiveTab('balances')}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-xl transition-all",
              activeTab === 'balances' ? "bg-surface shadow-sm text-brand" : "text-text-muted"
            )}
          >
            Balances
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-xl transition-all",
              activeTab === 'expenses' ? "bg-surface shadow-sm text-brand" : "text-text-muted"
            )}
          >
            Expenses
          </button>
        </div>

        {activeTab === 'balances' ? (
          <div className="space-y-4 animate-fade-in">
            {balances.length > 0 ? (
              <Card className="divide-y divide-border p-0 overflow-hidden">
                {balances.map((balance, i) => {
                  const isUserFrom = balance.from.toLowerCase() === address?.toLowerCase();
                  const isUserTo = balance.to.toLowerCase() === address?.toLowerCase();
                  
                  if (!isUserFrom && !isUserTo) return null;

                  return (
                    <div key={i} className="px-4">
                      <BalanceRow 
                        address={isUserFrom ? balance.to : balance.from}
                        amount={balance.amount}
                        type={isUserFrom ? 'owe' : 'owed'}
                        groupId={groupId as string}
                        onRemind={() => alert('Reminder copied!')}
                      />
                    </div>
                  );
                })}
                {balances.filter(b => b.from.toLowerCase() === address?.toLowerCase() || b.to.toLowerCase() === address?.toLowerCase()).length === 0 && (
                  <div className="p-8 text-center text-text-muted text-sm flex flex-col items-center gap-2">
                    <PartyPopper className="w-8 h-8 text-brand mb-2" />
                    You're all settled up!
                  </div>
                )}
              </Card>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-text-muted">Everyone is settled!</p>
              </div>
            )}
            
            <Button variant="outline" className="w-full border-dashed" onClick={handleShare}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Members
            </Button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {expenses.length > 0 ? (
              expenses.map((expense) => {
                const userSplit = splits.find(s => s.expense_id === expense.id && s.wallet_address.toLowerCase() === address?.toLowerCase());
                return (
                  <ExpenseCard 
                    key={expense.id} 
                    expense={expense} 
                    userShare={userSplit ? parseFloat(userSplit.amount) : 0} 
                  />
                );
              })
            ) : (
              <div className="text-center py-12 text-text-muted">
                No expenses logged yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-6 pointer-events-none">
        <Button 
          className="w-full h-14 rounded-2xl shadow-xl shadow-brand/20 pointer-events-auto"
          onClick={() => router.push(`/app/group/${groupId}/add`)}
        >
          <Plus className="w-6 h-6 mr-2" />
          Add Expense
        </Button>
      </div>
    </>
  );
}
