"use client";

import React from 'react';
import Link from 'next/link';
import { Card } from '../common/Card';
import { AmountDisplay } from '../common/AmountDisplay';
import { useWallet } from '@/context/WalletContext';
import { useBalances } from '@/hooks/useBalances';
import { getUserNetBalance } from '@/lib/balanceEngine';
import { GroupIcon } from '../common/GroupIcon';
import { Zap } from 'lucide-react';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    emoji: string;
    group_members?: { wallet_address: string; display_name?: string }[];
    members?: { wallet_address: string; display_name?: string }[];
  };
}

export const GroupCard = ({ group }: GroupCardProps) => {
  const { address } = useWallet();
  const { balances, loading } = useBalances(group.id);
  
  const userAddr = address || 'local-user';
  const netBalance = getUserNetBalance(userAddr, balances);
  const variant = netBalance > 0 ? 'positive' : netBalance < 0 ? 'negative' : 'neutral';
  const memberCount = group.group_members?.length || group.members?.length || 0;

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
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
              {group.id.startsWith('local-') && (
                <span className="flex items-center gap-0.5 text-[#00C896] font-medium ml-1">
                  <span>·</span>
                  <Zap className="w-3 h-3 fill-brand/10" />
                  <span>Local</span>
                </span>
              )}
            </div>
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

