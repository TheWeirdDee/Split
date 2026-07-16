'use client';
import { useWallet } from '@/context/WalletContext';
import { useMiniPay } from '@/hooks/useMiniPay';
import React from 'react';
import Link from 'next/link';
import { useGroups } from '@/hooks/useGroups';
import { useUserBalance } from '@/hooks/useUserBalance';
import { useSavingsCircle } from '@/hooks/useSavingsCircle';
import { BalanceSummaryCard } from '@/components/app/BalanceSummaryCard';
import { GroupCard } from '@/components/app/GroupCard';
import { Button } from '@/components/common/Button';
import { DailyCheckIn } from '@/components/app/DailyCheckIn';
import { PiggyBank, AlertTriangle, Dices, ArrowRight } from 'lucide-react';
import { formatEther } from 'viem';
import { useCurrency } from '@/context/CurrencyContext';
import { useRecurringCheck } from '@/hooks/useRecurringCheck';
import { useProfile } from '@/hooks/useProfile';

/** Authenticated home dashboard (route `/app`): net balance, groups, check-in. */
export default function AppHome() {
  const { isInitialLoading, hasNoCelo } = useWallet();

  if (isInitialLoading) {
    return (
      <div
        role={'status'}
        aria-live={'polite'}
        style={{
          minHeight: 'calc(100vh - 136px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8A8A8A',
          fontSize: '12px',
          background: '#0D0D0D',
        }}
      >
        Loading Split...
      </div>
    );
  }

  return <DashboardContent hasNoCelo={hasNoCelo} />;
}

function DashboardContent({ hasNoCelo }: { hasNoCelo: boolean }) {
  const { isConnected, connect } = useWallet();
  const isMiniPay = useMiniPay();
  const { groups, loading: groupsLoading } = useGroups();
  const { circles, loading: circlesLoading } = useSavingsCircle();
  const { totalOwed, totalOwing } = useUserBalance();
  const { formatAmount } = useCurrency();
  const { profile } = useProfile();

  const groupIds = React.useMemo(() => groups.map((g) => g.id), [groups]);
  const { pendingRuns } = useRecurringCheck(groupIds, isConnected);

  const trustScore = profile?.trust_score ?? 680;
  let scoreBadge = 'Good Splitter 👥';
  if (trustScore >= 800) scoreBadge = 'Savings Legend 🏆';
  else if (trustScore >= 650) scoreBadge = 'Circle Anchor ⚓';
  else if (trustScore < 500) scoreBadge = 'Slow Settler 🐌';

  return (
    <div style={{ padding: '0 16px', paddingTop: '0px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {!isConnected && (
        <div className="p-4 border border-brand/20 rounded-2xl bg-brand/5 text-xs text-[#00C896] flex items-center justify-between animate-fade-in mt-4">
          <div className="pr-2 text-[11px] leading-relaxed">
            <strong>Wallet not connected:</strong> Connect your wallet to create savings circles, join groups, and settle expenses.
          </div>
          <Button
            onClick={() => connect()}
            size="sm"
            className="shrink-0 h-8 text-black bg-brand hover:bg-brand-dark text-[11px] font-bold px-3 rounded-lg"
          >
            Connect
          </Button>
        </div>
      )}

      {/* Pending recurring drafts banner */}
      {isConnected && pendingRuns.length > 0 && (
        <div className="p-4 border border-brand/20 rounded-2xl bg-brand/5 text-xs text-[#00C896] flex flex-col gap-3 animate-fade-in mt-4">
          <div className="flex items-start gap-2">
            <PiggyBank className="w-5 h-5 shrink-0 text-[#00C896]" />
            <div>
              <strong>Pending Recurring Drafts:</strong> You have {pendingRuns.length} recurring expense {pendingRuns.length === 1 ? 'draft' : 'drafts'} waiting to be logged.
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pendingRuns.map((run) => (
              <Link key={run.id} href={`/app/group/${run.group_id}/add?runId=${run.id}`} className="shrink-0">
                <div className="bg-[#161616] border border-[#2C2C2C] px-3 py-2 rounded-xl text-[10px] hover:border-[#00C896] transition-all flex flex-col gap-1">
                  <span className="font-semibold text-[#F7F3EC]">{run.recurring_expense_rules?.description || 'Recurring draft'}</span>
                  <span className="text-[#8A8A8A]">{run.recurring_expense_rules?.amount} usdm</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}


      {/* CELO native gas warning banner — only for regular wallets. MiniPay pays
          gas in usdm (feeCurrency) and holds no CELO, so the warning is wrong there. */}
      {isConnected && hasNoCelo && !isMiniPay && (
        <div className="p-4 border border-yellow-500/20 rounded-2xl bg-yellow-500/5 text-xs text-yellow-500 flex items-start gap-2 animate-fade-in mt-4">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <strong>CELO Native Gas Warning:</strong> You have 0 CELO for gas. You need a tiny amount of native CELO to submit onchain expense groups or savings circle contributions, or fund this address.
          </div>
        </div>
      )}

      {isConnected && (
        <div 
          style={{
            background: '#161616',
            border: '1px solid #2C2C2C',
            borderRadius: '24px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
          className="animate-fade-in"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#8A8A8A', fontWeight: 'bold' }} className="uppercase tracking-wider">
              Split Trust Score
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '22px', fontWeight: '800', color: '#F7F3EC' }}>
                {trustScore}
              </span>
              <span style={{ fontSize: '10px', color: '#8A8A8A' }}>/ 990 pts</span>
            </div>
          </div>
          <span 
            style={{
              fontSize: '10px',
              fontFamily: 'DM Sans, sans-serif',
              background: 'rgba(0, 200, 150, 0.08)',
              border: '1px solid rgba(0, 200, 150, 0.15)',
              padding: '4px 10px',
              borderRadius: '8px',
              color: '#00C896',
              fontWeight: 'bold',
            }}
          >
            {scoreBadge}
          </span>
        </div>
      )}

      <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <DailyCheckIn />
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <BalanceSummaryCard 
          totalOwed={totalOwed}
          totalOwing={totalOwing}
        />
      </div>

      {!groupsLoading && (
        <Link
          href={groups.length > 0 ? `/app/group/${groups[0].id}?tab=predictions` : '/app/create'}
          className={'block animate-fade-in'}
          style={{ animationDelay: '0.15s' }}
        >
          <div className={'relative overflow-hidden rounded-2xl border border-[#00C896]/25 bg-[#00C896]/[0.06] p-4'}>
            <div className={'absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#00C896]/10 blur-2xl'} />
            <div className={'relative flex items-center gap-3'}>
              <div className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00C896]/10 text-[#00C896]'}>
                <Dices className={'h-5 w-5'} />
              </div>
              <div className={'min-w-0 flex-1'}>
                <div className={'mb-1 flex items-center gap-2'}>
                  <span className={'text-[9px] font-bold uppercase tracking-[0.16em] text-[#00C896]'}>New game</span>
                  <span className={'rounded-full bg-[#00C896]/10 px-2 py-0.5 text-[8px] font-bold uppercase text-[#00C896]'}>Live</span>
                </div>
                <h2 className={'text-sm font-bold text-[#F7F3EC]'}>Group Bets</h2>
                <p className={'mt-0.5 text-[11px] leading-relaxed text-[#8A8A8A]'}>
                  Predict group outcomes and place social micro-bets in usdm.
                </p>
              </div>
              <div className={'flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#00C896]'}>
                <span>{groups.length > 0 ? 'Play' : 'Create group'}</span>
                <ArrowRight className={'h-3.5 w-3.5'} />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* GROUPS LIST */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between px-1">
          <h2 style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px', fontWeight: '600',
            color: '#4A4A4A', letterSpacing: '0.08em',
            textTransform: 'uppercase', margin: 0
          }}>
            Your Groups
          </h2>
        </div>

        <div className="space-y-3">
          {groupsLoading ? (
            [1, 2].map((i) => (
              <div key={i} className="h-20 bg-[#161616] rounded-2xl animate-pulse border border-[#2C2C2C]" />
            ))
          ) : groups.length > 0 ? (
            groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))
          ) : (
            <div className="text-center py-8 space-y-3 border border-dashed border-[#2C2C2C] rounded-2xl bg-[#161616]/20">
              <p className="text-[#8A8A8A] text-xs font-medium">No groups yet.</p>
              <Link href="/app/create">
                <Button variant="outline" size="sm">
                  Create first group
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* SAVINGS CIRCLES LIST */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center justify-between px-1">
          <h2 style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '12px', fontWeight: '600',
            color: '#4A4A4A', letterSpacing: '0.08em',
            textTransform: 'uppercase', margin: 0
          }}>
            {isConnected ? 'Your Savings Circles' : 'Savings Circles'}
          </h2>
          {isConnected && circles.length > 3 && (
            <Link href="/app/save" className="text-[11px] font-semibold text-[#00C896]">
              View all ({circles.length})
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {circlesLoading ? (
            [1, 2].map((i) => (
              <div key={i} className="h-20 bg-[#161616] rounded-2xl animate-pulse border border-[#2C2C2C]" />
            ))
          ) : circles.length > 0 ? (
            circles.slice(0, 3).map((circle) => (
              <Link key={circle.id} href={`/app/save/${circle.id}`} className="block">
                <div className="p-4 bg-[#161616] border border-[#2C2C2C] rounded-2xl hover:border-brand-dark transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-dim flex items-center justify-center text-brand">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm text-[#f5f0e8]">{circle.name}</h4>
                      <p className="text-[11px] text-[#8a8a8a]">{circle.memberAddrs.length} members · {circle.mode === 1 ? 'Goal-Based' : 'Rotating'}</p>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-brand">
                    {formatAmount(Number(formatEther(circle.mode === 1 ? circle.totalSaved : circle.currentPot)))}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 space-y-3 border border-dashed border-[#2C2C2C] rounded-2xl bg-[#161616]/20">
              <p className="text-[#8A8A8A] text-xs font-medium">No active circles yet.</p>
              <Link href="/app/save/create">
                <Button variant="outline" size="sm">
                  Create first circle
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Link href="/app/create" className="block animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div style={{
          background: 'rgba(0,200,150,0.05)',
          border: '1px dashed #00C896',
          borderRadius: '2px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxSizing: 'border-box'
        }}>
          <span style={{ color: '#00C896', fontSize: '24px', fontWeight: '700' }}>+</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: '700', fontSize: '18px', color: '#00C896' }}>
            Create New Group
          </span>
        </div>
      </Link>
    </div>
  );
}
