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
      <AppHeader />
      
      <div className="pt-20 px-4 pb-24 space-y-6">
        {/* Group Header Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#161616] border border-[#2C2C2C] rounded-xl flex items-center justify-center text-brand">
              <GroupIcon name={group?.emoji || 'Users'} size={32} />
            </div>
            <div>
              <h1 className="clash-display font-bold text-xl">{group?.name}</h1>
              <p className="text-xs text-[#8A8A8A]">{members.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCreator && (
              <button 
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                style={{
                  width: '36px', height: '36px',
                  background: 'rgba(255,92,92,0.1)',
                  border: '1px solid rgba(255,92,92,0.3)',
                  borderRadius: '50%',
                  color: '#FF5C5C',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <Button size="icon" variant="secondary" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#161616] rounded-2xl border border-[#2C2C2C]">
          <button 
            onClick={() => setActiveTab('balances')}
            style={{
              flex: 1, paddingTop: '8px', paddingBottom: '8px', fontSize: '14px', fontWeight: '600',
              borderRadius: '12px', transition: 'all 0.2s',
              background: activeTab === 'balances' ? '#2C2C2C' : 'transparent',
              color: activeTab === 'balances' ? '#00C896' : '#8A8A8A',
              border: 'none', cursor: 'pointer'
            }}
          >
            Balances
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            style={{
              flex: 1, paddingTop: '8px', paddingBottom: '8px', fontSize: '14px', fontWeight: '600',
              borderRadius: '12px', transition: 'all 0.2s',
              background: activeTab === 'expenses' ? '#2C2C2C' : 'transparent',
              color: activeTab === 'expenses' ? '#00C896' : '#8A8A8A',
              border: 'none', cursor: 'pointer'
            }}
          >
            Expenses
          </button>
        </div>

        {activeTab === 'balances' ? (
          <div className="space-y-4 animate-fade-in">
            {balances.length > 0 ? (
              <Card className="divide-y divide-[#2C2C2C] p-0 overflow-hidden bg-[#161616] border-[#2C2C2C]">
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
              </Card>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-[#2C2C2C] rounded-2xl flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-[#4A4A4A] mb-2" />
                <p className="text-[#8A8A8A]">Everyone is settled!</p>
              </div>
            )}
            
            {/* Add Member Section */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!isAdding ? (
                <button 
                  onClick={() => setIsAdding(true)}
                  style={{
                    width: '100%', padding: '12px',
                    background: 'transparent', border: '1px dashed #2C2C2C',
                    borderRadius: '16px', color: '#8A8A8A',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  + Add Member by Address
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={manualAddress}
                    onChange={e => setManualAddress(e.target.value)}
                    placeholder="0x... wallet address"
                    style={{
                      flex: 1, height: '44px',
                      background: '#161616', border: '1px solid #2C2C2C',
                      borderRadius: '12px', padding: '0 12px',
                      color: '#F7F3EC', fontSize: '14px', outline: 'none'
                    }}
                  />
                  <Button size="sm" onClick={handleAddManual}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                </div>
              )}
            </div>
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
              <div className="text-center py-12 text-[#8A8A8A]">
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
          style={{ background: '#00C896', color: '#000', fontWeight: '700' }}
        >
          <Plus className="w-6 h-6 mr-2" />
          Add Expense
        </Button>
      </div>
    </>
  );
}
