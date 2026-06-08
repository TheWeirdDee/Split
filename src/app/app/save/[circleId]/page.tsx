"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { useWallet } from '@/context/WalletContext';
import { useSavingsCircle } from '@/hooks/useSavingsCircle';
import { Button } from '@/components/common/Button';
import { WalletAvatar } from '@/components/common/WalletAvatar';
import { 
  PiggyBank, Users, Calendar, Target, Clock, 
  UserPlus, CheckCircle2, AlertCircle, Sparkles, 
  Trash2, LogOut, ArrowUpRight, Copy, Check 
} from 'lucide-react';
import { formatEther } from 'viem';

export default function CircleDetailPage() {
  const { circleId } = useParams() as { circleId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const wallet = useWallet();
  const { requireConnection } = wallet;
  const { address, isConnected, connect } = wallet;
  const { 
    circle, members, loading, txLoading, 
    joinCircle, contribute, distribute, distributeGoal, 
    markMissed, exitCircle, dissolveCircle, refreshCircle 
  } = useSavingsCircle(circleId);

  const [copied, setCopied] = useState(false);
  const [refundConfirm, setRefundConfirm] = useState(false);
  const [dissolveConfirm, setDissolveConfirm] = useState(false);

  const isInvite = searchParams.get('invite') === 'true';

  const userAddress = address?.toLowerCase();
  const isMember = circle?.memberAddrs.some((m: string) => m.toLowerCase() === userAddress);
  const isCreator = circle?.creator.toLowerCase() === userAddress;

  const currentMember = members.find((m: any) => m.address.toLowerCase() === userAddress);
  const contributionDue = isMember && currentMember && !currentMember.hasContributedThisCycle && circle?.status === 0;

  // Next recipient calculation
  const [nextRecipient, setNextRecipient] = useState<string | null>(null);

  useEffect(() => {
    if (circle && members.length > 0 && circle.mode === 0) {
       
      const list = circle.memberAddrs;
      const idx = Number(circle.rotationIndex);
      let found: string | null = null;
      for (let i = 0; i < list.length; i++) {
        const candidate = list[(idx + i) % list.length];
        const mStatus = members.find((m: any) => m.address.toLowerCase() === candidate.toLowerCase());
        if (mStatus && mStatus.status === 0 && !mStatus.hasReceivedPayout) {
          found = candidate;
          break;
        }
      }
      setNextRecipient(found);
    }
  }, [circle, members]);

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/app/save/${circleId}?invite=true`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMemberStatusBadge = (m: any) => {
    if (m.status === 2) return <span className="text-[10px] text-red-400 font-bold uppercase">Removed</span>;
    if (m.status === 3) return <span className="text-[10px] text-text-muted font-bold uppercase">Exited</span>;
    if (m.hasContributedThisCycle) {
      return (
        <span className="flex items-center gap-1 text-[10px] text-brand font-bold uppercase">
          <CheckCircle2 className="w-3.5 h-3.5" /> Contributed
        </span>
      );
    }
    return <span className="text-[10px] text-yellow-500 font-bold uppercase">Pending</span>;
  };

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className="px-6 pt-24 pb-48 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Loading circle details onchain...</p>
        </div>
      </>
    );
  }

  if (!circle) {
    return (
      <>
        <AppHeader />
        <div className="px-6 pt-24 pb-48 flex flex-col items-center justify-center space-y-6 text-center">
          <AlertCircle className="w-16 h-16 text-money-negative" />
          <h3 className="clash-display font-bold text-xl">Circle Not Found</h3>
          <p className="text-sm text-text-secondary max-w-[280px]">
            This savings circle does not exist on the Celo blockchain.
          </p>
          <Link href="/app/save">
            <Button className="bg-surface border border-border text-text-primary px-6 h-12 rounded-2xl">
              Back to Circles
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const isGoal = circle.mode === 1;
  const contributionFormatted = Number(formatEther(circle.contributionAmount)).toFixed(2);
  const potFormatted = Number(formatEther(circle.currentPot)).toFixed(2);
  const totalSavedFormatted = Number(formatEther(circle.totalSaved)).toFixed(2);
  const goalAmountFormatted = isGoal ? Number(formatEther(circle.config?.goalAmount || circle.totalSaved)).toFixed(2) : '0';

  const statusText = circle.status === 0 ? 'Active' : circle.status === 1 ? 'Completed' : 'Dissolved';

  // Calculate goal percentage
  const goalPercent = isGoal && Number(goalAmountFormatted) > 0 
    ? Math.min(100, Math.floor((Number(totalSavedFormatted) / Number(goalAmountFormatted)) * 100))
    : 0;

  // Check if grace period is expired for anyone
  const nowSecs = Math.floor(Date.now() / 1000);
  const deadlinePassed = nowSecs > Number(circle.nextDeadline);

  return (
    <>
      <AppHeader />
      
      <div className="px-6 pt-24 pb-48 space-y-8 animate-fade-in">
        {/* HEADER SECTION */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
              isGoal ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-brand/10 text-brand border border-brand/20'
            }`}>
              {isGoal ? 'Goal-Based' : 'Rotating Payout'}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
              circle.status === 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-text-muted/10 text-text-muted border border-text-muted/20'
            }`}>
              {statusText}
            </span>
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="clash-display font-bold text-2xl text-text-primary">{circle.name}</h2>
              <p className="text-xs font-mono text-text-secondary flex items-center gap-1">
                Creator: <span className="text-text-primary">{circle.creator.slice(0, 6)}...{circle.creator.slice(-4)}</span>
              </p>
            </div>
            
            <button 
              type="button"
              onClick={handleCopyInvite}
              className="p-2 border border-border rounded-xl text-text-secondary hover:text-text-primary transition-all hover:bg-surface flex items-center gap-1.5 text-xs font-bold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-brand" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Invite
                </>
              )}
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-3xl bg-surface space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {isGoal ? 'Total Saved' : 'Current Pot'}
            </span>
            <div className="font-mono text-2xl font-bold text-brand flex items-baseline gap-1">
              {isGoal ? totalSavedFormatted : potFormatted}
              <span className="text-xs font-sans font-medium text-text-secondary">cUSD</span>
            </div>
          </div>
          <div className="p-4 border border-border rounded-3xl bg-surface space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Contribution size
            </span>
            <div className="font-mono text-2xl font-bold text-text-primary flex items-baseline gap-1">
              {contributionFormatted}
              <span className="text-xs font-sans font-medium text-text-secondary">cUSD</span>
            </div>
          </div>
        </div>

        {/* DETAILS SECTION */}
        {isGoal ? (
          // GOAL PROGRESS BAR
          <div className="p-5 border border-border rounded-3xl bg-surface space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold flex items-center gap-1 text-purple-400">
                <Target className="w-4 h-4" /> Goal Progress
              </span>
              <span className="font-mono text-text-secondary">{goalPercent}%</span>
            </div>

            <div className="h-3.5 w-full bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                style={{ width: `${goalPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-text-secondary font-mono">
              <div>Target: {goalAmountFormatted} cUSD</div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-yellow-500" />
                Due {new Date(Number(circle.nextDeadline) * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        ) : (
          // ROTATING NEXT RECIPIENT CARD
          <div className="p-5 border border-border rounded-3xl bg-surface space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold flex items-center gap-1.5 text-brand">
                <Sparkles className="w-4 h-4" /> Next Recipient
              </span>
              <span className="text-xs text-text-secondary flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-yellow-500" />
                Deadline: {new Date(Number(circle.nextDeadline) * 1000).toLocaleDateString()}
              </span>
            </div>

            {nextRecipient ? (
              <div className="flex items-center gap-3 p-3 bg-brand/5 border border-brand/10 rounded-2xl">
                <WalletAvatar address={nextRecipient} size={40} />
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-text-primary">
                    {nextRecipient.toLowerCase() === userAddress ? 'You (Payout)' : `${nextRecipient.slice(0, 6)}...${nextRecipient.slice(-4)}`}
                  </div>
                  <div className="text-xs text-text-secondary">
                    Will receive the next payout of {Number(circle.memberAddrs.length * Number(contributionFormatted))} cUSD
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 text-xs text-text-secondary border border-dashed border-border rounded-2xl">
                All members received their payouts this round.
              </div>
            )}
          </div>
        )}

        {/* NON-CONNECTED VIEW OR JOIN PROMPT */}
        {!isConnected ? (
          <div className="p-6 border border-border rounded-3xl bg-surface text-center space-y-4">
            <h3 className="font-bold clash-display">Join this Savings Circle</h3>
            <p className="text-xs text-text-secondary">
              Connect your wallet to join this circle, participate in the savings target, and contribute your share.
            </p>
            <Button
              className="w-full h-12 bg-brand text-black font-bold rounded-2xl cursor-pointer hover:bg-brand-dark"
              onClick={connect}
            >
              Connect Wallet to Join
            </Button>
          </div>
        ) : isInvite && !isMember && circle.status === 0 ? (
          <div className="p-6 border border-border rounded-3xl bg-surface text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-dim flex items-center justify-center mx-auto text-brand">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="font-bold clash-display text-lg">You are invited!</h3>
            <p className="text-xs text-text-secondary max-w-[280px] mx-auto">
              Join this circle to save {contributionFormatted} cUSD on a regular basis with this group.
            </p>
            <Button
              className="w-full h-12 bg-brand text-black font-bold rounded-2xl cursor-pointer hover:bg-brand-dark"
              onClick={() => requireConnection(joinCircle)}
              loading={txLoading}
            >
              Join Savings Circle
            </Button>
          </div>
        ) : null}

        {/* INTERACTIVE ACTIONS */}
        {isMember && circle.status === 0 && (
          <div className="space-y-4">
            {contributionDue && (
              <div className="p-5 border border-brand/20 rounded-3xl bg-brand/5 space-y-4 animate-pulse-slow">
                <div className="space-y-1">
                  <h3 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-brand" /> Contribution Required
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Your contribution of {contributionFormatted} cUSD is due for this cycle.
                  </p>
                </div>

                <Button
                  className="w-full h-12 bg-brand text-black font-bold rounded-2xl cursor-pointer hover:bg-brand-dark"
                  onClick={() => requireConnection(() => contribute(circle.contributionAmount))}
                  loading={txLoading}
                >
                  Contribute {contributionFormatted} cUSD
                </Button>
              </div>
            )}

            {/* Rotating Payout distribution trigger */}
            {!isGoal && members.every((m: any) => m.status !== 0 || m.hasContributedThisCycle) && (
              <div className="p-5 border border-brand/20 rounded-3xl bg-brand/5 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-text-primary text-sm">Payout Ready</h3>
                  <p className="text-xs text-text-secondary">
                    All active members contributed. Trigger onchain distribution to recipient.
                  </p>
                </div>

                <Button
                  className="w-full h-12 bg-brand text-black font-bold rounded-2xl cursor-pointer"
                  onClick={() => requireConnection(distribute)}
                  loading={txLoading}
                >
                  Distribute Pot Onchain
                </Button>
              </div>
            )}

            {/* Goal Payout trigger (creator only) */}
            {isGoal && isCreator && Number(totalSavedFormatted) >= Number(goalAmountFormatted) && (
              <div className="p-5 border border-purple-500/20 rounded-3xl bg-purple-500/5 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-text-primary text-sm">Goal Reached!</h3>
                  <p className="text-xs text-text-secondary">
                    Distribute the pooled funds equally among all active savers.
                  </p>
                </div>

                <Button
                  className="w-full h-12 bg-purple-500 text-white font-bold rounded-2xl cursor-pointer"
                  onClick={() => requireConnection(distributeGoal)}
                  loading={txLoading}
                >
                  Distribute Goal Pot
                </Button>
              </div>
            )}
          </div>
        )}

        {/* MEMBERS LIST */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Savers</h3>
          <div className="space-y-3">
            {members.map((m: any) => {
              const contributed = Number(formatEther(m.totalContributed)).toFixed(2);
              const isUser = m.address.toLowerCase() === userAddress;
              const isMemberCreator = m.address.toLowerCase() === circle.creator.toLowerCase();

              return (
                <div key={m.address} className="flex items-center justify-between p-4 border border-border rounded-2xl bg-surface">
                  <div className="flex items-center gap-3">
                    <WalletAvatar address={m.address} size={36} />
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        {isUser ? 'You' : `${m.address.slice(0, 6)}...${m.address.slice(-4)}`}
                        {isMemberCreator && <span className="text-[9px] bg-border px-1.5 py-0.5 rounded text-text-secondary font-medium">Creator</span>}
                      </div>
                      <div className="text-xs text-text-secondary font-mono">
                        Saved: {contributed} cUSD
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {getMemberStatusBadge(m)}
                    
                    {/* Mark missed action for other savers */}
                    {isMember && !isUser && !m.hasContributedThisCycle && deadlinePassed && m.status === 0 && (
                      <button
                        type="button"
                        onClick={() => requireConnection(() => markMissed(m.address))}
                        className="text-[10px] text-yellow-500 font-bold hover:underline cursor-pointer border border-yellow-500/20 px-2 py-0.5 rounded-md hover:bg-yellow-500/5 transition-all"
                      >
                        Mark Missed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER ACTIONS (EXIT & DISSOLVE) */}
        {isMember && circle.status === 0 && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            {/* View History Button */}
            <Link href={`/app/save/${circleId}/history`} className="block">
              <button
                type="button"
                className="w-full h-12 border border-border rounded-xl flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all cursor-pointer bg-surface/50"
              >
                <ArrowUpRight className="w-4 h-4" />
                View Onchain History & Logs
              </button>
            </Link>

            {/* Exit Circle Button */}
            {!isCreator && (
              <div className="space-y-2">
                {refundConfirm ? (
                  <div className="p-4 border border-yellow-500/20 rounded-2xl bg-yellow-500/5 space-y-3">
                    <div className="text-xs text-text-secondary">
                      Are you sure? Exiting will return your net contributed amount of{' '}
                      <span className="font-mono text-brand font-bold">{currentMember ? Number(formatEther(BigInt(currentMember.totalContributed) - BigInt(currentMember.totalReceived))).toFixed(2) : '0'} cUSD</span>.
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="w-1/2 h-10 bg-yellow-500 text-black text-xs font-bold rounded-xl cursor-pointer"
                        onClick={() => requireConnection(exitCircle)}
                        loading={txLoading}
                      >
                        Confirm Exit
                      </Button>
                      <Button
                        variant="outline"
                        className="w-1/2 h-10 border border-border text-xs font-bold rounded-xl cursor-pointer"
                        onClick={() => setRefundConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRefundConfirm(true)}
                    className="w-full py-3 text-sm text-money-negative hover:underline flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Exit Circle & Refund
                  </button>
                )}
              </div>
            )}

            {/* Dissolve Circle Button (creator only) */}
            {isCreator && (
              <div className="space-y-2">
                {dissolveConfirm ? (
                  <div className="p-4 border border-red-500/20 rounded-2xl bg-red-500/5 space-y-3">
                    <div className="text-xs text-text-secondary">
                      This will end the circle and return all remaining funds to active savers proportionally.
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="w-1/2 h-10 bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                        onClick={() => requireConnection(dissolveCircle)}
                        loading={txLoading}
                      >
                        Dissolve Circle
                      </Button>
                      <Button
                        variant="outline"
                        className="w-1/2 h-10 border border-border text-xs font-bold rounded-xl cursor-pointer"
                        onClick={() => setDissolveConfirm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDissolveConfirm(true)}
                    className="w-full py-3 text-sm text-red-500 hover:underline flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Dissolve Circle
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
