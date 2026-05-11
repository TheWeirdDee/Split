"use client";

import React from 'react';
import { Card } from '../common/Card';
import { AmountDisplay } from '../common/AmountDisplay';

interface BalanceSummaryCardProps {
  totalOwed: number;
  totalOwing: number;
}

export const BalanceSummaryCard = ({ totalOwed, totalOwing }: BalanceSummaryCardProps) => {
  const net = totalOwed - totalOwing;

  return (
    <Card className="bg-brand-dim border-brand/20 p-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <span className="text-xs font-medium text-brand uppercase tracking-widest">
          Your Net Balance
        </span>
        <AmountDisplay 
          amount={net} 
          variant={net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral'}
          size="xl"
          className="text-4xl"
        />
        
        <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-brand/10">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-secondary uppercase">You are owed</span>
            <AmountDisplay amount={totalOwed} variant="positive" size="sm" />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-text-secondary uppercase">You owe</span>
            <AmountDisplay amount={totalOwing} variant="negative" size="sm" />
          </div>
        </div>
      </div>
    </Card>
  );
};
