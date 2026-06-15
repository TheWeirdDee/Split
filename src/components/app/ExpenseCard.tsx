"use client";

import React from 'react';
import { Card } from '../common/Card';
import { AmountDisplay } from '../common/AmountDisplay';
import { CATEGORIES } from '@/constants/categories';
import { useWallet } from '@/context/WalletContext';
import { truncateAddress } from '@/lib/utils';
import { GroupIcon } from '../common/GroupIcon';
import { useCurrency } from '@/context/CurrencyContext';

interface ExpenseCardProps {
  expense: {
    id: string;
    description: string;
    category: string;
    total_amount: number;
    paid_by: string;
    created_at: string;
    status?: string;
    attachment_url?: string;
  };
  userShare: number;
}

/**
 * Single expense row: category accent, description, payer/date, optional receipt
 * thumbnail (opens a lightbox), the total amount, and the viewer's share. Shows
 * a "Reversed" marker for reversed expenses.
 */
export const ExpenseCard = ({ expense, userShare }: ExpenseCardProps) => {
  const { address } = useWallet();
  const { formatAmount } = useCurrency();
  const [showModal, setShowModal] = React.useState(false);
  const category = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[CATEGORIES.length - 1];
  const isPayer = address?.toLowerCase() === expense.paid_by.toLowerCase();

  return (
    <>
      <Card className="flex items-center justify-between p-3" style={{ borderLeft: `4px solid ${category.color}` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all animate-fade-in" style={{ color: category.color, backgroundColor: `${category.color}15` }}>
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
          {expense.attachment_url && (
            <div style={{ marginLeft: '8px', flexShrink: 0 }}>
              <img
                src={expense.attachment_url}
                alt="Receipt thumbnail"
                role="button"
                tabIndex={0}
                aria-label="View receipt"
                onClick={() => setShowModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowModal(true);
                  }
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1px solid #2C2C2C',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                className="hover:scale-105"
              />
            </div>
          )}
        </div>
        
        <div className="text-right">
          <AmountDisplay amount={expense.total_amount} size="md" />
          {expense.status === 'reversed' && (
            <p className="text-[10px] text-money-negative mt-0.5">Reversed</p>
          )}
          <p className="text-[10px] text-text-secondary mt-0.5">
            Your share: <span className="dm-mono font-medium text-text-primary">{formatAmount(userShare)}</span>
          </p>
        </div>
      </Card>

      {showModal && expense.attachment_url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Receipt image"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
            <img
              src={expense.attachment_url}
              alt="Receipt"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '16px',
                border: '2px solid #2C2C2C',
                objectFit: 'contain',
              }}
            />
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#F7F3EC',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
