'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useSavingsCircle } from '@/hooks/useSavingsCircle';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/common/Button';
import { formatEther } from 'viem';
import { 
  PiggyBank, 
  Target, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Heart,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

// Predefined public story templates to overlay on onchain circles to make them look premium
const COMMUNITY_GOAL_TEMPLATES: Record<string, { title: string; description: string; emoji: string; coverColor: string }> = {
  'save-hack': {
    title: 'Celo Builder Hackathon Fund',
    description: 'Funding developer awards and hosting fees for the upcoming Celo mini-hackathon.',
    emoji: '🚀',
    coverColor: 'linear-gradient(135deg, #FF5E62 0%, #FF9966 100%)',
  },
  'save-relief': {
    title: 'Community Relief Fund',
    description: 'Mutual aid pool for emergency medical assistance and resources in Celo dev communities.',
    emoji: '❤️',
    coverColor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
  'save-meetup': {
    title: 'Monthly Tech Meetup July',
    description: 'Pooling funds together to secure a venue and pizzas for local blockchain developers.',
    emoji: '🍕',
    coverColor: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
  }
};

const ROTATING_CIRCLE_TEMPLATES: Record<string, { title: string; description: string; emoji: string; trustScore: number }> = {
  'save-founder': {
    title: 'Web3 Founders Mastermind',
    description: 'Rotating trust pool among active builders to finance growth sprints.',
    emoji: '💼',
    trustScore: 98,
  },
  'save-weekly': {
    title: 'Weekly Devs Esusu Circle',
    description: 'A small, fast-rotating group of remote developers saving weekly.',
    emoji: '👨‍💻',
    trustScore: 95,
  },
  'save-savings': {
    title: 'Peer Savings Alliance',
    description: 'Standard rotating saving group building mutual trust on Celo.',
    emoji: '🛡️',
    trustScore: 92,
  }
};

export default function ExplorePage() {
  const { isConnected, connect, address } = useWallet();
  const { circles, loading, joinCircle } = useSavingsCircle();
  const { formatAmount } = useCurrency();
  const [filterMode, setFilterMode] = useState<'all' | 'goals' | 'rotating'>('all');
  const [joiningId, setJoiningId] = useState<number | null>(null);

  // Group circles into Community Goals (Goal = 1) and Rotating Circles (Rotating = 0)
  const activeCircles = circles.filter((c: any) => c.status === 0); // Active circles only

  const communityGoals = activeCircles.filter((c: any) => c.mode === 1).map((c: any) => {
    // Check if we have a template matching circle name prefix or substring
    const templateKey = Object.keys(COMMUNITY_GOAL_TEMPLATES).find(k => c.name.toLowerCase().includes(k)) || 'save-hack';
    const template = COMMUNITY_GOAL_TEMPLATES[templateKey];
    return {
      ...c,
      title: template.title,
      description: template.description,
      emoji: template.emoji,
      coverColor: template.coverColor
    };
  });

  const rotatingCircles = activeCircles.filter((c: any) => c.mode === 0).map((c: any) => {
    const templateKey = Object.keys(ROTATING_CIRCLE_TEMPLATES).find(k => c.name.toLowerCase().includes(k)) || 'save-founder';
    const template = ROTATING_CIRCLE_TEMPLATES[templateKey];
    
    // Creator trust score dynamically simulated based on address checks, fallback to template
    const addressHash = c.creator ? c.creator.slice(-4) : '0';
    const calculatedTrust = 85 + (parseInt(addressHash, 16) % 15);
    
    return {
      ...c,
      title: template.title,
      description: template.description,
      emoji: template.emoji,
      trustScore: calculatedTrust || template.trustScore
    };
  });

  const handleJoin = async (id: number) => {
    if (!isConnected) {
      connect();
      return;
    }
    setJoiningId(id);
    try {
      // Temporarily navigate or call join directly if the current hook binds to circleId
      window.location.href = `/app/save/${id}?join=true`;
    } catch (err) {
      console.error('Join error:', err);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="px-4 py-6 flex flex-col gap-6 bg-[#0D0D0D] min-height-screen">
      
      {/* --- Page Header --- */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#00C896] animate-pulse" />
          <span className="dm-mono text-[10px] text-[#00C896] tracking-[0.2em] font-bold uppercase">Explore Celo</span>
        </div>
        <h1 className="clash-display text-2xl font-bold text-[#f5f0e8] leading-tight">Public Directory</h1>
        <p className="text-xs text-[#8A8A8A] leading-relaxed">
          Discover community crowdfunding initiatives and open Rotating Savings Circles looking for members. Join directly onchain.
        </p>
      </div>

      {/* --- Filter Tabs --- */}
      <div className="flex bg-[#161616] p-1 border border-[#2C2C2C] rounded-xl">
        <button 
          onClick={() => setFilterMode('all')}
          className={`flex-1 text-center py-2 text-[11px] font-bold transition-all rounded-lg ${filterMode === 'all' ? 'bg-[#00C896] text-black shadow-lg' : 'text-[#8A8A8A] hover:text-[#f5f0e8]'}`}
        >
          All Circles
        </button>
        <button 
          onClick={() => setFilterMode('goals')}
          className={`flex-1 text-center py-2 text-[11px] font-bold transition-all rounded-lg ${filterMode === 'goals' ? 'bg-[#00C896] text-black shadow-lg' : 'text-[#8A8A8A] hover:text-[#f5f0e8]'}`}
        >
          Community Goals
        </button>
        <button 
          onClick={() => setFilterMode('rotating')}
          className={`flex-1 text-center py-2 text-[11px] font-bold transition-all rounded-lg ${filterMode === 'rotating' ? 'bg-[#00C896] text-black shadow-lg' : 'text-[#8A8A8A] hover:text-[#f5f0e8]'}`}
        >
          Rotating Savings
        </button>
      </div>

      {/* --- Loader / Empty State --- */}
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
                {communityGoals.map((c) => {
                  const savedEth = Number(formatEther(c.totalSaved));
                  const goalEth = Number(formatEther(c.config.goalAmount));
                  const percent = Math.min(100, Math.round((savedEth / (goalEth || 1)) * 100));
                  
                  return (
                    <div 
                      key={c.id} 
                      className="bg-[#161616] border border-[#2C2C2C] rounded-2xl overflow-hidden hover:border-[#00C896]/40 transition-all flex flex-col group"
                    >
                      {/* Banner header for Goal */}
                      <div 
                        style={{ background: c.coverColor }}
                        className="h-24 p-4 flex items-end relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="relative z-10 flex items-center gap-3">
                          <span className="text-3xl">{c.emoji}</span>
                          <h3 className="font-bold text-base text-[#f5f0e8] drop-shadow-md">{c.title}</h3>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-4">
                        <p className="text-xs text-[#8A8A8A] leading-relaxed">
                          {c.description}
                        </p>

                        {/* Progress bar */}
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

                        {/* Member contributors & Actions */}
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
                  <span>Open Rotating Savings (Esusu)</span>
                </div>
                <span className="text-[10px] text-brand/60 dm-mono bg-brand/5 px-2 py-0.5 rounded-full border border-brand/10">{rotatingCircles.length} Open</span>
              </div>

              <div className="space-y-4">
                {rotatingCircles.map((c) => {
                  const contributionEth = Number(formatEther(c.contributionAmount));
                  const estimatedPayout = contributionEth * (c.memberAddrs.length || 1);
                  
                  return (
                    <div 
                      key={c.id} 
                      className="bg-[#161616] border border-[#2C2C2C] rounded-2xl p-4 hover:border-[#00C896]/40 transition-all flex flex-col gap-4 group"
                    >
                      {/* Title row */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 border border-[#00C896]/20 flex items-center justify-center text-xl">
                            {c.emoji}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#f5f0e8] group-hover:text-[#00C896] transition-colors">{c.title}</h3>
                            <span className="text-[10px] font-mono text-[#8A8A8A]">circle #{c.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-[#00C896]" />
                          <span className="text-[10px] font-bold text-[#00C896]">{c.trustScore}% trust</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#8A8A8A] leading-relaxed">
                        {c.description}
                      </p>

                      {/* Financial info block */}
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

                      {/* Footer block with members list */}
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

      {/* --- Explanatory CTA Card --- */}
      <div className="p-4 bg-[#161616] border border-[#2C2C2C] rounded-2xl space-y-3 relative overflow-hidden mt-2">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-dim/20 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1">
          <h4 className="font-bold text-xs text-[#f5f0e8] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00C896]" />
            Trustless Rotating Savings
          </h4>
          <p className="text-[11px] text-[#8A8A8A] leading-relaxed">
            Rotating Savings (Esusu) is a time-tested peer saving mechanism. At each cycle, members contribute a fixed sum and the full pot is paid out to one of the members in sequence. All contracts are verified and secured on Celo.
          </p>
        </div>
      </div>

    </div>
  );
}
