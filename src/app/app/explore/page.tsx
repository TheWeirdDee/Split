'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/context/WalletContext';
import { useSavingsCircle } from '@/hooks/useSavingsCircle';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/common/Button';
import { formatEther } from 'viem';
import {
  PiggyBank,
  Target,
  Users,
  ShieldCheck,
  Sparkles,
  Calculator,
  Plus,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';

// Consistent cover styling for goal cards (real circles carry no cover art on-chain).
const GOAL_COVER = 'linear-gradient(135deg, #00C896 0%, #0072ff 100%)';

export default function ExplorePage() {
  const router = useRouter();
  const { isConnected, connect, address } = useWallet();
  const { circles, loading } = useSavingsCircle();
  const { formatAmount } = useCurrency();
  const [filterMode, setFilterMode] = useState<'all' | 'goals' | 'rotating' | 'calculator'>('all');
  const [privateIds, setPrivateIds] = useState<Set<string>>(new Set());

  // Private circles are hidden from disconnected guests in the public directory.
  // Connected users still see everything they're allowed to onchain.
  useEffect(() => {
    if (isConnected) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from('circle_settings').select('circle_id').eq('is_public', false);
      if (active && data) setPrivateIds(new Set(data.map((r: any) => String(r.circle_id))));
    })();
    return () => { active = false; };
  }, [isConnected]);

  // --- Calculator State ---
  const [calcTotal, setCalcTotal] = useState('');
  const [calcDescription, setCalcDescription] = useState('');
  const [newPerson, setNewPerson] = useState('');
  const [people, setPeople] = useState<string[]>(['You', 'Alice', 'Bob']);
  const [paidBy, setPaidBy] = useState('You');
  const [calcSplitType, setCalcSplitType] = useState<'equal' | 'custom'>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [copiedCalc, setCopiedCalc] = useState(false);

  // Group circles into Community Goals (Goal = 1) and Rotating Circles (Rotating = 0).
  // Many on-chain circles fall back to the same overlay template, which used to
  // render dozens of identical-looking cards — so we keep only the first circle
  // per resolved title (one of each).
  const activeCircles = useMemo(() => {
    const base = circles.filter((c: any) => c.status === 0);
    // Guests don't see circles explicitly marked private.
    if (isConnected) return base;
    return base.filter((c: any) => !privateIds.has(String(c.id)));
  }, [circles, isConnected, privateIds]);

  const communityGoals = useMemo(() => {
    const seen = new Set<string>();
    return activeCircles
      .filter((c: any) => c.mode === 1)
      .map((c: any) => ({
        ...c,
        title: (c.name && c.name.trim()) ? c.name : `Savings Goal #${c.id}`,
      }))
      .filter((c: any) => {
        if (seen.has(c.title)) return false;
        seen.add(c.title);
        return true;
      });
  }, [activeCircles]);

  const rotatingCircles = useMemo(() => {
    const seen = new Set<string>();
    return activeCircles
      .filter((c: any) => c.mode === 0)
      .map((c: any) => ({
        ...c,
        title: (c.name && c.name.trim()) ? c.name : `Rotating Circle #${c.id}`,
      }))
      .filter((c: any) => {
        if (seen.has(c.title)) return false;
        seen.add(c.title);
        return true;
      });
  }, [activeCircles]);

  const handleJoin = (id: number) => {
    if (!isConnected) {
      connect();
      return;
    }
    router.push(`/app/save/${id}?join=true`);
  };

  // --- Calculator Logic ---
  const handleAddPerson = () => {
    const name = newPerson.trim();
    if (!name || people.includes(name)) return;
    setPeople([...people, name]);
    setNewPerson('');
  };

  const handleRemovePerson = (name: string) => {
    if (people.length <= 2) return; // Keep at least 2 people
    setPeople(people.filter(p => p !== name));
    if (paidBy === name) setPaidBy(people[0]);
  };

  const calculatorExpenses = useMemo(() => {
    const amount = parseFloat(calcTotal || '0');
    if (isNaN(amount) || amount <= 0 || people.length < 2) return [];

    if (calcSplitType === 'equal') {
      const share = amount / people.length;
      return people
        .filter(p => p !== paidBy)
        .map(p => ({ from: p, to: paidBy, amount: share }));
    } else {
      return people
        .filter(p => p !== paidBy)
        .map(p => ({
          from: p,
          to: paidBy,
          amount: parseFloat(customAmounts[p] || '0') || 0
        }));
    }
  }, [calcTotal, people, paidBy, calcSplitType, customAmounts]);

  const handleCopyCalc = () => {
    if (calculatorExpenses.length === 0) return;
    const desc = calcDescription.trim() ? ` for "${calcDescription}"` : '';
    let summaryText = `Split Details${desc}:\nTotal: ${calcTotal} usdm\nPaid by: ${paidBy}\n\n`;
    
    calculatorExpenses.forEach(exp => {
      summaryText += `* ${exp.from} owes ${exp.to}: ${exp.amount.toFixed(2)} usdm\n`;
    });

    summaryText += `\nSplit via Split app. Settle onchain at /app`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopiedCalc(true);
      setTimeout(() => setCopiedCalc(false), 2000);
    });
  };

  return (
    <div className="px-4 py-6 flex flex-col gap-6 bg-[#0D0D0D] min-h-screen">
      
      {/* --- Page Header --- */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#00C896] animate-pulse" />
          <span className="dm-mono text-[10px] text-[#00C896] tracking-[0.2em] font-bold uppercase">Explore Celo</span>
        </div>
        <h1 className="clash-display text-2xl font-bold text-[#f5f0e8] leading-tight">Public Directory & Utilities</h1>
        <p className="text-xs text-[#8A8A8A] leading-relaxed">
          Discover crowdfunding goals,Rotating Savings, or compute splits instantly offline using our wallet-free Split Calculator.
        </p>
        {isConnected && (
          <Link href="/app/save/create" className="block">
            <Button size="sm" className="bg-[#00C896] text-black font-bold text-[11px] h-9">
              <Plus className="w-4 h-4" />
              Create Your Circle
            </Button>
          </Link>
        )}
      </div>

      {/* --- Filter Tabs --- */}
      <div className="flex bg-[#161616] p-1 border border-[#2C2C2C] rounded-xl overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => setFilterMode('all')}
          className={`flex-1 px-3 py-2 text-[10px] sm:text-[11px] font-bold transition-all rounded-lg ${filterMode === 'all' ? 'bg-[#00C896] text-black shadow-lg' : 'text-[#8A8A8A] hover:text-[#f5f0e8]'}`}
        >
          All Circles
        </button>
        <button 
          onClick={() => setFilterMode('goals')}
          className={`flex-1 px-3 py-2 text-[10px] sm:text-[11px] font-bold transition-all rounded-lg ${filterMode === 'goals' ? 'bg-[#00C896] text-black shadow-lg' : 'text-[#8A8A8A] hover:text-[#f5f0e8]'}`}
        >
          Goals
        </button>
        <button 
          onClick={() => setFilterMode('rotating')}
          className={`flex-1 px-3 py-2 text-[10px] sm:text-[11px] font-bold transition-all rounded-lg ${filterMode === 'rotating' ? 'bg-[#00C896] text-black shadow-lg' : 'text-[#8A8A8A] hover:text-[#f5f0e8]'}`}
        >
          Rotating
        </button>
        <button 
          onClick={() => setFilterMode('calculator')}
          className={`flex-1 px-3 py-2 text-[10px] sm:text-[11px] font-bold transition-all rounded-lg ${filterMode === 'calculator' ? 'bg-[#00C896] text-black shadow-lg' : 'text-[#8A8A8A] hover:text-[#f5f0e8]'}`}
        >
          <span className="flex items-center justify-center gap-1">
            <Calculator className="w-3.5 h-3.5" />
            Calculator
          </span>
        </button>
      </div>

      {/* --- Calculator View --- */}
      {filterMode === 'calculator' ? (
        <div className="space-y-6 animate-fade-in">
          
          <div className="p-4 bg-[#161616] border border-[#2C2C2C] rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#8A8A8A] font-bold uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-[#00C896]" />
              <span>Offline Split Calculator</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1">Bill Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dinner with Friends" 
                  value={calcDescription}
                  onChange={(e) => setCalcDescription(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 py-2 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#00C896]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1">Total Amount (usdm)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={calcTotal}
                    onChange={(e) => setCalcTotal(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 py-2 text-xs text-[#00C896] font-mono focus:outline-none focus:border-[#00C896]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider block mb-1">Who Paid?</label>
                  <select 
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 py-2 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#00C896]"
                  >
                    {people.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* People Manager */}
          <div className="p-4 bg-[#161616] border border-[#2C2C2C] rounded-2xl space-y-4">
            <label className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider block">Group Members</label>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Name (e.g. Bob)" 
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                className="flex-1 bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-3 py-2 text-xs text-[#F7F3EC] focus:outline-none focus:border-[#00C896]"
              />
              <Button onClick={handleAddPerson} size="sm" className="h-9 px-3 bg-[#00C896] text-black">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {people.map(p => (
                <div key={p} className="flex items-center gap-1.5 bg-[#0D0D0D] border border-[#2C2C2C] pl-3 pr-2 py-1.5 rounded-full text-xs">
                  <span>{p}</span>
                  {p !== 'You' && people.length > 2 && (
                    <button onClick={() => handleRemovePerson(p)} className="text-red-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Split Mode */}
          <div className="p-4 bg-[#161616] border border-[#2C2C2C] rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider block">Split Strategy</label>
              <div className="flex bg-[#0D0D0D] border border-[#2C2C2C] p-0.5 rounded-lg">
                <button 
                  onClick={() => setCalcSplitType('equal')}
                  className={`px-3 py-1 rounded text-[10px] font-semibold transition-all ${calcSplitType === 'equal' ? 'bg-[#00C896] text-black' : 'text-[#8A8A8A]'}`}
                >
                  Equally
                </button>
                <button 
                  onClick={() => setCalcSplitType('custom')}
                  className={`px-3 py-1 rounded text-[10px] font-semibold transition-all ${calcSplitType === 'custom' ? 'bg-[#00C896] text-black' : 'text-[#8A8A8A]'}`}
                >
                  Custom
                </button>
              </div>
            </div>

            {calcSplitType === 'custom' && (
              <div className="space-y-2.5 animate-slide-down">
                {people.map(p => (
                  <div key={p} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-[#8A8A8A]">{p} owes:</span>
                    <div className="relative w-28">
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={customAmounts[p] || ''}
                        onChange={(e) => setCustomAmounts({ ...customAmounts, [p]: e.target.value })}
                        className="w-full bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl px-2 py-1.5 text-xs text-right pr-9 text-[#00C896] font-mono focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[9px] font-bold text-[#4A4A4A]">usdm</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Preview */}
          {calculatorExpenses.length > 0 && (
            <div className="space-y-4 animate-slide-down">
              <div className="p-4 bg-[#161616] border border-[#2C2C2C] rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#8A8A8A] uppercase tracking-wider">Calculated Debts</span>
                  <button 
                    onClick={handleCopyCalc}
                    className="flex items-center gap-1 text-[10px] text-[#00C896] bg-[#00C896]/5 border border-[#00C896]/10 px-2 py-1 rounded-lg hover:bg-[#00C896]/10"
                  >
                    {copiedCalc ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCalc ? 'Copied' : 'Copy Summary'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {calculatorExpenses.map((exp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl">
                      <span className="text-xs text-[#8A8A8A]">
                        <strong>{exp.from}</strong> owes <strong>{exp.to}</strong>
                      </span>
                      <span className="text-xs font-bold text-[#00C896] font-mono">{formatAmount(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Convert to Group prompt */}
              <div className="p-4 bg-brand-dim border border-brand/20 rounded-2xl text-center space-y-2.5">
                <p className="text-xs text-[#00C896]">Ready to settle this directly on the blockchain?</p>
                <Link href="/app/create">
                  <Button size="sm" className="bg-[#00C896] text-black font-bold text-[11px] h-9">
                    Create Onchain Group
                  </Button>
                </Link>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* --- Original Circles Feed --- */
        <>
          {/* Loader / Empty State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-[#161616] rounded-2xl animate-pulse border border-[#2C2C2C]" />
              ))}
            </div>
          ) : activeCircles.length === 0 ? (
            <div className="text-center py-12 space-y-3 border border-dashed border-[#2C2C2C] rounded-2xl bg-[#161616]/20">
              <PiggyBank className="w-10 h-10 mx-auto text-[#4A4A4A]" />
              <p className="text-[#8A8A8A] text-xs font-medium">No open savings circles found.</p>
              <Link href="/app/save/create">
                <Button size="sm">Create a Public Circle</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* --- Section 1: Community Goals --- */}
              {(filterMode === 'all' || filterMode === 'goals') && communityGoals.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-between px-1">
                    <div className="flex items-center gap-2 text-xs text-[#8A8A8A] font-bold uppercase tracking-wider">
                      <Target className="w-4 h-4 text-[#00C896]" />
                      <span>Public Crowdfunding Goals</span>
                    </div>
                    <span className="text-[10px] text-brand/60 dm-mono bg-brand/5 px-2 py-0.5 rounded-full border border-brand/10">{communityGoals.length} Active</span>
                  </div>
                  
                  <div className="space-y-4">
                    {communityGoals.map((c: any) => {
                      const savedEth = Number(formatEther(c.totalSaved));
                      const goalEth = c.config?.goalAmount ? Number(formatEther(c.config.goalAmount)) : 100;
                      const percent = Math.min(100, Math.round((savedEth / (goalEth || 1)) * 100));
                      
                      return (
                        <div 
                          key={c.id} 
                          className="bg-[#161616] border border-[#2C2C2C] rounded-2xl overflow-hidden hover:border-[#00C896]/40 transition-all flex flex-col group"
                        >
                          <div
                            style={{ background: GOAL_COVER }}
                            className="h-24 p-4 flex items-end relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="relative z-10 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                                <Target className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-bold text-base text-[#f5f0e8] drop-shadow-md">{c.title}</h3>
                            </div>
                          </div>

                          <div className="p-4 space-y-4">
                            <p className="text-xs text-[#8A8A8A] leading-relaxed">
                              Goal-based savings circle — members contribute toward a shared target on Celo.
                            </p>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-[#8A8A8A]">
                                <span>Progress ({percent}%)</span>
                                <span className="text-[#f5f0e8] font-mono">
                                  {formatAmount(savedEth)} / {formatAmount(goalEth)}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-[#2C2C2C] rounded-full overflow-hidden">
                                <div 
                                  style={{ width: `${percent}%` }}
                                  className="h-full bg-[#00C896] rounded-full transition-all duration-1000"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#2C2C2C]/60">
                              <div className="flex items-center gap-1.5 text-[11px] text-[#8A8A8A] font-medium">
                                <Users className="w-3.5 h-3.5" />
                                <span>{c.memberAddrs.length} contributors</span>
                              </div>

                              <div className="flex gap-2">
                                <Link href={`/app/save/${c.id}`}>
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]">
                                    Details
                                  </Button>
                                </Link>
                                <Button 
                                  onClick={() => handleJoin(c.id)}
                                  size="sm" 
                                  className="h-8 text-[11px] font-bold bg-[#00C896] text-black hover:bg-[#00a87f]"
                                >
                                  {c.memberAddrs.some((m: string) => m.toLowerCase() === address?.toLowerCase()) ? 'Contribute' : 'Join & Save'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- Section 2: Open Rotating Savings Circles --- */}
              {(filterMode === 'all' || filterMode === 'rotating') && rotatingCircles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-between px-1">
                    <div className="flex items-center gap-2 text-xs text-[#8A8A8A] font-bold uppercase tracking-wider">
                      <PiggyBank className="w-4 h-4 text-[#00C896]" />
                      <span>Open Rotating Savings (Ajo)</span>
                    </div>
                    <span className="text-[10px] text-brand/60 dm-mono bg-brand/5 px-2 py-0.5 rounded-full border border-brand/10">{rotatingCircles.length} Open</span>
                  </div>

                  <div className="space-y-4">
                    {rotatingCircles.map((c: any) => {
                      const contributionEth = Number(formatEther(c.contributionAmount));
                      const estimatedPayout = contributionEth * (c.memberAddrs.length || 1);
                      
                      return (
                        <div 
                          key={c.id} 
                          className="bg-[#161616] border border-[#2C2C2C] rounded-2xl p-4 hover:border-[#00C896]/40 transition-all flex flex-col gap-4 group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 border border-[#00C896]/20 flex items-center justify-center">
                                <PiggyBank className="w-5 h-5 text-[#00C896]" />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-[#f5f0e8] group-hover:text-[#00C896] transition-colors">{c.title}</h3>
                                <span className="text-[10px] font-mono text-[#8A8A8A]">circle #{c.id}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#00C896]" />
                              <span className="text-[10px] font-bold text-[#00C896]">Onchain</span>
                            </div>
                          </div>

                          <p className="text-xs text-[#8A8A8A] leading-relaxed">
                            Rotating savings (Ajo) — each cycle the full pot pays out to one member, on Celo.
                          </p>

                          <div className="grid grid-cols-2 gap-4 bg-[#0D0D0D] border border-[#2C2C2C]/60 p-3 rounded-xl">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-[#8A8A8A] block">CONTRIBUTION</span>
                              <span className="font-mono text-xs font-bold text-[#f5f0e8]">
                                {formatAmount(contributionEth)} <span className="text-[10px] font-sans text-[#8A8A8A]">/ cycle</span>
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-[#8A8A8A] block">EST. TOTAL PAYOUT</span>
                              <span className="font-mono text-xs font-bold text-[#00C896]">
                                {formatAmount(estimatedPayout)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-[#2C2C2C]/60 pt-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#8A8A8A] font-medium">
                              <Users className="w-3.5 h-3.5 text-[#8A8A8A]" />
                              <span>{c.memberAddrs.length} members enrolled</span>
                            </div>

                            <div className="flex gap-2">
                              <Link href={`/app/save/${c.id}`}>
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]">
                                    Details
                                  </Button>
                              </Link>
                              <Button 
                                onClick={() => handleJoin(c.id)}
                                size="sm" 
                                className="h-8 text-[11px] font-bold bg-[#00C896] text-black hover:bg-[#00a87f]"
                              >
                                {c.memberAddrs.some((m: string) => m.toLowerCase() === address?.toLowerCase()) ? 'Active' : 'Join Circle'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Explanatory CTA Card */}
          <div className="p-4 bg-[#161616] border border-[#2C2C2C] rounded-2xl space-y-3 relative overflow-hidden mt-2">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-dim/20 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-[#f5f0e8] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00C896]" />
                Trustless Rotating Savings
              </h4>
              <p className="text-[11px] text-[#8A8A8A] leading-relaxed">
                Rotating Savings (Ajo) is a time-tested peer saving mechanism. At each cycle, members contribute a fixed sum and the full pot is paid out to one of the members in sequence. All contracts are verified and secured on Celo.
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
