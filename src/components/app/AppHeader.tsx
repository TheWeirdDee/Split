"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronLeft } from 'lucide-react';
import { Logo } from '../common/Logo';
import { WalletBadge } from './WalletBadge';
import { useWallet } from '@/context/WalletContext';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export const AppHeader = ({ title, showBack = false }: AppHeaderProps) => {
  const router = useRouter();
  const { disconnect } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center px-4 max-w-[430px] mx-auto border-b border-border/50">
      <div className="flex items-center justify-between w-full">
        {/* Left Side: Back + Logo */}
        <div className="flex items-center gap-2">
          {showBack && (
            <button 
              onClick={() => router.back()} 
              className="p-1.5 hover:bg-surface-2 rounded-lg transition-all active:scale-90 flex items-center group"
            >
              <ChevronLeft className="w-5 h-5 text-text-primary group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}
          <Logo showText={false} className="scale-90" />
        </div>

        {/* Middle: Title or Wallet */}
        <div className="flex-1 flex justify-center px-4">
          {title ? (
            <h1 className="clash-display font-bold text-sm truncate max-w-[120px] tracking-tight uppercase text-text-muted">
              {title}
            </h1>
          ) : (
            <div className="scale-95">
              <WalletBadge />
            </div>
          )}
        </div>

        {/* Right Side: Logout or Wallet if title is present */}
        <div className="flex items-center justify-end min-w-[40px] gap-2">
          {title ? (
            <div className="scale-75 origin-right">
              <WalletBadge />
            </div>
          ) : (
            <button 
              onClick={disconnect}
              className="p-2.5 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-text-muted group-hover:text-red-500 transition-colors" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
