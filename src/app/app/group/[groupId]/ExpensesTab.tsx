"use client";

import React from 'react';
import { ExpenseCard } from '@/components/app/ExpenseCard';
import { Button } from '@/components/common/Button';
import { Search, Download, Edit3, RotateCcw } from 'lucide-react';
import { CATEGORIES } from '@/constants/categories';

interface ExpensesTabProps {
  expenseSearch: string;
  setExpenseSearch: React.Dispatch<React.SetStateAction<string>>;
  expenseCategory: string;
  setExpenseCategory: React.Dispatch<React.SetStateAction<string>>;
  handleExportExpenses: () => void;
  expensesLoading: boolean;
  filteredExpenses: any[];
  splits: any[];
  address?: string | null;
  isReadOnly: boolean;
  requireConnection: (action: () => void) => void;
  handleEditExpense: (expense: any) => void;
  handleReverseExpense: (expense: any) => void;
}

export function ExpensesTab({
  expenseSearch,
  setExpenseSearch,
  expenseCategory,
  setExpenseCategory,
  handleExportExpenses,
  expensesLoading,
  filteredExpenses,
  splits,
  address,
  isReadOnly,
  requireConnection,
  handleEditExpense,
  handleReverseExpense,
}: ExpensesTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="rounded-2xl border border-[#2C2C2C] bg-[#121212] p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-[#8A8A8A]" />
          <input
            value={expenseSearch}
            onChange={(e) => setExpenseSearch(e.target.value)}
            placeholder="Search expenses"
            className="w-full bg-transparent text-sm text-[#F7F3EC] outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={expenseCategory}
            onChange={(e) => setExpenseCategory(e.target.value)}
            className="flex-1 bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 py-2 text-xs text-[#F7F3EC]"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={handleExportExpenses}>
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      {expensesLoading ? (
        [1, 2, 3].map((i) => (
          <div key={i} style={{ height: '72px', background: '#161616', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
        ))
      ) : filteredExpenses.length > 0 ? (
        filteredExpenses.map((expense) => {
          const userSplit = splits.find(
            (s) => s.expense_id === expense.id && s.wallet_address.toLowerCase() === address?.toLowerCase()
          );
          return (
            <div key={expense.id} className="space-y-2">
              <ExpenseCard
                expense={expense}
                userShare={userSplit ? parseFloat(userSplit.amount) : 0}
              />
              {!isReadOnly && (
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => requireConnection(() => handleEditExpense(expense))}>
                    <Edit3 size={12} />
                    Edit
                  </Button>
                  {(expense.status || 'active') !== 'reversed' && (
                    <Button size="sm" variant="danger" onClick={() => requireConnection(() => handleReverseExpense(expense))}>
                      <RotateCcw size={12} />
                      Reverse
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div style={{
          textAlign: 'center', padding: '48px 24px', color: '#8A8A8A',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          No expenses found.
        </div>
      )}
    </div>
  );
}
