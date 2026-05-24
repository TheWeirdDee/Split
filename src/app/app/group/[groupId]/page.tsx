"use client";

import React, { useState, useRef } from 'react';
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
import { Plus, Share2, CheckCircle2, Trash2, MessageCircle, Paperclip, Send, Image as ImageIcon, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateInviteLink, copyToClipboard } from '@/lib/inviteLinks';
import { GroupIcon } from '@/components/common/GroupIcon';

const compressImageBase64 = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = (err) => reject(err);
  });
};

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const { address } = useWallet();
  const { showToast } = useToast();
  const { group, members, loading: groupLoading } = useGroup(groupId as string);
  const { balances, loading: balancesLoading } = useBalances(groupId as string);
  const { expenses, splits, loading: expensesLoading } = useExpenses(groupId as string);
  const { messages, loading: messagesLoading, sendMessage } = useGroupChat(groupId as string);

  const [activeTab, setActiveTab] = useState<'balances' | 'expenses' | 'chat'>('balances');
  const [manualAddress, setManualAddress] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      let result = event.target?.result as string;

      if (file.type.startsWith('image/')) {
        try {
          result = await compressImageBase64(result);
        } catch (err) {
          console.error('Image compression failed, using original', err);
        }
      }

      setAttachmentUrl(result);
      showToast('File attached!', 'success');
      if (e.target) e.target.value = '';
    };
    reader.onerror = () => {
      showToast('Failed to read file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const inviteLink = generateInviteLink(groupId as string);

  const getMemberDisplayName = (walletAddress: string) => {
    const member = members.find((m) => m.wallet_address.toLowerCase() === walletAddress.toLowerCase());
    return member?.display_name || `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  };

  // ─── Share (works in MiniPay) ──────────────────────────────────────────────
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

  // ─── Create notification ──────────────────────────────────────────────────
  const createNotification = async (
    userAddress: string,
    title: string,
    body: string,
    actionUrl: string | null = null,
    type: string = 'reminder'
  ) => {
    const { error } = await supabase.from('notifications').insert({
      user_address: userAddress.toLowerCase(),
      group_id: groupId,
      type,
      title,
      body,
      actor: address?.toLowerCase() || null,
      action_url: actionUrl,
      is_read: false,
    });
    if (error) throw error;
  };

  // ─── Remind ────────────────────────────────────────────────────────────────
  const handleRemind = async (targetAddress: string, amount: number) => {
    try {
      const senderName = getMemberDisplayName(address || '');
      const targetName = getMemberDisplayName(targetAddress);
      await createNotification(
        targetAddress,
        '💸 Payment Reminder',
        `${senderName} reminds you to pay ${amount.toFixed(2)} cUSD in "${group?.name}".`,
        `/app/group/${groupId}`
      );
      showToast(`Reminder sent to ${targetName}!`, 'success');
    } catch {
      showToast('Failed to send reminder.', 'error');
    }
  };

  // ─── Add member ────────────────────────────────────────────────────────────
  const handleAddManual = async () => {
    if (!manualAddress || !manualAddress.startsWith('0x')) {
      showToast('Please enter a valid wallet address (0x…)', 'error');
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

      if (group?.created_by && group.created_by.toLowerCase() !== address?.toLowerCase()) {
        const adderName = getMemberDisplayName(address || '');
        createNotification(
          group.created_by,
          '👋 New Member',
          `${adderName} added a new member to ${group.name}`,
          `/app/group/${groupId}`,
          'group_joined'
        ).catch(console.error);
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

  // ─── Delete group ──────────────────────────────────────────────────────────
  const handleDeleteGroup = async () => {
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

  // ─── Send chat message ─────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!address || (!newMessage && !attachmentUrl)) return;
    setIsSendingMessage(true);
    try {
      await sendMessage(groupId as string, address, newMessage || null, attachmentUrl || null);
      
      const senderName = getMemberDisplayName(address);
      const textPreview = newMessage ? (newMessage.length > 50 ? newMessage.substring(0, 50) + '...' : newMessage) : 'Sent an attachment';
      members.forEach((m) => {
        if (m.wallet_address.toLowerCase() !== address.toLowerCase()) {
          createNotification(
            m.wallet_address,
            `💬 New message in ${group?.name}`,
            `${senderName}: ${textPreview}`,
            `/app/group/${groupId}`,
            'message'
          ).catch(console.error);
        }
      });

      setNewMessage('');
      setAttachmentUrl('');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      showToast('Failed to send message.', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const isCreator = group?.created_by?.toLowerCase() === address?.toLowerCase();

  if (groupLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif' }}>Loading group…</div>
      </div>
    );
  }

  return (
    <>
      <AppHeader />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to delete "${group?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="pt-20 px-4 pb-28 space-y-5">
        {/* ── Group Header ──────────────────────────────────────────── */}
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
                    {m.display_name || `${m.wallet_address.slice(0, 6)}…${m.wallet_address.slice(-4)}`}
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

          {/* Action buttons */}
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

        {/* ── Tab Switcher ──────────────────────────────────────────── */}
        <div style={{
          display: 'flex', padding: '4px', background: '#161616',
          borderRadius: '16px', border: '1px solid #2C2C2C',
        }}>
          {(['balances', 'expenses', ...(members.length > 1 ? ['chat'] : [])] as const).map((tab) => (
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Balances Tab ──────────────────────────────────────────── */}
        {activeTab === 'balances' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                        onRemind={!isUserFrom ? () => handleRemind(balance.from, balance.amount) : undefined}
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

            {/* Add Member */}
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
                  placeholder="0x… wallet address"
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
                  <Button size="sm" onClick={handleAddManual} disabled={isAdding}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Expenses Tab ──────────────────────────────────────────── */}
        {activeTab === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {expensesLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} style={{ height: '72px', background: '#161616', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
              ))
            ) : expenses.length > 0 ? (
              expenses.map((expense) => {
                const userSplit = splits.find(
                  (s) => s.expense_id === expense.id && s.wallet_address.toLowerCase() === address?.toLowerCase()
                );
                return (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    userShare={userSplit ? parseFloat(userSplit.amount) : 0}
                  />
                );
              })
            ) : (
              <div style={{
                textAlign: 'center', padding: '48px 24px', color: '#8A8A8A',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                No expenses logged yet.
              </div>
            )}
          </div>
        )}

        {/* ── Chat Tab ──────────────────────────────────────────────── */}
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

            {/* Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messagesLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '64px', background: '#161616', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
                ))
              ) : messages.length > 0 ? (
                messages.map((msg: any) => {
                  const senderName = getMemberDisplayName(msg.sender);
                  const isOwn = msg.sender.toLowerCase() === address?.toLowerCase();
                  const isImage = msg.attachment_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || msg.attachment_url?.startsWith('data:image/');
                  const isVideo = msg.attachment_url?.match(/\.(mp4|webm|ogg|mov)$/i) || msg.attachment_url?.startsWith('data:video/');

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
                        {msg.text && (
                          <p style={{
                            fontSize: '14px', color: '#F7F3EC', margin: 0,
                            fontFamily: 'DM Sans, sans-serif', lineHeight: '1.5',
                            marginBottom: msg.attachment_url ? '8px' : 0,
                          }}>
                            {msg.text}
                          </p>
                        )}
                        {msg.attachment_url && isImage && (
                          <img
                            src={msg.attachment_url}
                            alt="attachment"
                            style={{ width: '100%', borderRadius: '10px', display: 'block', maxHeight: '220px', objectFit: 'cover' }}
                          />
                        )}
                        {msg.attachment_url && isVideo && (
                          <video
                            src={msg.attachment_url}
                            controls
                            style={{ width: '100%', borderRadius: '10px', display: 'block', maxHeight: '220px' }}
                          />
                        )}
                        {msg.attachment_url && !isImage && !isVideo && (
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '13px', color: '#00C896', fontFamily: 'DM Sans, sans-serif' }}
                          >
                            📎 View attachment
                          </a>
                        )}
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
                  No messages yet — say hello! 👋
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Attachment preview */}
            {attachmentUrl && (
              <div style={{
                background: '#161616', border: '1px solid #2C2C2C', borderRadius: '12px', padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {(attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || attachmentUrl.startsWith('data:image/')) ? (
                  <img src={attachmentUrl} alt="preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (attachmentUrl.match(/\.(mp4|webm|ogg|mov)$/i) || attachmentUrl.startsWith('data:video/')) ? (
                  <Video style={{ width: '24px', height: '24px', color: '#00C896' }} />
                ) : (
                  <Paperclip style={{ width: '20px', height: '20px', color: '#8A8A8A' }} />
                )}
                <span style={{ fontSize: '12px', color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attachmentUrl.startsWith('data:') ? 'Uploaded media file' : attachmentUrl}
                </span>
                <button onClick={() => setAttachmentUrl('')} style={{ background: 'none', border: 'none', color: '#FF5C5C', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>×</button>
              </div>
            )}

            {/* Message input */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '48px', height: '48px', flexShrink: 0,
                  background: '#161616', border: '1px solid #2C2C2C', borderRadius: '14px',
                  color: '#8A8A8A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', touchAction: 'manipulation',
                }}
                title="Upload image or video"
              >
                <ImageIcon style={{ width: '18px', height: '18px' }} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                style={{ display: 'none' }}
              />

              <div style={{ flex: 1 }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder="Write a message…"
                  style={{
                    width: '100%', background: '#161616', border: '1px solid #2C2C2C',
                    borderRadius: '16px', padding: '12px 14px', color: '#F7F3EC',
                    fontSize: '14px', outline: 'none', resize: 'none',
                    fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box', lineHeight: '1.5',
                  }}
                />
                <input
                  value={attachmentUrl.startsWith('data:') ? '' : attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="Paste image/video URL (optional)"
                  style={{
                    width: '100%', height: '38px', background: '#0D0D0D',
                    border: '1px solid #2C2C2C', borderTop: 'none',
                    borderRadius: '0 0 12px 12px', padding: '0 12px',
                    color: '#8A8A8A', fontSize: '12px', outline: 'none',
                    fontFamily: 'DM Mono, monospace', boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isSendingMessage || (!newMessage && !attachmentUrl)}
                style={{
                  width: '48px', height: '48px', flexShrink: 0,
                  background: '#00C896', border: 'none', borderRadius: '14px',
                  color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', touchAction: 'manipulation',
                  opacity: (!newMessage && !attachmentUrl) ? 0.4 : 1,
                }}
              >
                <Send style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── FAB: Add Expense ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: '88px', left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)', maxWidth: '382px', pointerEvents: 'none',
      }}>
        <Button
          className="w-full h-14 rounded-2xl shadow-xl"
          onClick={() => router.push(`/app/group/${groupId}/add`)}
          style={{ background: '#00C896', color: '#000', fontWeight: '700', pointerEvents: 'auto', touchAction: 'manipulation' }}
        >
          <Plus style={{ width: '22px', height: '22px', marginRight: '8px' }} />
          Add Expense
        </Button>
      </div>
    </>
  );
}
