"use client";

import React, { useState } from 'react';
import { useBudgetChallenges } from '@/hooks/useBudgetChallenges';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { GroupIcon } from '@/components/common/GroupIcon';
import { CATEGORIES } from '@/constants/categories';
import type { Expense } from '@/types/models';
import {
  Target,
  Trophy,
  AlertTriangle,
  Plus,
  Clock,
  Sparkles,
  History,
  Calendar,
  X,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';

interface BudgetTabProps {
  groupId: string;
  expenses: Expense[];
  isReadOnly: boolean;
  requireConnection: (action: () => void) => void;
}

export function BudgetTab({ groupId, expenses, isReadOnly, requireConnection }: BudgetTabProps) {
  const { showToast } = useToast();
  const { challenges, loading, createChallenge, getChallengeDetails } = useBudgetChallenges(groupId, expenses);

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('all');
  const [duration, setDuration] = useState<number>(14); // default 14 days
  const [submitting, setSubmitting] = useState(false);

  const activeChallenges = challenges.filter((c) => {
    const details = getChallengeDetails(c);
    return details.status === 'active';
  });

  const historyChallenges = challenges.filter((c) => {
    const details = getChallengeDetails(c);
    return details.status !== 'active';
  });

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('Please enter a challenge name.', 'error');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid budget amount.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const ok = await createChallenge(name.trim(), parsedAmount, category, duration);
      if (ok) {
        showToast('Budget challenge started! 🚀', 'success');
        setIsCreating(false);
        setName('');
        setAmount('');
        setCategory('all');
        setDuration(14);
      } else {
        showToast('Failed to start challenge.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryInfo = (catId: string) => {
    if (catId === 'all') {
      return { label: 'All Categories', iconName: 'Layers', color: '#00C896' };
    }
    const cat = CATEGORIES.find((c) => c.id === catId);
    return cat ? { label: cat.label, iconName: cat.iconName, color: cat.color } : { label: 'Other', iconName: 'MoreHorizontal', color: '#636366' };
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#161616] border-[#2C2C2C] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500]">
            <Target className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-[#8A8A8A] font-bold uppercase tracking-wider block">Active Challenges</span>
            <span className="font-mono text-xl font-bold text-[#F7F3EC]">{activeChallenges.length}</span>
          </div>
        </Card>

        <Card className="bg-[#161616] border-[#2C2C2C] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center text-[#00C896]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#8A8A8A] font-bold uppercase tracking-wider block">Completed (Saved!)</span>
            <span className="font-mono text-xl font-bold text-[#00C896]">
              {historyChallenges.filter((c) => getChallengeDetails(c).status === 'completed').length}
            </span>
          </div>
        </Card>
      </div>

      {/* Action Button to trigger creation form */}
      {!isCreating && !isReadOnly && (
        <Button
          variant="outline"
          className="w-full border-dashed border-[#2C2C2C] hover:border-[#00C896] hover:text-[#00C896] h-12 flex items-center justify-center gap-2"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Start New Budget Challenge</span>
        </Button>
      )}

      {/* Creation Form */}
      {isCreating && (
        <Card className="bg-[#161616] border-[#2C2C2C] p-5 space-y-4 relative animate-fade-in">
          <button
            onClick={() => setIsCreating(false)}
            className="absolute top-4 right-4 text-[#8A8A8A] hover:text-[#F7F3EC] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="space-y-1">
            <h3 className="clash-display text-base font-bold text-[#F7F3EC] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#00C896]" />
              <span>Launch Budget Challenge</span>
            </h3>
            <p className="text-xs text-[#8A8A8A]">Define a spending limit to gamify your savings</p>
          </div>

          <div className="space-y-3">
            {/* Challenge Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A]">Challenge Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Food Cap, Weekend Trip Limit"
                className="w-full h-11 bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 text-sm text-[#F7F3EC] outline-none focus:border-[#00C896]"
              />
            </div>

            {/* Budget Limit Amount */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A]">Budget Limit (usdm)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 text-sm font-mono text-[#00C896] outline-none focus:border-[#00C896]"
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A]">Restricted Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 text-sm text-[#F7F3EC] outline-none focus:border-[#00C896] appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%238A8A8A' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <option value="all">All Categories 🌐</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Predefined Durations */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] block">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`h-10 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                      duration === d
                        ? 'border-[#00C896] text-[#00C896] bg-[#00C896]/5'
                        : 'border-[#2C2C2C] text-[#8A8A8A] bg-transparent hover:border-[#8A8A8A]'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{d} Days</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl mt-2 font-bold text-sm"
              loading={submitting}
              onClick={() => requireConnection(handleCreate)}
            >
              Start Challenge 🚀
            </Button>
          </div>
        </Card>
      )}

      {/* Active Challenges list */}
      <div className="space-y-3">
        <h3 className="clash-display text-sm font-bold text-[#F7F3EC] uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00C896]" />
          <span>Active Challenges</span>
        </h3>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-[#161616] border border-[#2C2C2C] rounded-3xl" />
            ))}
          </div>
        ) : activeChallenges.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[#2C2C2C] rounded-3xl flex flex-col items-center gap-2 bg-[#161616]/20">
            <Target className="w-8 h-8 text-[#4A4A4A]" />
            <p className="text-xs text-[#8A8A8A] font-medium">No active challenges. Set one to start tracking!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeChallenges.map((c) => {
              const details = getChallengeDetails(c);
              const catInfo = getCategoryInfo(c.category);
              
              // Progress Bar color styling based on percentage
              let barColor = '#00C896'; // Mint Green
              let textClass = 'text-[#00C896]';
              let bgGlow = 'rgba(0, 200, 150, 0.08)';

              if (details.percent >= 100) {
                barColor = '#FF5C5C'; // Red
                textClass = 'text-[#FF5C5C] font-bold animate-pulse';
                bgGlow = 'rgba(255, 92, 92, 0.08)';
              } else if (details.percent >= 75) {
                barColor = '#FF9500'; // Orange
                textClass = 'text-[#FF9500]';
                bgGlow = 'rgba(255, 149, 0, 0.08)';
              }

              return (
                <Card 
                  key={c.id} 
                  className="bg-[#161616] border-[#2C2C2C] p-5 space-y-4 relative overflow-hidden shadow-lg"
                >
                  {/* Category Accent background glow */}
                  <div 
                    style={{ background: bgGlow }} 
                    className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none" 
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#F7F3EC] text-base leading-tight">{c.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#8A8A8A]">
                        <span className="px-2 py-0.5 rounded-md bg-[#0D0D0D] border border-[#2C2C2C] flex items-center gap-1">
                          <span style={{ color: catInfo.color }} className="flex items-center">
                            <GroupIcon name={catInfo.iconName} size={12} />
                          </span>
                          <span>{catInfo.label}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-[#4A4A4A]" />
                          <span>Ends {new Date(c.end_date).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-[#8A8A8A] font-bold uppercase tracking-wider">LIMIT</span>
                      <AmountDisplay amount={c.amount} variant="neutral" size="sm" className="font-mono text-[#F7F3EC] font-extrabold" />
                    </div>
                  </div>

                  {/* Spending Progress details */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <span className="text-[#8A8A8A]">Spent:</span>
                        <span className="font-mono text-[#F7F3EC] font-bold">{details.spent.toFixed(2)} usdm</span>
                      </div>
                      <span className={`font-mono text-sm ${textClass}`}>
                        {details.percent}%
                      </span>
                    </div>

                    {/* Progress slider bar container */}
                    <div className="w-full bg-[#0D0D0D] h-2.5 rounded-full overflow-hidden border border-[#2C2C2C]/50">
                      <div 
                        style={{ 
                          width: `${details.percent}%`,
                          backgroundColor: barColor 
                        }} 
                        className="h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Status footer banner */}
                  <div className="flex items-center justify-between text-xs border-t border-[#2C2C2C]/50 pt-3">
                    <span className="text-[#8A8A8A] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#4A4A4A]" />
                      <span>{details.daysLeft} {details.daysLeft === 1 ? 'day' : 'days'} remaining</span>
                    </span>

                    {details.status === 'exceeded' ? (
                      <span className="text-[#FF5C5C] font-semibold flex items-center gap-1 bg-[#FF5C5C]/10 border border-[#FF5C5C]/20 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3 text-[#FF5C5C]" />
                        <span>Limit Exceeded</span>
                      </span>
                    ) : (
                      <span className="text-[#00C896] font-semibold flex items-center gap-1 bg-[#00C896]/10 border border-[#00C896]/20 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                        <span>On Track 🏃‍♂️</span>
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget History List */}
      {historyChallenges.length > 0 && (
        <div className="space-y-3">
          <h3 className="clash-display text-sm font-bold text-[#F7F3EC] uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-[#8A8A8A]" />
            <span>Budget History</span>
          </h3>

          <Card className="divide-y divide-[#2C2C2C] p-0 overflow-hidden bg-[#161616] border-[#2C2C2C]">
            {historyChallenges.map((c) => {
              const details = getChallengeDetails(c);
              const catInfo = getCategoryInfo(c.category);
              const isSuccess = details.status === 'completed';

              return (
                <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ background: isSuccess ? 'rgba(0, 200, 150, 0.1)' : 'rgba(255, 92, 92, 0.1)' }} 
                      className="w-10 h-10 rounded-xl border border-[#2C2C2C] flex items-center justify-center"
                    >
                      {isSuccess ? (
                        <Trophy className="w-5 h-5 text-[#00C896]" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-[#FF5C5C]" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-sm font-medium text-[#F7F3EC] block">{c.name}</span>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8A8A8A]">
                        <span className="flex items-center gap-0.5">
                          <span style={{ color: catInfo.color }} className="flex items-center">
                            <GroupIcon name={catInfo.iconName} size={11} />
                          </span>
                          <span>{catInfo.label}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(c.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className={`text-xs block font-bold ${isSuccess ? 'text-[#00C896]' : 'text-[#FF5C5C]'}`}>
                      {isSuccess ? 'SUCCESS 🎯' : 'EXCEEDED ❌'}
                    </span>
                    <span className="text-[10px] text-[#8A8A8A]">
                      Spent {details.spent.toFixed(1)} / {c.amount.toFixed(0)} usdm
                    </span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
