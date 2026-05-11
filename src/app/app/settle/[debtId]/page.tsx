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

export default function SettlePage() {
  const { debtId: creditorAddress } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const groupId = searchParams.get('groupId');
  const amount = searchParams.get('amount');
  
  const { address } = useWallet();
  const { settle, loading, step } = useSettle();

  const handleSettle = async () => {
    if (!groupId || !creditorAddress || !amount) return;
    try {
      await settle(groupId, creditorAddress as string, parseFloat(amount));
    } catch (err) {
      console.error(err);
    }
  };

  if (step === 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 space-y-8 animate-fade-in text-center">
        <div className="w-24 h-24 bg-brand rounded-full flex items-center justify-center shadow-2xl shadow-brand/20">
          <CheckCircle2 className="w-12 h-12 text-bg" />
        </div>
        <div className="space-y-2">
          <h1 className="clash-display font-bold text-3xl">Settled!</h1>
          <p className="text-text-secondary">Your payment has been confirmed on the Celo Mainnet.</p>
        </div>
        <AmountDisplay amount={amount || 0} size="xl" variant="positive" className="text-5xl" />
        <Button size="lg" className="w-full h-14 rounded-2xl" onClick={() => router.push(`/app/group/${groupId}`)}>
          Back to Group
        </Button>
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Settle Debt" showBack />
      
      <div className="px-6 pt-24 space-y-12 animate-fade-in">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 w-full justify-center">
            <div className="flex flex-col items-center gap-2">
              <WalletAvatar address={address || ''} size={64} />
              <span className="text-xs text-text-muted font-medium">You</span>
            </div>
            
            <ArrowRight className="w-8 h-8 text-text-muted animate-pulse" />
            
            <div className="flex flex-col items-center gap-2">
              <WalletAvatar address={creditorAddress as string} size={64} />
              <span className="text-xs text-text-muted font-medium">{truncateAddress(creditorAddress as string)}</span>
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
            <span className="text-text-primary font-medium">Group Expense</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Token</span>
            <span className="text-brand font-medium">cUSD (Celo)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Onchain Status</span>
            <span className="text-money-negative font-medium">Pending Settlement</span>
          </div>
        </Card>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full h-16 text-lg font-bold rounded-2xl"
            onClick={handleSettle}
            loading={loading}
          >
            {step === 'approving' ? 'Approving cUSD...' : step === 'sending' ? 'Sending Payment...' : 'Confirm & Pay'}
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
