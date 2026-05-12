"use client";

import React, { useEffect, useState } from 'react';
import { AppHeader } from '@/components/app/AppHeader';
import { Card } from '@/components/common/Card';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { truncateAddress } from '@/lib/utils';
import { CheckCircle2, PlusCircle, UserPlus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ActivityPage() {
  const { address } = useWallet();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!address) return;
      
      const { data: setts, error: settError } = await supabase
        .from('settlements')
        .select('*')
        .or(`debtor.eq.${address.toLowerCase()},creditor.eq.${address.toLowerCase()}`)
        .order('settled_at', { ascending: false });

      const { data: splits, error: splitError } = await supabase
        .from('expense_splits')
        .select('*, expenses(*)')
        .eq('wallet_address', address.toLowerCase())
        .order('id', { ascending: false });

      const merged = [
        ...(setts || []).map((s: any) => ({ ...s, type: 'settlement', date: new Date(s.settled_at) })),
        ...(splits || []).map((s: any) => ({ ...s, type: 'expense', date: new Date(s.expenses.created_at) }))
      ].sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

      setActivities(merged);
      setLoading(false);
    };

    fetchActivity();
  }, [address]);

  return (
    <>
      <AppHeader />
      
      <div className="px-4 pt-20 pb-12 space-y-6">
        <h2 className="clash-display font-bold text-xl uppercase tracking-wider text-text-muted px-1">
          Recent Activity
        </h2>

        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-2 rounded-2xl animate-pulse" />)
          ) : activities.length > 0 ? (
            activities.map((act: any, i: number) => {
              const isSettlement = act.type === 'settlement';
              const isPayer = act.debtor === address?.toLowerCase();
              
              return (
                <Card key={i} className={cn(
                  "flex items-center justify-between p-4",
                  isSettlement ? "border-l-4 border-l-brand" : "border-l-4 border-l-blue-500"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center">
                      {isSettlement ? <CheckCircle2 className="w-5 h-5 text-brand" /> : <PlusCircle className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">
                        {isSettlement 
                          ? (isPayer ? `You paid ${truncateAddress(act.creditor)}` : `${truncateAddress(act.debtor)} paid you`)
                          : `Added to expense: ${act.expenses.description}`}
                      </h4>
                      <p className="text-[10px] text-text-muted">
                        {act.date.toLocaleDateString()} • {act.amount} cUSD
                      </p>
                    </div>
                  </div>
                  
                  {act.onchain_tx && (
                    <a 
                      href={`https://celoscan.io/tx/${act.onchain_tx}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-text-muted" />
                    </a>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 text-text-muted">
              No activity yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
