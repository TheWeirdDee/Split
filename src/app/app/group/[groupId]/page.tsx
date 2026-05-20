"use client";

import React, { useState } from 'react';
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
import { Plus, UserPlus, Share2, PartyPopper, CheckCircle2, Trash2, Settings2, UserCheck, MessageCircle } from 'lucide-react';
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
  const { messages, loading: messagesLoading, sendMessage } = useGroupChat(groupId as string);
  
  const [activeTab, setActiveTab] = useState<'balances' | 'expenses' | 'chat'>('balances');
  const [showSettings, setShowSettings] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const inviteLink = generateInviteLink(groupId as string);

  const getMemberDisplayName = (walletAddress: string) => {
    const member = members.find((member) => member.wallet_address.toLowerCase() === walletAddress.toLowerCase());
    return member?.display_name || member?.wallet_address || walletAddress;
  };

  const handleShare = async () => {
    const shareData = {
      title: `Join ${group?.name}`,
      text: `Join my MiniPay Split group ${group?.name}:`,
      url: inviteLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        console.warn('Native share failed, falling back to clipboard.', error);
      }
    }

    const copied = await copyToClipboard(inviteLink);
    if (copied) {
      alert('Invite link copied to clipboard!');
    } else {
      alert('Failed to share invite link. Please copy it manually.');
    }
  };

  const createNotification = async (userAddress: string, title: string, body: string, actionUrl: string | null = null) => {
    const { error } = await supabase.from('notifications').insert({
      user_address: userAddress.toLowerCase(),
      group_id: groupId,
      type: 'reminder',
      title,
      body,
      actor: address?.toLowerCase() || null,
      action_url: actionUrl,
      is_read: false,
    });

    if (error) {
      console.error('Failed to insert notification:', error);
      throw error;
    }
  };

  const handleRemind = async (targetAddress: string, amount: number) => {
    try {
      const name = getMemberDisplayName(targetAddress);
      await createNotification(
        targetAddress,
        'Payment Reminder',
        `${getMemberDisplayName(address || '')} reminded you to pay ${amount.toFixed(2)} cUSD in ${group?.name}.`,
        `/app/group/${groupId}`
      );
      alert(`Reminder sent to ${name}.`);
    } catch (error) {
      alert('Failed to send reminder.');
    }
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
        display_name: newMemberName || null,
      });

      if (error) throw error;
      alert('Member added successfully!');
      setManualAddress('');
      setNewMemberName('');
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
              <div className="mt-2 flex flex-wrap gap-2">
                {members.slice(0, 4).map((member) => (
                  <span key={member.wallet_address} className="text-[10px] text-[#8A8A8A] bg-[#111] px-2 py-1 rounded-full">
                    {member.display_name || member.wallet_address.slice(0, 6) + '...' + member.wallet_address.slice(-4)}
                  </span>
                ))}
                {members.length > 4 && (
                  <span className="text-[10px] text-[#8A8A8A] bg-[#111] px-2 py-1 rounded-full">
                    +{members.length - 4} more
                  </span>
                )}
              </div>
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
          {members.length > 1 && (
            <button 
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1, paddingTop: '8px', paddingBottom: '8px', fontSize: '14px', fontWeight: '600',
                borderRadius: '12px', transition: 'all 0.2s',
                background: activeTab === 'chat' ? '#2C2C2C' : 'transparent',
                color: activeTab === 'chat' ? '#00C896' : '#8A8A8A',
                border: 'none', cursor: 'pointer'
              }}
            >
              Chat
            </button>
          )}
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
                        displayName={getMemberDisplayName(isUserFrom ? balance.to : balance.from)}
                        amount={balance.amount}
                        type={isUserFrom ? 'owe' : 'owed'}
                        groupId={groupId as string}
                        onRemind={isUserFrom ? undefined : () => handleRemind(balance.from, balance.amount)}
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
                <div className="space-y-3">
                <input
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  placeholder="0x... wallet address"
                  style={{
                    width: '100%', height: '44px',
                    background: '#161616', border: '1px solid #2C2C2C',
                    borderRadius: '12px', padding: '0 12px',
                    color: '#F7F3EC', fontSize: '14px', outline: 'none'
                  }}
                />
                <input
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="Display name (optional)"
                  style={{
                    width: '100%', height: '44px',
                    background: '#161616', border: '1px solid #2C2C2C',
                    borderRadius: '12px', padding: '0 12px',
                    color: '#F7F3EC', fontSize: '14px', outline: 'none'
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddManual}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                </div>
              </div>
              )}
            </div>
          </div>
        ) : activeTab === 'expenses' ? (
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
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">Group Chat</p>
                <p className="text-xs text-text-secondary">Keep everyone in sync, share images and links.</p>
              </div>
            </div>

            {messagesLoading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-20 bg-surface-2 rounded-3xl animate-pulse" />)
            ) : messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((message) => {
                  const senderName = getMemberDisplayName(message.sender);
                  const isImage = message.attachment_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                  return (
                    <Card key={message.id} className="p-4 bg-[#121212] border border-[#2C2C2C]">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs text-text-secondary">{senderName}</span>
                        <span className="text-[10px] text-[#6d6d6d]">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {message.text && <p className="text-sm text-text-primary mb-2">{message.text}</p>}
                      {message.attachment_url && (
                        <div className="rounded-2xl overflow-hidden bg-[#0e0e0e] border border-[#2c2c2c]">
                          {isImage ? (
                            <img src={message.attachment_url} alt="attachment" className="w-full object-cover" />
                          ) : (
                            <a href={message.attachment_url} target="_blank" rel="noreferrer" className="block p-3 text-sm text-brand underline">
                              View attachment
                            </a>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-[#8A8A8A] border border-dashed border-[#2C2C2C] rounded-2xl">
                No chat messages yet. Send the first update.
              </div>
            )}

            <div className="space-y-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                placeholder="Write a message..."
                className="w-full rounded-3xl border border-[#2C2C2C] bg-[#121212] p-4 text-sm text-text-primary outline-none"
              />
              <input
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="Add image or file URL (optional)"
                className="w-full rounded-3xl border border-[#2C2C2C] bg-[#121212] p-4 text-sm text-text-primary outline-none"
              />
              <Button
                className="w-full"
                onClick={async () => {
                  if (!address) return;
                  if (!newMessage && !attachmentUrl) return;

                  await sendMessage(groupId as string, address, newMessage || null, attachmentUrl || null);
                  setNewMessage('');
                  setAttachmentUrl('');
                }}
              >
                Send message
              </Button>
            </div>
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
