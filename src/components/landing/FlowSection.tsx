"use client";

import React from 'react';
import { Card } from '../common/Card';
import { cn } from '@/lib/utils';
import { ChevronLeft, Settings, Plus, ArrowRight, UserCheck, Smartphone } from 'lucide-react';

export const FlowSection = () => {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto overflow-hidden">
      <div className="text-center mb-20 space-y-4">
        <h2 className="clash-display font-bold text-4xl md:text-6xl tracking-tight">
          How we <span className="text-brand italic">simplify</span> splitting
        </h2>
        <p className="text-text-secondary max-w-2xl mx-auto text-lg">
          From tracking expenses to final settlement, Split handles the complexity so you don't have to.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 items-start">
        {/* Step 1: The Ledger */}
        <div className="space-y-8 group">
          <div className="text-center lg:text-left">
            <span className="dm-mono text-brand font-bold text-sm uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full">Step 01</span>
            <h3 className="clash-display font-bold text-3xl mt-4">The Ledger</h3>
            <p className="text-text-muted mt-2">Track every expense with total transparency.</p>
          </div>
          
          {/* Mobile Screen Mockup */}
          <div className="relative mx-auto max-w-[280px] aspect-[9/19] bg-surface rounded-[3rem] border-8 border-surface-2 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-surface-2 rounded-b-2xl z-20" />
            
            <div className="p-4 pt-10 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-text-muted px-1">
                <ChevronLeft className="w-4 h-4" />
                <span>Ski Trip '24</span>
                <Settings className="w-4 h-4" />
              </div>

              <div className="flex -space-x-2 justify-center py-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-brand/20 border-2 border-surface" />
                ))}
              </div>

              <div className="space-y-2">
                <div className="bg-surface-2 p-3 rounded-xl border border-brand/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand/10" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold">Sarah paid $120</span>
                      <span className="text-[8px] text-text-muted">(Dinner)</span>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-2 p-3 rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-surface" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold">Mike paid $450</span>
                      <span className="text-[8px] text-text-muted">(Airbnb)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl mt-6 space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>You owe Sarah</span>
                  <span className="text-brand">$60</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-text-muted">
                  <span>Mike owes you</span>
                  <span>$15</span>
                </div>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg shadow-brand/20">
                <Plus className="w-6 h-6 text-bg" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: The Engine */}
        <div className="space-y-8 group">
          <div className="text-center lg:text-left">
            <span className="dm-mono text-brand font-bold text-sm uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full">Step 02</span>
            <h3 className="clash-display font-bold text-3xl mt-4">The Engine</h3>
            <p className="text-text-muted mt-2">We simplify multi-person debts automatically.</p>
          </div>

          <div className="relative mx-auto max-w-[280px] aspect-[9/19] bg-surface rounded-[3rem] border-8 border-surface-2 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
             <div className="p-6 pt-12 flex flex-col h-full items-center text-center space-y-6">
                <h4 className="clash-display font-bold text-lg leading-tight uppercase tracking-tighter">We Simplify <br/> Group Debt</h4>
                
                <div className="relative w-40 h-40 mt-4">
                   {/* Nodes */}
                   <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-brand flex items-center justify-center font-bold text-xs">A</div>
                   <div className="absolute top-0 right-0 w-8 h-8 rounded-full border-2 border-brand flex items-center justify-center font-bold text-xs">B</div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-2 border-brand flex items-center justify-center font-bold text-xs">C</div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 rounded-full border-2 border-brand flex items-center justify-center font-bold text-xs">D</div>
                   
                   {/* Center Icon */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center">
                      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M65 10L35 90H48L78 10H65Z" fill="currentColor" />
                        <path d="M48 18C33 18 21 30 21 45H31C31 35.5 38.5 28 48 28V18Z" fill="currentColor" />
                        <path d="M12 45L21 62L30 45H12Z" fill="currentColor" />
                        <path d="M52 82C67 82 79 70 79 55H69C69 64.5 61.5 72 52 72V82Z" fill="currentColor" />
                        <path d="M88 55L79 38L70 55H88Z" fill="currentColor" />
                      </svg>
                   </div>

                   {/* Arrows - Mocked with div paths or simple icons */}
                   <div className="absolute inset-0 opacity-40">
                      <ArrowRight className="absolute top-4 left-10 w-4 h-4 rotate-[135deg] text-brand" />
                      <ArrowRight className="absolute bottom-4 left-10 w-4 h-4 rotate-[45deg] text-brand" />
                      <ArrowRight className="absolute top-4 right-10 w-4 h-4 rotate-[-135deg] text-brand" />
                      <ArrowRight className="absolute bottom-4 right-10 w-4 h-4 rotate-[-45deg] text-brand" />
                   </div>
                </div>

                <div className="pt-4">
                   <p className="text-[10px] font-bold text-text-muted tracking-widest uppercase">Split Engine</p>
                   <div className="mt-4 p-3 bg-surface-2 rounded-xl border border-border">
                      <p className="text-[9px] font-medium text-text-secondary">Optimized Payments:</p>
                      <p className="text-sm font-bold text-brand">2 total</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Step 3: The Settlement */}
        <div className="space-y-8 group">
          <div className="text-center lg:text-left">
            <span className="dm-mono text-brand font-bold text-sm uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full">Step 03</span>
            <h3 className="clash-display font-bold text-3xl mt-4">The Settlement</h3>
            <p className="text-text-muted mt-2">Instant on-chain payments via MiniPay.</p>
          </div>

          <div className="relative mx-auto max-w-[280px] aspect-[9/19] bg-surface rounded-[3rem] border-8 border-brand shadow-[0_0_50px_rgba(0,200,150,0.2)] overflow-hidden group-hover:scale-105 transition-transform duration-500">
             <div className="p-6 pt-12 flex flex-col h-full items-center space-y-8">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 text-brand">
                      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M65 10L35 90H48L78 10H65Z" fill="currentColor" />
                        <path d="M48 18C33 18 21 30 21 45H31C31 35.5 38.5 28 48 28V18Z" fill="currentColor" />
                        <path d="M12 45L21 62L30 45H12Z" fill="currentColor" />
                        <path d="M52 82C67 82 79 70 79 55H69C69 64.5 61.5 72 52 72V82Z" fill="currentColor" />
                        <path d="M88 55L79 38L70 55H88Z" fill="currentColor" />
                      </svg>
                   </div>
                   <span className="clash-display font-bold text-sm tracking-tight uppercase">split</span>
                </div>

                <div className="text-center space-y-1">
                   <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Settle Up</p>
                   <h5 className="clash-display font-bold text-4xl">$60.00</h5>
                   <p className="text-xs font-bold text-brand tracking-widest">cUSD</p>
                </div>

                <div className="flex items-center gap-4 bg-surface-2 p-3 rounded-2xl w-full">
                   <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-bg shadow-lg shadow-brand/20">
                      <Smartphone className="w-5 h-5" />
                   </div>
                   <ArrowRight className="w-4 h-4 text-text-muted" />
                   <div className="w-10 h-10 rounded-xl bg-surface border border-border" />
                   <p className="text-[10px] font-bold">to Sarah</p>
                </div>

                <div className="w-full pt-4">
                   <div className="bg-brand text-bg font-bold py-4 rounded-2xl text-xs uppercase tracking-widest text-center shadow-xl shadow-brand/20 active:scale-95 transition-transform cursor-pointer">
                      Pay Instantly <br/> with MiniPay
                   </div>
                </div>

                <div className="pt-2 text-center">
                   <p className="text-[7px] text-text-muted font-mono uppercase">Transaction ID: 0x39f2a275a60</p>
                   <p className="text-[7px] text-brand/60 font-mono uppercase mt-0.5">On-chain proof: 0x4a...c3e1</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
