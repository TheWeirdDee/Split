"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/common/Card';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useSavingsCircle } from '@/hooks/useSavingsCircle';
import { useCurrency } from '@/context/CurrencyContext';
import { truncateAddress } from '@/lib/utils';
import { formatEther } from 'viem';
import { CheckCircle2, PlusCircle, UserPlus, ExternalLink, Trash2, Users, Download, Search, Bell, PiggyBank } from 'lucide-react';

type ActivityItem = {
  type: 'settlement' | 'expense' | 'group_created' | 'group_joined' | 'notification' | 'savings';
  date: Date;
  localId: string;
  [key: string]: any;
};

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

export default function ActivityPage() {
  const { address, connect } = useWallet();
  const { notifications } = useNotifications();
  const { circles } = useSavingsCircle();
  const { formatAmount } = useCurrency();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | ActivityItem['type']>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!address) {
        // No wallet connected: clear the feed and stop loading so we don't get
        // stuck on the spinner (loading starts true).
        setActivities([]);
        setLoading(false);
        return;
      }
      setLoading(true);

      const normalized = address.toLowerCase();

      const { data: settlements } = await supabase
        .from('settlements')
        .select('*')
        .or(`debtor.eq.${normalized},creditor.eq.${normalized}`)
        .order('settled_at', { ascending: false });

      const { data: expenseSplits } = await supabase
        .from('expense_splits')
        .select('*, expenses(*)')
        .eq('wallet_address', normalized)
        .order('id', { ascending: false });

      const { data: groupsCreated } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', normalized);

      const { data: groupJoins } = await supabase
        .from('group_members')
        .select('*, groups(*)')
        .eq('wallet_address', normalized);

      const merged: ActivityItem[] = [
        ...((settlements || []).map((item, idx) => ({
          ...item,
          type: 'settlement' as const,
          date: new Date(item.settled_at),
          localId: `settlement-${idx}`,
        })) as ActivityItem[]),
        ...((expenseSplits || []).map((item, idx) => ({
          ...item,
          type: 'expense' as const,
          date: new Date(item.expenses?.created_at || item.created_at),
          localId: `expense-${idx}`,
        })) as ActivityItem[]),
        ...((groupsCreated || []).map((item, idx) => ({
          ...item,
          type: 'group_created' as const,
          date: new Date(item.created_at),
          localId: `group-created-${idx}`,
        })) as ActivityItem[]),
        ...((groupJoins || []).map((item, idx) => ({
          ...item,
          type: 'group_joined' as const,
          date: new Date(item.joined_at),
          localId: `group-joined-${idx}`,
        })) as ActivityItem[]),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      setActivities(merged);
      setLoading(false);
    };

    fetchActivity();
  }, [address]);

  // Merge the Supabase-backed activities with realtime notifications and the
  // user's on-chain savings circles into one unified, date-sorted feed.
  const allActivities = useMemo(() => {
    const notificationItems: ActivityItem[] = notifications.map((n) => ({
      ...n,
      type: 'notification' as const,
      date: new Date(n.created_at),
      localId: `notification-${n.id}`,
    }));

    const savingsItems: ActivityItem[] = circles.map((c: any) => ({
      ...c,
      type: 'savings' as const,
      // Circles expose no creation timestamp on-chain; use the active cycle's
      // deadline so live circles surface near the top of the feed.
      date: c.nextDeadline && Number(c.nextDeadline) > 0 ? new Date(Number(c.nextDeadline) * 1000) : new Date(),
      localId: `savings-${c.id}`,
    }));

    return [...activities, ...notificationItems, ...savingsItems].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }, [activities, notifications, circles]);

  const filteredActivities = useMemo(() => {
    return allActivities.filter((activity) => {
      const typeMatches = filterType === 'all' || activity.type === filterType;
      const dateIso = activity.date.toISOString().split('T')[0];
      const fromMatches = !dateFrom || dateIso >= dateFrom;
      const toMatches = !dateTo || dateIso <= dateTo;

      const summary = (() => {
        if (activity.type === 'settlement') {
          const isPayer = activity.debtor === address?.toLowerCase();
          return isPayer ? `paid ${activity.amount} ${activity.creditor}` : `${activity.debtor} paid you ${activity.amount}`;
        }
        if (activity.type === 'expense') return `${activity.expenses?.description || ''} ${activity.amount}`;
        if (activity.type === 'group_created') return `created ${activity.name || ''}`;
        if (activity.type === 'notification') return `${activity.title || ''} ${activity.body || ''}`;
        if (activity.type === 'savings') return `savings ${activity.name || ''}`;
        return `joined ${activity.groups?.name || ''}`;
      })();
      const searchMatches = !search || summary.toLowerCase().includes(search.toLowerCase());
      return typeMatches && fromMatches && toMatches && searchMatches;
    });
  }, [allActivities, filterType, dateFrom, dateTo, search, address]);

  const handleDeleteActivity = async (activity: ActivityItem) => {
    try {
      if (activity.type === 'settlement') {
        await supabase.from('settlements').delete().eq('id', activity.id);
      } else if (activity.type === 'expense') {
        await supabase.from('expense_splits').delete().eq('id', activity.id);
      } else {
        return;
      }
      setActivities((prev) => prev.filter((item) => item.localId !== activity.localId));
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const handleExportCsv = () => {
    const rows = [
      ['type', 'date', 'title', 'subtitle', 'amount', 'tx_hash'],
      ...filteredActivities.map((activity) => {
        if (activity.type === 'settlement') {
          const isPayer = activity.debtor === address?.toLowerCase();
          const title = isPayer
            ? `You paid ${truncateAddress(activity.creditor)}`
            : `${truncateAddress(activity.debtor)} paid you`;
          return [
            activity.type,
            activity.date.toISOString(),
            title,
            `${activity.amount} usdm`,
            String(activity.amount),
            activity.onchain_tx || '',
          ];
        }
        if (activity.type === 'expense') {
          return [
            activity.type,
            activity.date.toISOString(),
            activity.expenses?.description || 'Expense',
            `${activity.amount} usdm`,
            String(activity.amount),
            '',
          ];
        }
        if (activity.type === 'group_created') {
          return [
            activity.type,
            activity.date.toISOString(),
            `Created group ${activity.name || ''}`,
            '',
            '',
            activity.onchain_tx || '',
          ];
        }
        return [
          activity.type,
          activity.date.toISOString(),
          `Joined group ${activity.groups?.name || ''}`,
          '',
          '',
          activity.onchain_tx || '',
        ];
      }),
    ];
    downloadFile(`split-activity-${new Date().toISOString().split('T')[0]}.csv`, toCsv(rows));
  };

  if (!mounted) {
    return <div style={{ minHeight: '60vh' }} />;
  }

  if (!address) {
    return (
      <div style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        textAlign: 'center',
        minHeight: '60vh',
      }}>
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '50%',
          background: 'rgba(0, 200, 150, 0.1)',
          border: '1px solid rgba(0, 200, 150, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00C896',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
          <h2 style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '22px', fontWeight: 'bold',
            color: '#f5f0e8', margin: 0
          }}>
            Connect Your Wallet
          </h2>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px', color: '#8a8a8a',
            lineHeight: 1.5, margin: 0
          }}>
            To view your activity feed, expense updates, settlements, and savings circle updates, please connect your Celo wallet.
          </p>
        </div>
        <button
          onClick={connect}
          style={{
            background: '#00C896',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 32px',
            color: '#000',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,200,150,0.3)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="clash-display font-bold text-xl uppercase tracking-wider text-text-muted px-1">
          Recent Activity
        </h2>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-secondary"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity"
            className="w-full bg-transparent text-sm text-text-primary outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
          >
            <option value="all">All types</option>
            <option value="settlement">Settlements</option>
            <option value="expense">Expenses</option>
            <option value="group_created">Groups created</option>
            <option value="group_joined">Groups joined</option>
            <option value="savings">Savings circles</option>
            <option value="notification">Notifications</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-text-primary col-span-2"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-20 bg-surface-2 rounded-2xl animate-pulse" />)
        ) : filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => {
            const isSettlement = activity.type === 'settlement';
            const isExpense = activity.type === 'expense';
            const isGroupCreated = activity.type === 'group_created';
            const isNotification = activity.type === 'notification';
            const isSavings = activity.type === 'savings';
            const isPayer = activity.debtor === address?.toLowerCase();

            let icon;
            let titleText;
            let subText;
            let borderColor;
            let href: string | null = null;

            if (isSettlement) {
              icon = <CheckCircle2 className="w-5 h-5 text-brand" />;
              titleText = isPayer
                ? `You paid ${truncateAddress(activity.creditor)}`
                : `${truncateAddress(activity.debtor)} paid you`;
              subText = `${activity.date.toLocaleDateString()} • ${activity.amount} usdm`;
              borderColor = "border-l-4 border-l-brand";
            } else if (isExpense) {
              icon = <PlusCircle className="w-5 h-5 text-blue-500" />;
              titleText = `Added to expense: ${activity.expenses?.description || 'Unknown'}`;
              subText = `${activity.date.toLocaleDateString()} • ${activity.amount} usdm`;
              borderColor = "border-l-4 border-l-blue-500";
            } else if (isGroupCreated) {
              icon = <Users className="w-5 h-5 text-purple-500" />;
              titleText = `Created group: ${activity.name}`;
              subText = `${activity.date.toLocaleDateString()}`;
              borderColor = "border-l-4 border-l-purple-500";
            } else if (isSavings) {
              const isGoal = activity.mode === 1;
              const value = Number(formatEther(isGoal ? activity.totalSaved : activity.currentPot));
              icon = <PiggyBank className="w-5 h-5 text-brand" />;
              titleText = `Savings circle: ${activity.name}`;
              subText = `${isGoal ? 'Goal-Based' : 'Rotating'} • ${activity.memberAddrs?.length || 0} members • ${formatAmount(value)}`;
              borderColor = "border-l-4 border-l-brand";
              href = `/app/save/${activity.id}`;
            } else if (isNotification) {
              icon = <Bell className="w-5 h-5 text-yellow-500" />;
              titleText = activity.title || 'Notification';
              subText = `${activity.date.toLocaleDateString()}${activity.body ? ` • ${activity.body}` : ''}`;
              borderColor = activity.is_read ? "border-l-4 border-l-border" : "border-l-4 border-l-yellow-500";
              href = activity.action_url || null;
            } else {
              icon = <UserPlus className="w-5 h-5 text-green-500" />;
              titleText = `Joined group: ${activity.groups?.name || 'Unknown'}`;
              subText = `${activity.date.toLocaleDateString()}`;
              borderColor = "border-l-4 border-l-green-500";
            }

            const cardBody = (
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold truncate">{titleText}</h4>
                    <p className="text-[10px] text-text-muted truncate">{subText}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {activity.onchain_tx && (
                    <a
                      href={`https://celoscan.io/tx/${activity.onchain_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-surface-2 rounded-lg transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4 text-text-muted" />
                    </a>
                  )}
                  {(isSettlement || isExpense) && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteActivity(activity); }}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              </>
            );

            const cardClass = `flex items-center justify-between p-4 ${borderColor}`;

            return href ? (
              <Link key={activity.localId} href={href} className="block">
                <Card className={`${cardClass} hover:border-brand-dark transition-all`}>{cardBody}</Card>
              </Link>
            ) : (
              <Card key={activity.localId} className={cardClass}>{cardBody}</Card>
            );
          })
        ) : (
          <div className="text-center py-12 text-text-muted">
            No activity found.
          </div>
        )}
      </div>
    </div>
  );
}
