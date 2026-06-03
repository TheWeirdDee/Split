"use client";

import React from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import QuickSplit from "@/components/landing/QuickSplit";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FlowSection } from "@/components/landing/FlowSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="bg-[#0a0a0a] text-[#f5f0e8] font-body selection:bg-[#00C896] selection:text-black overflow-x-hidden">
      <Navbar />
      <main className="pt-20">
        <Hero />

        <section id="quick-split" className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12 space-y-4">
              <span className="dm-mono text-[11px] text-[#00C896] tracking-[0.2em] font-bold uppercase">Free to use</span>
              <h2 className="clash-display font-bold text-[clamp(34px,5vw,52px)] text-[#f5f0e8]">Quick Split</h2>
              <p className="text-[#8A8A8A] max-w-2xl mx-auto text-sm md:text-base leading-[1.7]">
                Calculate who owes who instantly, without a wallet. Share the result link with anyone and keep the math simple.
              </p>
            </div>
            <QuickSplit />
          </div>
        </section>

        <HowItWorks />
        <FlowSection />
      </main>
      <Footer />
    </div>
  );
}
