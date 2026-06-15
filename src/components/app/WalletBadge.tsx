"use client";

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { truncateAddress } from '@/lib/utils';
import { WalletAvatar } from '../common/WalletAvatar';
import { Button } from '../common/Button';

/**
 * Compact wallet indicator for headers: a "Connect" button when disconnected,
 * otherwise the avatar, truncated address, and cUSD balance.
 */
export const WalletBadge = () => {
  const { address, isConnected, cUSDBalance, connect } = useWallet();

  if (!isConnected) {
    return (
      <Button size="sm" onClick={connect}>
        Connect
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-full pl-1.5 pr-3 py-1">
      <WalletAvatar address={address || ''} size={24} />
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] text-text-muted dm-mono">
          {truncateAddress(address || '')}
        </span>
        <span className="text-xs text-brand dm-mono font-medium">
          {parseFloat(cUSDBalance).toFixed(2)} cUSD
        </span>
      </div>
    </div>
  );
};
