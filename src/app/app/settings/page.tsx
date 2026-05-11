"use client";

import React from 'react';
import { AppHeader } from '@/components/app/AppHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useWallet } from '@/context/WalletContext';
import { LogOut, Shield, Github, MessageSquare } from 'lucide-react';

export default function SettingsPage() {
  const { address, disconnect, isMiniPay } = useWallet();

  return (
    <>
      <AppHeader title="Settings" />
      
      <div className="px-4 pt-20 pb-12 space-y-8 animate-fade-in">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">Account</h3>
          <Card className="divide-y divide-border p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Wallet Address</span>
                <span className="text-xs text-text-muted dm-mono truncate max-w-[200px]">{address}</span>
              </div>
              <Shield className="w-5 h-5 text-brand" />
            </div>
            
            {!isMiniPay && (
              <button 
                onClick={disconnect}
                className="w-full p-4 flex items-center gap-3 text-money-negative hover:bg-money-negative/5 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-semibold">Disconnect Wallet</span>
              </button>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">About Split</h3>
          <Card className="divide-y divide-border p-0 overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-surface-2 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-text-secondary" />
                <span className="text-sm font-medium">Open Source Code</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between hover:bg-surface-2 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-text-secondary" />
                <span className="text-sm font-medium">Support & Feedback</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center pt-8">
          <p className="text-[10px] dm-mono text-text-muted uppercase tracking-widest">
            Split Version 1.0.0<br />
            Built for Celo Proof of Ship
          </p>
        </div>
      </div>
    </>
  );
}
