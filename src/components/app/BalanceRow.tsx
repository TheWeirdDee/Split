"use client";

import React from 'react';
import { WalletAvatar } from '../common/WalletAvatar';
import { AmountDisplay } from '../common/AmountDisplay';
import { Button } from '../common/Button';
import { truncateAddress } from '@/lib/utils';
import Link from 'next/link';

interface BalanceRowProps {
  address: string;
  displayName?: string;
  amount: number;
  type: 'owe' | 'owed';
  groupId: string;
  onRemind?: () => void;
}

/**
 * One person's line in a group's balance list: avatar, name/address, the amount
 * (colored by direction), and a contextual action — "Pay" when you owe them,
 * "Remind" when they owe you.
 */
export const BalanceRow = ({ address, displayName, amount, type, groupId, onRemind }: BalanceRowProps) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <WalletAvatar address={address} size={40} />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-text-primary">
            {displayName || truncateAddress(address)}
          </span>
          <p className="text-xs text-text-secondary">
            {type === 'owe' ? 'You owe' : 'Owes you'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <AmountDisplay 
          amount={amount} 
          variant={type === 'owe' ? 'negative' : 'positive'} 
        />
        
        {type === 'owe' ? (
          <Link href={`/app/settle/${address}?groupId=${groupId}&amount=${amount}`}>
            <Button size="sm" variant="primary" className="h-8 px-4">
              Pay
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" className="h-8 px-4" onClick={onRemind}>
            Remind
          </Button>
        )}
      </div>
    </div>
  );
};
