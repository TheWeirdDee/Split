"use client";

import React from 'react';
import { BalanceRow } from '@/components/app/BalanceRow';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { CheckCircle2 } from 'lucide-react';

interface Balance {
  from: string;
  to: string;
  amount: number;
}

interface AuditDebt {
  expenseId: string;
  description: string;
  date: string;
  from: string;
  to: string;
  amount: number;
}

interface BalancesTabProps {
  isReadOnly: boolean;
  balances: Balance[];
  personalBalances: Balance[];
  oweBalances: Balance[];
  getMemberDisplayName: (walletAddress: string) => string;
  groupId: string;
  address?: string | null;
  requireConnection: (action: () => void) => void;
  handleSettleAll: () => void;
  settleAllLoading: boolean;
  handleRemind: (targetAddress: string, amount: number) => void;
  isAdding: boolean;
  setIsAdding: React.Dispatch<React.SetStateAction<boolean>>;
  manualAddress: string;
  setManualAddress: React.Dispatch<React.SetStateAction<string>>;
  newMemberName: string;
  setNewMemberName: React.Dispatch<React.SetStateAction<string>>;
  handleAddManual: () => void;
  showAudit: boolean;
  setShowAudit: React.Dispatch<React.SetStateAction<boolean>>;
  auditFilter: 'all' | 'my';
  setAuditFilter: React.Dispatch<React.SetStateAction<'all' | 'my'>>;
  filteredAuditDebts: AuditDebt[];
}

export function BalancesTab({
  isReadOnly,
  balances,
  personalBalances,
  oweBalances,
  getMemberDisplayName,
  groupId,
  address,
  requireConnection,
  handleSettleAll,
  settleAllLoading,
  handleRemind,
  isAdding,
  setIsAdding,
  manualAddress,
  setManualAddress,
  newMemberName,
  setNewMemberName,
  handleAddManual,
  showAudit,
  setShowAudit,
  auditFilter,
  setAuditFilter,
  filteredAuditDebts,
}: BalancesTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isReadOnly ? (
        <>
          {balances.length > 0 ? (
            <Card className="divide-y divide-[#2C2C2C] p-0 overflow-hidden bg-[#161616] border-[#2C2C2C]">
              {balances.map((balance, i) => (
                <div key={i} className="px-4">
                  <BalanceRow
                    address={balance.from}
                    displayName={`${getMemberDisplayName(balance.from)} → ${getMemberDisplayName(balance.to)}`}
                    amount={balance.amount}
                    type="owe"
                    groupId={groupId as string}
                  />
                </div>
              ))}
            </Card>
          ) : (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              border: '2px dashed #2C2C2C', borderRadius: '20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}>
              <CheckCircle2 style={{ width: '32px', height: '32px', color: '#4A4A4A' }} />
              <p style={{ color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Everyone is settled!</p>
            </div>
          )}
          <button
            onClick={() => requireConnection(() => {})}
            style={{
              width: '100%', padding: '14px',
              background: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)',
              borderRadius: '16px', color: '#00C896',
              fontFamily: 'DM Sans, sans-serif', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            Connect wallet to see your balance &amp; settle
          </button>
        </>
      ) : (
        <>
          {oweBalances.length > 0 && (
            <Button
              className="w-full"
              loading={settleAllLoading}
              onClick={() => requireConnection(handleSettleAll)}
            >
              Settle all debts
            </Button>
          )}

          {personalBalances.length > 0 ? (
            <Card className="divide-y divide-[#2C2C2C] p-0 overflow-hidden bg-[#161616] border-[#2C2C2C]">
              {personalBalances.map((balance, i) => {
                const isUserFrom = balance.from.toLowerCase() === address?.toLowerCase();
                return (
                  <div key={i} className="px-4">
                    <BalanceRow
                      address={isUserFrom ? balance.to : balance.from}
                      displayName={getMemberDisplayName(isUserFrom ? balance.to : balance.from)}
                      amount={balance.amount}
                      type={isUserFrom ? 'owe' : 'owed'}
                      groupId={groupId as string}
                      onRemind={!isUserFrom ? () => requireConnection(() => handleRemind(balance.from, balance.amount)) : undefined}
                    />
                  </div>
                );
              })}
            </Card>
          ) : (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              border: '2px dashed #2C2C2C', borderRadius: '20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}>
              <CheckCircle2 style={{ width: '32px', height: '32px', color: '#4A4A4A' }} />
              <p style={{ color: '#8A8A8A', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>Everyone is settled!</p>
            </div>
          )}

          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                width: '100%', padding: '14px',
                background: 'transparent', border: '1px dashed #2C2C2C',
                borderRadius: '16px', color: '#8A8A8A',
                fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              + Add Member by Address
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="0x... wallet address"
                style={{
                  width: '100%', height: '46px', background: '#161616',
                  border: '1px solid #2C2C2C', borderRadius: '12px',
                  padding: '0 14px', color: '#F7F3EC', fontSize: '14px', outline: 'none',
                  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
                }}
              />
              <input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Display name (optional)"
                style={{
                  width: '100%', height: '46px', background: '#161616',
                  border: '1px solid #2C2C2C', borderRadius: '12px',
                  padding: '0 14px', color: '#F7F3EC', fontSize: '14px', outline: 'none',
                  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="sm" onClick={() => groupId && (groupId as string).startsWith('local-') ? handleAddManual() : requireConnection(handleAddManual)} disabled={isAdding}>Add</Button>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '16px' }}>
        <button
          onClick={() => setShowAudit(!showAudit)}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(0, 200, 150, 0.05)',
            border: '1px solid rgba(0, 200, 150, 0.2)',
            borderRadius: '16px',
            color: '#00C896',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>{showAudit ? 'Hide' : 'Show'} Ledger Audit Breakdown</span>
        </button>

        {showAudit && (
          <Card className="mt-4 bg-[#161616] border-[#2C2C2C] p-4 text-[#F7F3EC]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="clash-display text-base font-semibold text-[#F7F3EC]">Ledger Audit Breakdown</h3>
              {!isReadOnly && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setAuditFilter('all')}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      auditFilter === 'all'
                        ? 'bg-[#00C896] text-[#000] border-[#00C896]'
                        : 'bg-transparent border-[#2C2C2C] text-[#8A8A8A]'
                    }`}
                  >
                    All Debts
                  </button>
                  <button
                    onClick={() => setAuditFilter('my')}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      auditFilter === 'my'
                        ? 'bg-[#00C896] text-[#000] border-[#00C896]'
                        : 'bg-transparent border-[#2C2C2C] text-[#8A8A8A]'
                    }`}
                  >
                    My Debts
                  </button>
                </div>
              )}
            </div>

            {filteredAuditDebts.length === 0 ? (
              <p style={{ color: '#8A8A8A', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>
                No items to audit in this category.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2C2C2C', textAlign: 'left', color: '#8A8A8A' }}>
                      <th style={{ padding: '8px 4px' }}>Item</th>
                      <th style={{ padding: '8px 4px' }}>From</th>
                      <th style={{ padding: '8px 4px' }}>To</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditDebts.map((debt, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(44, 44, 44, 0.5)' }}>
                        <td style={{ padding: '8px 4px' }}>
                          <div style={{ fontWeight: '500', color: '#F7F3EC' }}>{debt.description}</div>
                          <div style={{ fontSize: '10px', color: '#8A8A8A' }}>
                            {new Date(debt.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '8px 4px', color: '#8A8A8A' }}>
                          {getMemberDisplayName(debt.from)}
                        </td>
                        <td style={{ padding: '8px 4px', color: '#8A8A8A' }}>
                          {getMemberDisplayName(debt.to)}
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                          <AmountDisplay amount={debt.amount} variant={debt.from === address?.toLowerCase() ? 'negative' : debt.to === address?.toLowerCase() ? 'positive' : 'neutral'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
