"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Button } from "./Navbar";

/**
 * Landing hero: headline, subcopy, CTAs, and the floating phone mockup, with a
 * GSAP entrance timeline that staggers each element in on first paint.
 */
export const Hero = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Entrance Animations
      const tl = gsap.timeline();
      tl.from(".hero-overline", { opacity: 0, y: 20, duration: 0.6 })
        .from(".hero-h1 span", { opacity: 0, y: 40, stagger: 0.12, duration: 0.7 }, "-=0.3")
        .from(".hero-sub", { opacity: 0, y: 20, duration: 0.5 }, "-=0.2")
        .from(".hero-cta", { opacity: 0, y: 20, duration: 0.5 }, "-=0.2")
        .from(".hero-trust", { opacity: 0, duration: 0.5 }, "-=0.1")
        .from(".hero-phone", { opacity: 0, x: 60, rotationY: -15, duration: 0.9, ease: "power3.out" }, 0.3);

      // Hero Phone Float
      gsap.to(".hero-phone", {
        y: -14,
        duration: 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative flex flex-col justify-start pt-[52px] lg:pt-[56px] pb-10 px-12 max-w-[1280px] mx-auto overflow-hidden">
      {/* Premium Abstract Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Animated Glass Blobs */}
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[50%] bg-[radial-gradient(circle,rgba(0,200,150,0.07)_0%,transparent_70%)] blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[45%] bg-[radial-gradient(circle,rgba(0,200,150,0.04)_0%,transparent_70%)] blur-[80px]" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 opacity-[0.12]" 
             style={{ 
               backgroundImage: 'radial-gradient(rgba(39, 16, 153, 0.3) 0.5px, transparent 0.5px)', 
               backgroundSize: '24px 24px' 
             }} 
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0D0D0D_100%)]" />
      </div>

      <div className="relative z-10 w-full grid lg:grid-cols-[1.22fr_0.78fr] gap-12 items-center">
        {/* Left Column Content */}
        <div className="flex flex-col items-start">
          <div className="hero-overline inline-flex items-center gap-2 bg-[rgba(0,200,150,0.06)] border border-[rgba(0,200,150,0.15)] px-4 py-1 rounded-full mb-6">
            <span className="dm-mono text-[9px] text-[#00c896] tracking-[0.3em] font-semibold uppercase">
              ✦ Split · Save · Repeat
            </span>
          </div>

          <h1 className="hero-h1 clash-display font-bold text-[clamp(40px,5.8vw,68px)] leading-[0.95] tracking-[-0.04em] mb-6 flex flex-col">
            <span className="text-[#f5f0e8]">Split expenses.</span>
            <span className="text-[#00c896]">Save together.</span>
            <span className="text-4xl md:text-7xl block mt-2">No awkwardness.</span>
          </h1>

          <p className="hero-sub dm-sans text-[#7a7a7a] text-[16px] leading-[1.6] max-w-[460px] mb-8">
            Split shared expenses and save towards collective goals with cUSD on Celo. 
            Manage split groups and collaborative Savings Circles with zero delays.
          </p>

          <div className="hero-cta flex flex-wrap gap-3">
            <Link href="/app">
              <Button className="px-10 h-14 text-lg font-bold bg-black border border-white/20 text-white rounded-md hover:bg-white/5 shadow-none">Open App →</Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" className="px-10 h-14 text-lg font-bold bg-black border border-white/20 text-white rounded-md hover:bg-white/5">See how it works ↓</Button>
            </Link>
          </div>

          <div className="hero-trust flex items-center gap-4 text-[11px] dm-mono text-[#8a8a8a] tracking-[0.12em] mt-12">
            <span>✦ Built on Celo</span>
            <span>·</span>
            <span>Powered by MiniPay</span>
            <span>·</span>
            <span>Open Source</span>
          </div>
        </div>

        {/* Right Column - Premium Summary Card */}
        <div className="flex justify-center lg:justify-end mt-12 lg:mt-0 px-4 lg:px-0">
          <div className="hero-phone relative w-full max-w-[440px] group">
            {/* Background Stacked Card 2 */}
            <div className="absolute top-[-24px] right-[-24px] w-full h-full bg-[#0D0D0D] rounded-[32px] border border-[#1A1A1A] opacity-20 -rotate-3 scale-[0.96] pointer-events-none" />
            
            {/* Background Stacked Card 1 */}
            <div className="absolute top-[-12px] right-[-12px] w-full h-full bg-[#111111] rounded-[32px] border border-[#222222] opacity-50 -rotate-1 scale-[0.98] pointer-events-none" />

            {/* Main Card */}
            <div className="relative bg-[#141414] rounded-[32px] border border-[#2C2C2C] p-6 lg:p-8 shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_50%_0%,rgba(0,200,150,0.04)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#222222] pb-4">
                  <span className="dm-mono text-[8px] text-[#4A4A4A] tracking-[0.25em] uppercase font-bold">House Expenses · May 2025</span>
                  <div className="flex gap-1.5">
                    <div className="w-0.5 h-0.5 rounded-full bg-[#2C2C2C]" />
                    <div className="w-0.5 h-0.5 rounded-full bg-[#2C2C2C]" />
                  </div>
                </div>

                {/* Rows */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#8A8A8A] text-[14px] font-medium transition-colors group-hover/row:text-[#f5f0e8]">Divine paid rent</span>
                    <span className="clash-display font-bold text-lg text-[#F7F3EC]">500 <span className="text-[10px] dm-mono opacity-30 font-normal">cUSD</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#8A8A8A] text-[14px] font-medium">John owes you</span>
                    <span className="text-[#00C896] font-bold text-lg">+166 <span className="text-[10px] dm-mono opacity-40 font-normal">cUSD</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#8A8A8A] text-[14px] font-medium">Sarah owes you</span>
                    <span className="text-[#00C896] font-bold text-lg">+166 <span className="text-[10px] dm-mono opacity-40 font-normal">cUSD</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#8A8A8A] text-[14px] font-medium">Mike owes you</span>
                    <span className="text-[#00C896] font-bold text-lg">+166 <span className="text-[10px] dm-mono opacity-40 font-normal">cUSD</span></span>
                  </div>
                </div>

                {/* Net Balance Section */}
                <div className="pt-5 border-t border-[#222222] flex justify-between items-center">
                  <div className="flex flex-col gap-2.5">
                    <span className="dm-mono text-[8px] text-[#4A4A4A] tracking-[0.2em] uppercase font-bold">Net Balance</span>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00C896]/15 bg-[#00C896]/5 text-[#00C896] text-[8px] font-bold tracking-[0.1em] uppercase">
                      Settled Onchain ✓
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="clash-display font-bold text-4xl text-[#00C896] tracking-tight">+498 <span className="text-xs dm-mono opacity-50 font-medium">cUSD</span></span>
                  </div>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#00C896]/5 blur-[60px] rounded-full pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
