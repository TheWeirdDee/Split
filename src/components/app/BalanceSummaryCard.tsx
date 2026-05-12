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
    <div className="bg-[#0c1a16] border border-[#00c89633] rounded-3xl p-6 relative overflow-hidden">
      <div className="flex flex-col items-center text-center space-y-2">
        <span className="dm-mono text-[9px] text-[#00c896] tracking-[0.2em] font-bold uppercase block mb-3">
          Your Net Balance
        </span>
        <div className="flex items-baseline justify-center gap-2 mb-4">
          <span className="clash-display font-bold text-5xl text-[#f5f0e8]">
            {net.toFixed(2)}
          </span>
          <span className="dm-mono text-lg text-[#7a7a7a]">cUSD</span>
        </div>
        
        <div className="w-full h-[1px] bg-[#00c8961a] mb-6"></div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="text-center">
            <span className="dm-mono text-[8px] text-[#7a7a7a] uppercase block mb-1">You are owed</span>
            <span className="dm-sans font-bold text-[#00c896] text-sm">+{totalOwed.toFixed(2)} <span className="text-[9px] opacity-60">cUSD</span></span>
          </div>
          <div className="text-center border-l border-[#00c8961a]">
            <span className="dm-mono text-[8px] text-[#7a7a7a] uppercase block mb-1">You owe</span>
            <span className="dm-sans font-bold text-[#ff4b4b] text-sm">-{totalOwing.toFixed(2)} <span className="text-[9px] opacity-60">cUSD</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
