'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCheck, ChevronRight, Trash2, BellOff, Coins, CheckCircle2, UserPlus, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICON: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  reminder: Coins,
  payment: CheckCircle2,
  join: UserPlus,
  expense: Receipt,
  system: Bell,
};

/** Notifications inbox (route `/app/notifications`): list, read, mark-all-read. */
export default function NotificationsPage() {
  const router = useRouter();
  const { address } = useWallet();
  const { notifications, loading, markAsRead, markAllRead, fetchNotifications, unreadCount } = useNotifications();

  const handleTap = async (n: any) => {
    if (!n.is_read) await markAsRead(n.id);
    if (n.action_url) router.push(n.action_url);
  };

  const handleDeleteAll = async () => {
    if (!address) return;
    if (!window.confirm('Delete all notifications? This cannot be undone.')) return;
    await supabase
      .from('notifications')
      .delete()
      .eq('user_address', address.toLowerCase());
    fetchNotifications();
  };

  return (
    <div style={{ padding: '0 0 24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid #1A1A1A',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell style={{ width: '20px', height: '20px', color: '#00C896' }} />
          <h1 style={{
            fontFamily: 'Clash Display, sans-serif', fontWeight: '700',
            fontSize: '20px', color: '#F7F3EC', margin: 0,
          }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span style={{
              background: '#FF5C5C', color: '#fff', fontSize: '11px',
              fontWeight: '700', padding: '2px 8px', borderRadius: '100px',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {unreadCount}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: 'transparent', border: '1px solid #2C2C2C',
                borderRadius: '10px', padding: '6px 12px',
                color: '#8A8A8A', fontSize: '12px', fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                touchAction: 'manipulation',
              }}
            >
              <CheckCheck style={{ width: '12px', height: '12px' }} />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{
                background: 'transparent', border: '1px solid rgba(255,92,92,0.3)',
                borderRadius: '10px', padding: '6px 10px',
                color: '#FF5C5C', fontSize: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                touchAction: 'manipulation',
              }}
            >
              <Trash2 style={{ width: '12px', height: '12px' }} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '8px 0' }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              height: '72px', margin: '8px 16px',
              background: '#161616', borderRadius: '16px',
              animation: 'pulse 1.5s infinite',
            }} />
          ))
        ) : notifications.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '64px 24px', gap: '12px',
          }}>
            <div style={{
              width: '56px', height: '56px', background: '#161616',
              border: '1px solid #2C2C2C', borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BellOff style={{ width: '24px', height: '24px', color: '#8A8A8A' }} />
            </div>
            <p style={{ color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', margin: 0, textAlign: 'center' }}>
              No notifications yet.<br />Reminders and group updates will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleTap(n)}
              style={{
                width: '100%', padding: '14px 16px',
                background: n.is_read ? 'transparent' : 'rgba(0,200,150,0.04)',
                border: 'none', borderBottom: '1px solid #111',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation',
              }}
            >
              {/* Icon */}
              <div style={{
                width: '40px', height: '40px', flexShrink: 0,
                background: '#161616', border: '1px solid #2C2C2C',
                borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {(() => {
                  const IconComp = TYPE_ICON[n.type] ?? Bell;
                  return <IconComp style={{ width: '18px', height: '18px', color: '#00C896' }} />;
                })()}
                {!n.is_read && (
                  <div style={{
                    position: 'absolute', top: '-3px', right: '-3px',
                    width: '10px', height: '10px', background: '#00C896',
                    borderRadius: '50%', border: '2px solid #0D0D0D',
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif', fontWeight: n.is_read ? '500' : '700',
                  fontSize: '14px', color: '#F7F3EC', margin: 0, lineHeight: '1.4',
                }}>
                  {n.title}
                </p>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
                  color: '#8A8A8A', margin: '3px 0 0', lineHeight: '1.4',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {n.body}
                </p>
                <p style={{
                  fontFamily: 'DM Mono, monospace', fontSize: '10px',
                  color: '#4A4A4A', margin: '5px 0 0',
                }}>
                  {timeAgo(n.created_at)}
                </p>
              </div>

              {n.action_url && (
                <ChevronRight style={{ width: '16px', height: '16px', color: '#4A4A4A', flexShrink: 0, marginTop: '10px' }} />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
