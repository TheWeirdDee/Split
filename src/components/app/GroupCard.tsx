"use client";

import React from 'react';
import Link from 'next/link';
import { Card } from '../common/Card';
import { AmountDisplay } from '../common/AmountDisplay';
import { useWallet } from '@/context/WalletContext';
import { useBalances } from '@/hooks/useBalances';
import { getUserNetBalance } from '@/lib/balanceEngine';

import { GroupIcon } from '../common/GroupIcon';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    emoji: string;
    group_members: { wallet_address: string }[];
  };
}

export const GroupCard = ({ group }: GroupCardProps) => {
  const { address } = useWallet();
  const { balances, loading } = useBalances(group.id);
  
  const netBalance = address ? getUserNetBalance(address, balances) : 0;
  const variant = netBalance > 0 ? 'positive' : netBalance < 0 ? 'negative' : 'neutral';

  return (
    <Link href={`/app/group/${group.id}`}>
      <Card className="flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-transform">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-surface-2 rounded-xl flex items-center justify-center text-brand">
            <GroupIcon name={group.emoji} size={24} />
          </div>
          <div className="flex flex-col">
            <h3 className="clash-display font-semibold text-text-primary">
              {group.name}
            </h3>
            <p className="text-xs text-text-secondary">
              {group.group_members?.length || 0} members
            </p>
          </div>
        </div>
        
        {!loading && (
          <div className="text-right">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
              {netBalance > 0 ? 'Owed to you' : netBalance < 0 ? 'You owe' : 'Settled'}
            </p>
            <AmountDisplay 
              amount={netBalance} 
              variant={variant}
              className="text-base"
            />
          </div>
        )}
      </Card>
    </Link>
  );
};
