"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Zap, 
  Users, 
  Plus, 
  MessageCircle, 
  QrCode, 
  Wallet 
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export const FlowSection = () => {
  const wrapperRef = useRef(null);
  const stickyRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // See It In Action (Sticky Section)
      const siaTl = gsap.timeline({
        scrollTrigger: {
          trigger: stickyRef.current,
          start: "top top",
          end: "+=500%",
          scrub: 0.5,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
        }
      });
      
      // Step 1 -> 2 (Design -> Launch)
      siaTl.to(".sia-state-1", { autoAlpha: 0, y: -20, duration: 0.5 }, 0.5)
           .to(".sia-state-2", { autoAlpha: 1, y: 0, duration: 0.5 }, 1.2)
           .to(".sia-indicator-1", { opacity: 0.3, duration: 0.4 }, 0.5)
           .to(".sia-indicator-2", { color: "#00C896", borderColor: "#00C896", backgroundColor: "rgba(0,200,150,0.08)", opacity: 1, duration: 0.4 }, 1.2);
      
      // Step 2 -> 3 (Launch -> Track)
      siaTl.to(".sia-state-2", { autoAlpha: 0, y: -20, duration: 0.5 }, 2.5)
           .to(".sia-state-3", { autoAlpha: 1, y: 0, duration: 0.5 }, 3.2)
           .to(".sia-indicator-2", { opacity: 0.3, duration: 0.4 }, 2.5)
           .to(".sia-indicator-3", { color: "#00C896", borderColor: "#00C896", backgroundColor: "rgba(0,200,150,0.08)", opacity: 1, duration: 0.4 }, 3.2);

      // Step 3 -> 4 (Track -> Settle)
      siaTl.to(".sia-state-3", { autoAlpha: 0, y: -20, duration: 0.5 }, 4.5)
           .to(".sia-state-4", { autoAlpha: 1, y: 0, duration: 0.5 }, 5.2)
           .to(".sia-indicator-3", { opacity: 0.3, duration: 0.4 }, 4.5)
           .to(".sia-indicator-4", { color: "#00C896", borderColor: "#00C896", backgroundColor: "rgba(0,200,150,0.08)", opacity: 1, duration: 0.4 }, 5.2);
    });

    return () => ctx.revert();
  }, []);

  return (
    <section ref={wrapperRef} className="see-in-action-wrapper relative bg-[#0a0a0a]">
      <div ref={stickyRef} className="see-in-action-sticky w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
        <div className="text-center z-50">
          <h2 className="clash-display font-bold text-3xl text-[#f5f0e8] mt-10 mb-3">How Split works.</h2>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
             <span className="sia-indicator-1 dm-mono text-[10px] px-5 py-2 rounded-full border border-[#00C896] text-[#00C896] bg-[rgba(0,200,150,0.08)]">01 DESIGN</span>
             <span className="sia-indicator-2 dm-mono text-[10px] px-5 py-2 rounded-full border border-[#242424] text-[#3a3a3a]">02 LAUNCH</span>
             <span className="sia-indicator-3 dm-mono text-[10px] px-5 py-2 rounded-full border border-[#242424] text-[#3a3a3a]">03 TRACK</span>
             <span className="sia-indicator-4 dm-mono text-[10px] px-5 py-2 rounded-full border border-[#242424] text-[#3a3a3a]">04 SETTLE</span>
          </div>
        </div>

        <div className="relative w-full max-w-[960px] px-6 h-[320px] mt-10">
          {/* Common Card Container */}
          <div className="absolute inset-0 bg-[#141414] border border-[#242424] md:rounded-[32px] rounded-0 p-8 shadow-2xl flex items-center justify-center">
            
            {/* State 1: Design */}
            <div className="sia-state-1 absolute inset-0 p-8 flex flex-col items-center justify-center text-center space-y-6 w-full transition-all z-10">
              <div className="w-12 h-12 bg-[#0c1a16] border border-[#00c89633] rounded-xl flex items-center justify-center text-2xl shadow-inner group">
              </div>
              
              <div className="space-y-2 w-full max-w-lg">
                <h3 className="clash-display font-bold text-2xl text-[#f5f0e8]">Name your group</h3>
                <p className="text-[#8A8A8A] text-sm leading-relaxed mx-auto max-w-md">
                  Set up in seconds. Share an invite link via WhatsApp or QR code. Friends join with their MiniPay wallet.
                </p>
              </div>

              {/* New Feature Row */}
              <div className="grid grid-cols-3 gap-8 w-full max-w-md pt-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#00C896]">
                    <MessageCircle size={20} />
                  </div>
                  <span className="text-[10px] font-mono text-[#4A4A4A] uppercase tracking-wider">Share Link</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#00C896]">
                    <QrCode size={20} />
                  </div>
                  <span className="text-[10px] font-mono text-[#4A4A4A] uppercase tracking-wider">Scan QR</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#00C896]">
                    <Wallet size={20} />
                  </div>
                  <span className="text-[10px] font-mono text-[#4A4A4A] uppercase tracking-wider">MiniPay Join</span>
                </div>
              </div>

              <div className="bg-[#0c1a16] border-2 border-dashed border-[#00c89633] p-3 rounded-xl flex items-center justify-center gap-3 group cursor-pointer hover:border-[#00c89688] transition-all w-full max-w-xs">
                <span className="text-[#00c896] text-xl font-bold">+</span>
                <span className="dm-sans font-bold text-[#00c896] tracking-tight">Create New Group</span>
              </div>
            </div>

            {/* State 2: Launch */}
            <div className="sia-state-2 absolute inset-0 p-12 flex flex-col items-center justify-center text-center space-y-8 opacity-0 pointer-events-none">
              <div className="relative">
                 <div className="w-20 h-20 bg-[#00c896]/10 border border-[#00c896]/30 rounded-full flex items-center justify-center">
                    <Zap className="text-[#00c896] w-8 h-8 animate-pulse" />
                 </div>
                 <div className="absolute -top-2 -right-2 bg-[#00c896] w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#141414]">
                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                 </div>
              </div>
              <div className="space-y-6 w-full max-w-xs">
                 <h3 className="clash-display font-bold text-2xl">Launch On-Chain</h3>
                 <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00c896] w-3/4" />
                 </div>
                 <p className="text-[#00c896] dm-mono text-[10px] tracking-widest uppercase font-bold">INITIALIZING LEDGER...</p>
                 <p className="text-[#7a7a7a] text-xs">Setting up your smart contract on Celo.</p>
              </div>
            </div>

            {/* State 3: Track */}
            <div className="sia-state-3 absolute inset-0 p-12 flex flex-col items-center justify-center text-center space-y-8 opacity-0 pointer-events-none">
              <div className="w-full space-y-3">
                <div className="bg-[#0a0a0a] border border-[#242424] p-4 rounded-2xl flex justify-between items-center group hover:border-[#00c896]/50 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-[#00c896]/10 flex items-center justify-center text-[#00c896]"><Users className="w-4 h-4" /></div>
                     <div className="text-left"><p className="text-sm font-bold">Sarah paid $120</p><p className="text-[10px] text-[#3a3a3a]">Dinner</p></div>
                  </div>
                  <span className="text-[10px] font-mono text-[#00c896]">ADDED</span>
                </div>
                <div className="bg-[#0a0a0a] border border-[#242424] p-4 rounded-2xl flex justify-between items-center opacity-60">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-[#242424] flex items-center justify-center text-[#7a7a7a]"><Plus className="w-4 h-4" /></div>
                     <div className="text-left"><p className="text-sm font-bold">Add new expense</p></div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                 <h3 className="clash-display font-bold text-2xl">Log Everything</h3>
                 <p className="text-[#7a7a7a] text-xs">No more manual math. Split handles the logic.</p>
              </div>
            </div>

            {/* State 4: Settle */}
            <div className="sia-state-4 absolute inset-0 p-12 flex flex-col items-center justify-center text-center space-y-8 opacity-0 pointer-events-none">
              <div className="w-full max-w-md bg-[#0c1a16] border border-[#00c89633] rounded-3xl p-6 relative overflow-hidden">
                <span className="dm-mono text-[9px] text-[#00c896] tracking-[0.2em] font-bold uppercase block mb-3">Your Net Balance</span>
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="clash-display font-bold text-5xl text-[#f5f0e8]">0.00</span>
                  <span className="dm-mono text-lg text-[#7a7a7a]">cUSD</span>
                </div>
                
                <div className="w-full h-[1px] bg-[#00c8961a] mb-6"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <span className="dm-mono text-[8px] text-[#7a7a7a] uppercase block mb-1">You are owed</span>
                    <span className="dm-sans font-bold text-[#00c896] text-sm">+0.00 <span className="text-[9px] opacity-60">cUSD</span></span>
                  </div>
                  <div className="text-center border-l border-[#00c8961a]">
                    <span className="dm-mono text-[8px] text-[#7a7a7a] uppercase block mb-1">You owe</span>
                    <span className="dm-sans font-bold text-[#ff4b4b] text-sm">-0.00 <span className="text-[9px] opacity-60">cUSD</span></span>
                  </div>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="w-full py-5 bg-[#00C896] text-black font-bold rounded-2xl text-sm shadow-xl shadow-[#00C896]/20 hover:scale-[1.02] transition-transform cursor-pointer">Settle Up Now</div>
                <p className="dm-mono text-[9px] text-[#3a3a3a]">SECURE ON-CHAIN SETTLEMENT</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
