import React from 'react';
import { cn, formatAmount } from '@/lib/utils';

interface AmountDisplayProps {
  amount: number | string;
  variant?: 'positive' | 'negative' | 'neutral' | 'settled';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AmountDisplay = ({
  amount,
  variant = 'neutral',
  size = 'md',
  className,
}: AmountDisplayProps) => {
  const colors = {
    positive: 'text-money-positive',
    negative: 'text-money-negative',
    neutral: 'text-text-primary',
    settled: 'text-text-muted',
  };

  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-4xl',
  };

  return (
    <div className={cn("dm-mono font-medium whitespace-nowrap", colors[variant], sizes[size], className)}>
      {variant === 'positive' && '+'}
      {variant === 'negative' && '-'}
      {formatAmount(Math.abs(Number(amount)))}
      <span className="text-[0.7em] ml-1 opacity-70">cUSD</span>
    </div>
  );
};
