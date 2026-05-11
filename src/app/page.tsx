"use client";

import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Footer } from '@/components/landing/Footer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

const useCases = [
  { emoji: '🍕', label: 'Food' },
  { emoji: '🚗', label: 'Transport' },
  { emoji: '🏠', label: 'Rent' },
  { emoji: '🎉', label: 'Events' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '🛒', label: 'Groceries' },
];

export default function LandingPage() {
  return (
    <div className="bg-bg min-h-screen text-text-primary selection:bg-brand selection:text-bg">
      <Navbar />
      
      <main>
        <Hero />
        
        <section className="py-12 border-y border-border overflow-hidden">
          <div className="flex items-center gap-4 animate-scroll whitespace-nowrap px-4">
            <div className="flex gap-4 items-center animate-marquee">
              {[...useCases, ...useCases].map((item, i) => (
                <div 
                  key={i} 
                  className="bg-surface border border-border px-6 py-3 rounded-full flex items-center gap-3"
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm font-semibold tracking-wide uppercase">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />

        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto bg-brand rounded-[2.5rem] p-12 md:p-20 text-center space-y-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-bg/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-bg/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <h2 className="clash-display font-bold text-4xl md:text-6xl text-bg leading-[0.95]">
              Stop chasing people<br />for money.
            </h2>
            <p className="text-bg/80 text-lg md:text-xl font-medium max-w-xl mx-auto">
              The simplest way to handle group expenses. Instant settlements, zero awkward conversations.
            </p>
            <div className="flex flex-col items-center gap-6">
              <Link href="/app">
                <Button variant="outline" className="bg-bg text-text-primary border-transparent hover:bg-surface-2 rounded-full px-12 h-16 text-xl font-bold">
                  Open Split →
                </Button>
              </Link>
              <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
                <QRCodeSVG value="https://split-celo.vercel.app" size={128} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
          width: fit-content;
        }
      `}</style>
    </div>
  );
}
