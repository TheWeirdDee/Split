"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';

interface AmountDisplayProps {
  amount: number | string;
  variant?: 'positive' | 'negative' | 'neutral' | 'settled';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Renders a monetary value in the user's selected display currency with a
 * variant-driven color and sign (`+` for positive, `-` for negative). The
 * absolute value is formatted; the sign comes from `variant`, not the input.
 */
export const AmountDisplay = ({
  amount,
  variant = 'neutral',
  size = 'md',
  className,
}: AmountDisplayProps) => {
  const { formatAmount } = useCurrency();

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

  const amountNum = Math.abs(Number(amount));

  return (
    <div className={cn("dm-mono font-medium whitespace-nowrap", colors[variant], sizes[size], className)}>
      {variant === 'positive' && '+'}
      {variant === 'negative' && '-'}
      {formatAmount(amountNum)}
    </div>
  );
};
