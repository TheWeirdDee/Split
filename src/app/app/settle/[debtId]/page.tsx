"use client";

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/app/AppHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { WalletAvatar } from '@/components/common/WalletAvatar';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { useWallet } from '@/context/WalletContext';
import { useSettle } from '@/hooks/useSettle';
import { truncateAddress } from '@/lib/utils';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

/** Settle-up flow (route `/app/settle/[debtId]`) for paying a specific debt. */
export default function SettlePage() {
  const { debtId: creditorAddress } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const groupId = searchParams.get('groupId');
  const amount = searchParams.get('amount');
  
  const wallet = useWallet();
  const { requireConnection } = wallet;
  const walletRef = React.useRef(wallet);
  
  React.useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const { address } = wallet;
  const { settle, loading: settleLoading, step } = useSettle();
  
  const [localStep, setLocalStep] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const displayStep = groupId?.startsWith('local-') ? (localStep || 'pending') : step;
  const displayLoading = groupId?.startsWith('local-') ? localLoading : settleLoading;

  // A settlement needs a positive amount; guard the action so an absent or
  // malformed `amount` query param can't trigger a no-op/failed payment.
  const parsedAmount = amount ? parseFloat(amount) : NaN;
  const hasValidAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleSettle = async () => {
    if (groupId?.startsWith('local-')) {
      if (!groupId || !creditorAddress || !amount) return;
      setLocalLoading(true);
      try {
        const newSettlement = {
          id: 'local-set-' + Date.now(),
          group_id: groupId,
          debtor: 'local-user', // debtor is always You offline
          creditor: (creditorAddress as string).toLowerCase(),
          amount: parseFloat(amount),
          created_at: new Date().toISOString()
        };
        const allSettlements = JSON.parse(localStorage.getItem('split_local_settlements') || '[]');
        localStorage.setItem('split_local_settlements', JSON.stringify([...allSettlements, newSettlement]));
        setLocalStep('confirmed');
      } catch (err) {
        console.error(err);
      } finally {
        setLocalLoading(false);
      }
      return;
    }

    const { address } = walletRef.current;
    if (!address || !groupId || !creditorAddress || !amount) return;
    try {
      await settle(groupId, creditorAddress as string, parseFloat(amount));
    } catch (err) {
      console.error(err);
    }
  };

  if (displayStep === 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 space-y-8 animate-fade-in text-center">
        <div className="w-24 h-24 bg-brand rounded-full flex items-center justify-center shadow-2xl shadow-brand/20">
          <CheckCircle2 className="w-12 h-12 text-bg" />
        </div>
        <div className="space-y-2">
          <h1 className="clash-display font-bold text-3xl">Settled!</h1>
          <p className="text-text-secondary">
            {groupId?.startsWith('local-') 
              ? 'Your payment has been logged locally offline.' 
              : 'Your payment has been confirmed on the Celo Mainnet.'}
          </p>
        </div>
        <AmountDisplay amount={amount || 0} size="xl" variant="positive" className="text-5xl" />
        <Button size="lg" className="w-full h-14 rounded-2xl" onClick={() => router.push(`/app/group/${groupId}`)}>
          Back to Group
        </Button>
      </div>
    );
  }

  const debtorAddr = groupId?.startsWith('local-') ? 'local-user' : (address || '');
  const displayCreditor = creditorAddress as string;

  return (
    <>
      <AppHeader />
      
      <div className="px-6 pt-24 space-y-12 animate-fade-in">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 w-full justify-center">
            <div className="flex flex-col items-center gap-2">
              <WalletAvatar address={debtorAddr} size={64} />
              <span className="text-xs text-text-muted font-medium">You</span>
            </div>
            
            <ArrowRight className="w-8 h-8 text-text-muted animate-pulse" />
            
            <div className="flex flex-col items-center gap-2">
              <WalletAvatar address={displayCreditor} size={64} />
              <span className="text-xs text-text-muted font-medium">
                {displayCreditor.startsWith('local-member-') ? displayCreditor.replace('local-member-', 'Member ') : truncateAddress(displayCreditor)}
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-brand uppercase tracking-widest">You are paying</span>
            <AmountDisplay amount={amount || 0} size="xl" className="text-6xl" />
          </div>
        </div>

        <Card className="bg-surface-2 p-6 space-y-4 border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Group</span>
            <span className="text-text-primary font-medium">
              {groupId?.startsWith('local-') ? 'Offline Local Group' : 'Group Expense'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Token</span>
            <span className="text-brand font-medium">cUSD (Celo)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Status</span>
            <span className="text-money-negative font-medium">
              {groupId?.startsWith('local-') ? 'Ready to log offline' : 'Pending Settlement'}
            </span>
          </div>
        </Card>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full h-16 text-lg font-bold rounded-2xl"
            onClick={() => groupId?.startsWith('local-') ? handleSettle() : requireConnection(handleSettle)}
            loading={displayLoading}
            disabled={displayLoading || !hasValidAmount}
          >
            {groupId?.startsWith('local-') 
              ? 'Confirm & Settle Offline' 
              : step === 'approving' 
                ? 'Approving cUSD...' 
                : step === 'sending' 
                  ? 'Sending Payment...' 
                  : 'Confirm & Pay'}
          </Button>
          
          <button 
            onClick={() => router.back()}
            className="w-full py-2 text-text-muted hover:text-text-secondary text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
