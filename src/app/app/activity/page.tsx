"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/common/Card';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { truncateAddress } from '@/lib/utils';
import { CheckCircle2, PlusCircle, UserPlus, ExternalLink, Trash2, MoreVertical, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ActivityPage() {
  const { address } = useWallet();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipedId, setSwipedId] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

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

      const { data: groupsCreated } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', address.toLowerCase());

      const { data: groupJoins } = await supabase
        .from('group_members')
        .select('*, groups(*)')
        .eq('wallet_address', address.toLowerCase());

      const merged = [
        ...(setts || []).map((s: any, idx) => ({ ...s, type: 'settlement', date: new Date(s.settled_at), localId: `s-${idx}` })),
        ...(splits || []).map((s: any, idx) => ({ ...s, type: 'expense', date: new Date(s.expenses.created_at), localId: `e-${idx}` })),
        ...(groupsCreated || []).map((g: any, idx) => ({ ...g, type: 'group_created', date: new Date(g.created_at), localId: `gc-${idx}` })),
        ...(groupJoins || []).map((j: any, idx) => ({ ...j, type: 'group_joined', date: new Date(j.joined_at), localId: `gj-${idx}` }))
      ].sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

      setActivities(merged);
      setLoading(false);
    };

    fetchActivity();
  }, [address]);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent, index: number) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      // Swiped left
      setSwipedId(index);
    } else if (diff < -50) {
      // Swiped right
      setSwipedId(null);
    }
  };

  const handleDeleteActivity = async (index: number) => {
    const activity = activities[index];
    try {
      if (activity.type === 'settlement') {
        await supabase
          .from('settlements')
          .delete()
          .eq('id', activity.id);
      } else if (activity.type === 'expense') {
        await supabase
          .from('expense_splits')
          .delete()
          .eq('id', activity.id);
      } else {
        setActivities(activities.filter((_, i) => i !== index));
        setSwipedId(null);
        return;
      }
      
      setActivities(activities.filter((_, i) => i !== index));
      setSwipedId(null);
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === activities.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(activities.map((_, i) => i)));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const itemsToDelete = Array.from(selectedItems);
      
      for (const index of itemsToDelete.sort((a, b) => b - a)) {
        const activity = activities[index];
        if (activity.type === 'settlement') {
          await supabase
            .from('settlements')
            .delete()
            .eq('id', activity.id);
        } else if (activity.type === 'expense') {
          await supabase
            .from('expense_splits')
            .delete()
            .eq('id', activity.id);
        }
      }
      
      setActivities(activities.filter((_, i) => !selectedItems.has(i)));
      setSelectedItems(new Set());
      setSelectMode(false);
    } catch (error) {
      console.error('Error deleting selected activities:', error);
    }
  };

  const toggleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  return (
    <div className="px-4 pt-6 pb-12 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="clash-display font-bold text-xl uppercase tracking-wider text-text-muted px-1">
          Recent Activity
        </h2>
          
          {activities.length > 0 && (
            <div className="flex items-center gap-2">
              {selectMode && (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 text-xs font-medium text-brand hover:bg-surface-2 rounded"
                  >
                    {selectedItems.size === activities.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={() => setSelectMode(false)}
                    className="px-3 py-1 text-xs font-medium text-text-muted hover:bg-surface-2 rounded"
                  >
                    Cancel
                  </button>
                </>
              )}
              {!selectMode && (
                <button
                  onClick={() => setSelectMode(true)}
                  className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
                  title="Select multiple items"
                >
                  <MoreVertical className="w-4 h-4 text-text-muted" />
                </button>
              )}
            </div>
          )}
        </div>

        {selectMode && selectedItems.size > 0 && (
          <div className="flex items-center justify-between bg-surface-2 rounded-lg p-3 mb-4">
            <span className="text-sm text-text-muted">{selectedItems.size} selected</span>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-2 rounded-2xl animate-pulse" />)
          ) : activities.length > 0 ? (
            activities.map((act: any, i: number) => {
              const isSettlement = act.type === 'settlement';
              const isExpense = act.type === 'expense';
              const isGroupCreated = act.type === 'group_created';
              const isGroupJoined = act.type === 'group_joined';
              const isPayer = act.debtor === address?.toLowerCase();
              const isSelected = selectMode && selectedItems.has(i);
              
              let icon;
              let titleText;
              let subText;
              let borderColor;
              
              if (isSettlement) {
                icon = <CheckCircle2 className="w-5 h-5 text-brand" />;
                titleText = isPayer ? `You paid ${truncateAddress(act.creditor)}` : `${truncateAddress(act.debtor)} paid you`;
                subText = `${act.date.toLocaleDateString()} • ${act.amount} cUSD`;
                borderColor = "border-l-4 border-l-brand";
              } else if (isExpense) {
                icon = <PlusCircle className="w-5 h-5 text-blue-500" />;
                titleText = `Added to expense: ${act.expenses?.description || 'Unknown'}`;
                subText = `${act.date.toLocaleDateString()} • ${act.amount} cUSD`;
                borderColor = "border-l-4 border-l-blue-500";
              } else if (isGroupCreated) {
                icon = <Users className="w-5 h-5 text-purple-500" />;
                titleText = `Created group: ${act.name}`;
                subText = `${act.date.toLocaleDateString()}`;
                borderColor = "border-l-4 border-l-purple-500";
              } else {
                icon = <UserPlus className="w-5 h-5 text-green-500" />;
                titleText = `Joined group: ${act.groups?.name || 'Unknown'}`;
                subText = `${act.date.toLocaleDateString()}`;
                borderColor = "border-l-4 border-l-green-500";
              }
              
              return (
                <div
                  key={i}
                  className="relative"
                  onTouchStart={(e) => handleTouchStart(e, i)}
                  onTouchEnd={(e) => handleTouchEnd(e, i)}
                >
                  {/* Swipe-to-delete background */}
                  {(isSettlement || isExpense) && (
                    <div className="absolute inset-0 bg-red-500/20 rounded-2xl flex items-center justify-end pr-4">
                      {swipedId === i && (
                        <button
                          onClick={() => handleDeleteActivity(i)}
                          className="text-red-500 font-medium text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}

                  {/* Main card */}
                  <Card 
                    className={cn(
                      "flex items-center justify-between p-4 transition-transform duration-200",
                      borderColor,
                      swipedId === i && "translate-x-[-60px]",
                      isSelected && "bg-surface-2"
                    )}
                    onClick={() => selectMode && toggleSelectItem(i)}
                  >
                    {selectMode && (
                      <div className="flex-shrink-0 mr-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(i)}
                          className="w-4 h-4 rounded"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                        {icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">
                          {titleText}
                        </h4>
                        <p className="text-[10px] text-text-muted">
                          {subText}
                        </p>
                      </div>
                    </div>
                    
                    {!selectMode && act.onchain_tx && (
                      <a 
                        href={`https://celoscan.io/tx/${act.onchain_tx}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-surface-2 rounded-lg transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4 text-text-muted" />
                      </a>
                    )}
                  </Card>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-text-muted">
              No activity yet.
            </div>
          )}
        </div>
    </div>
  );
}
