"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { WalletBadge } from './WalletBadge';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export const AppHeader = ({ title = "Split", showBack = false }: AppHeaderProps) => {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 glass z-50 flex items-center justify-between px-4 max-w-[430px] mx-auto border-b border-border">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button onClick={() => router.back()} className="p-1 hover:bg-surface-2 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
        ) : (
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <span className="clash-display font-bold text-bg text-xl">S</span>
          </div>
        )}
        <h1 className="clash-display font-semibold text-lg truncate max-w-[150px]">
          {title}
        </h1>
      </div>
      
      <WalletBadge />
    </header>
  );
};
