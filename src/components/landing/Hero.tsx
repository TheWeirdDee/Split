"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '../common/Button';

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle, #2C2C2C 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/0 via-bg/50 to-bg" />
      </div>

      <div className="relative z-10 max-w-[800px] mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 px-3 py-1 rounded-full animate-fade-in">
          <span className="dm-mono text-[10px] text-brand tracking-widest uppercase font-semibold">
            SPLIT · SETTLE · REPEAT
          </span>
        </div>

        <h1 className="clash-display font-bold text-5xl md:text-8xl leading-[0.92] text-text-primary tracking-tight">
          SPLIT BILLS.<br />
          <span className="italic text-brand">SETTLE INSTANTLY.</span><br />
          NO AWKWARDNESS.
        </h1>

        <p className="text-text-secondary text-lg md:text-xl max-w-[500px] mx-auto font-medium leading-relaxed">
          Pay with cUSD. Settle onchain. Works natively in MiniPay.
          The most seamless way to manage group expenses on Celo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/app" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto rounded-full px-10 text-lg font-bold h-16">
              Open App →
            </Button>
          </Link>
          <Link href="#how-it-works" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-10 text-lg font-bold h-16">
              See how it works ↓
            </Button>
          </Link>
        </div>

        <div className="pt-12 flex flex-wrap justify-center gap-6 text-[10px] dm-mono text-text-muted uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="text-brand">✦</span> Built on Celo
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand">✦</span> Powered by MiniPay
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand">✦</span> Open Source
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[120%] h-96 bg-brand/5 blur-[120px] rounded-full z-0" />
    </section>
  );
};
