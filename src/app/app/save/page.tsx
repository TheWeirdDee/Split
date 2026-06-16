"use client";

import React from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/AppHeader';
import { useWallet } from '@/context/WalletContext';
import { useSavingsCircle } from '@/hooks/useSavingsCircle';
import { PiggyBank, Plus, TrendingUp, Calendar, Users, Target, RefreshCw } from 'lucide-react';
import { formatEther } from 'viem';

export default function SavePage() {
  const { isConnected } = useWallet();
  const { circles, loading, refreshCircles } = useSavingsCircle();

  return (
    <>
      <AppHeader />
      
      <div className="px-6 pt-24 pb-32 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="clash-display font-bold text-2xl text-text-primary">Savings Circles</h2>
            <p className="text-sm text-text-secondary">Save securely with friends onchain</p>
          </div>
          
          <button
            type="button"
            onClick={refreshCircles}
            aria-label="Refresh circles"
            className="p-2 border border-border rounded-xl text-text-secondary hover:text-text-primary transition-all hover:bg-surface"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-3xl bg-surface space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-dim flex items-center justify-center text-brand">
              <PiggyBank className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="clash-display font-bold text-lg">Connect your wallet</h3>
              <p className="text-sm text-text-secondary max-w-[280px]">
                Connect your wallet to see your active savings circles or create a new one.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : circles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-3xl bg-surface space-y-8 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-brand-dim flex items-center justify-center text-brand">
              <PiggyBank className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="clash-display font-bold text-lg">No savings circles yet</h3>
              <p className="text-sm text-text-secondary max-w-[280px]">
                Create a circle to start rotating weekly payouts or pooling funds for a shared goal.
              </p>
            </div>
            <Link href="/app/save/create" className="w-full">
              <button
                type="button"
                className="w-full h-12 bg-brand text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-dark transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Create a Circle
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {circles.map((circle: any) => {
              const contributionFormatted = Number(formatEther(circle.contributionAmount)).toFixed(2);
              const potFormatted = Number(formatEther(circle.currentPot)).toFixed(2);
              const totalSavedFormatted = Number(formatEther(circle.totalSaved)).toFixed(2);
              const isGoal = circle.mode === 1;

              return (
                <Link key={circle.id} href={`/app/save/${circle.id}`} className="block">
                  <div className="p-5 border border-border rounded-3xl bg-surface hover:border-brand-dark transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        isGoal ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-brand/10 text-brand border border-brand/20'
                      }`}>
                        {isGoal ? 'Goal-Based' : 'Rotating'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="clash-display font-bold text-lg text-text-primary group-hover:text-brand transition-colors">
                          {circle.name}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {circle.memberAddrs.length} members
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Cycle #{Number(circle.currentCycle) + 1}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            {isGoal ? 'Total Saved' : 'Current Pot'}
                          </span>
                          <div className="font-mono text-base font-bold text-brand flex items-baseline gap-1">
                            {isGoal ? totalSavedFormatted : potFormatted}
                            <span className="text-xs font-sans font-medium text-text-secondary">cUSD</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            Contribution
                          </span>
                          <div className="font-mono text-base font-bold text-text-primary flex items-baseline gap-1">
                            {contributionFormatted}
                            <span className="text-xs font-sans font-medium text-text-secondary">cUSD</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            <Link href="/app/save/create" className="block pt-2">
              <button
                type="button"
                className="w-full h-14 border border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary hover:border-brand transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span className="font-bold">Create New Circle</span>
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
