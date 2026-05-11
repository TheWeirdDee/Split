"use client";

import React from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useGroups } from '@/hooks/useGroups';
import { AppHeader } from '@/components/app/AppHeader';
import { BalanceSummaryCard } from '@/components/app/BalanceSummaryCard';
import { GroupCard } from '@/components/app/GroupCard';
import { Button } from '@/components/common/Button';
import { Plus, Wallet2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function AppPage() {
  const { isConnected, address, connect } = useWallet();
  const { groups, loading } = useGroups();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center space-y-8">
        <div className="w-20 h-20 bg-brand rounded-2xl flex items-center justify-center shadow-xl shadow-brand/20">
          <span className="clash-display font-bold text-bg text-4xl">S</span>
        </div>
        
        <div className="space-y-2">
          <h1 className="clash-display font-bold text-3xl">Welcome to Split</h1>
          <p className="text-text-secondary">
            Connect your wallet to start splitting bills and settling debts on Celo.
          </p>
        </div>

        <Button size="lg" onClick={connect} className="w-full h-14 rounded-2xl text-lg font-bold">
          <Wallet2 className="w-5 h-5 mr-2" />
          Connect Wallet
        </Button>

        <div className="pt-8 space-y-4">
          <p className="text-[10px] dm-mono text-text-muted uppercase tracking-widest">
            Scan to open in MiniPay
          </p>
          <div className="bg-white p-4 rounded-3xl inline-block shadow-lg">
            <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : 'https://split-five-eta.vercel.app'} size={120} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Split" />
      
      <div className="px-4 pt-20 space-y-8">
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <BalanceSummaryCard 
            totalOwed={0}
            totalOwing={0}
          />
        </div>

        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between px-1">
            <h2 className="clash-display font-bold text-xl uppercase tracking-wider text-text-muted">
              Your Groups
            </h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-surface-2 rounded-2xl animate-pulse border border-border" />
              ))
            ) : groups.length > 0 ? (
              groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))
            ) : (
              <div className="text-center py-12 space-y-4 border-2 border-dashed border-border rounded-2xl">
                <p className="text-text-muted">No groups yet.</p>
                <Link href="/app/create">
                  <Button variant="outline" size="sm">
                    Create your first group
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <Link href="/app/create" className="block animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-center gap-3 text-brand hover:bg-brand/5 border-dashed border-2 transition-all">
            <Plus className="w-6 h-6" />
            <span className="clash-display font-bold text-lg">Create New Group</span>
          </div>
        </Link>
      </div>
    </>
  );
}
