"use client";

import React from 'react';
import { Card } from '../common/Card';
import { AmountDisplay } from '../common/AmountDisplay';
import { CATEGORIES } from '@/constants/categories';
import { format } from 'date-fns';
import { useWallet } from '@/context/WalletContext';
import { truncateAddress } from '@/lib/utils';
import { GroupIcon } from '../common/GroupIcon';

interface ExpenseCardProps {
  expense: {
    id: string;
    description: string;
    category: string;
    total_amount: number;
    paid_by: string;
    created_at: string;
  };
  userShare: number;
}

export const ExpenseCard = ({ expense, userShare }: ExpenseCardProps) => {
  const { address } = useWallet();
  const category = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[CATEGORIES.length - 1];
  const isPayer = address?.toLowerCase() === expense.paid_by.toLowerCase();

  return (
    <Card className="flex items-center justify-between p-3" style={{ borderLeft: `4px solid ${category.color}` }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-2 rounded-lg flex items-center justify-center text-brand">
          <GroupIcon name={category.iconName} size={20} />
        </div>
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-text-primary">
            {expense.description}
          </h4>
          <p className="text-[10px] text-text-muted">
            Paid by {isPayer ? 'You' : truncateAddress(expense.paid_by)} • {new Date(expense.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <AmountDisplay amount={expense.total_amount} size="md" />
        <p className="text-[10px] text-text-secondary mt-0.5">
          Your share: <span className="dm-mono">{userShare.toFixed(2)}</span>
        </p>
      </div>
    </Card>
  );
};
