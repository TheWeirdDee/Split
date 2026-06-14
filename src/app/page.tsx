"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { QRCodeSVG } from "qrcode.react";
import { Navbar, Button } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import QuickSplit from "@/components/landing/QuickSplit";
import { Features } from "@/components/landing/Features";
import { FlowSection } from "@/components/landing/FlowSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Footer } from "@/components/landing/Footer";
import { Pizza, Car, Home, PartyPopper, Plane, ShoppingCart, Coins } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section reveal animations
      gsap.utils.toArray(".reveal").forEach((el: any) => {
        gsap.fromTo(el, 
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none"
            }
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-[#0a0a0a] text-[#f5f0e8] font-body selection:bg-[#00C896] selection:text-black overflow-x-hidden">
      <Navbar />
      
      <main className="pt-20">
        <Hero />

    
        <section className="relative h-11 bg-[#00c896] flex items-center overflow-hidden z-20">
          <div className="flex gap-12 whitespace-nowrap animate-marquee py-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-12 items-center text-[11px] dm-mono font-semibold text-black tracking-[0.15em] uppercase">
                <span className="flex items-center gap-1"><Pizza className="w-3 h-3" /> RESTAURANTS</span> <span>·</span>
                <span className="flex items-center gap-1"><Car className="w-3 h-3" /> TRANSPORT</span> <span>·</span>
                <span className="flex items-center gap-1"><Home className="w-3 h-3" /> RENT</span> <span>·</span>
                <span className="flex items-center gap-1"><PartyPopper className="w-3 h-3" /> EVENTS</span> <span>·</span>
                <span className="flex items-center gap-1"><Plane className="w-3 h-3" /> TRAVEL</span> <span>·</span>
                <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> GROCERIES</span> <span>·</span>
                <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> UTILITIES</span> <span>·</span>
              </div>
            ))}
          </div>
        </section>

        {/* --- Quick Split Section --- */}
        <section id="quick-split" className="py-24 bg-[#0a0a0a]">
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

        <Features />

        <FlowSection />

        <HowItWorks />

        {/* --- CTA Section --- */}
        <section className="py-0 reveal w-full overflow-hidden">
          <div className="w-full bg-[#00C896] p-8 md:p-10 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-black/5 rounded-full pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <span className="dm-mono text-[10px] font-bold tracking-[0.2em] text-black/60 uppercase">READY TO SPLIT & SAVE?</span>
              <h2 className="clash-display font-bold text-[clamp(32px,5vw,56px)] text-black leading-[1.1] max-w-2xl mx-auto">Stop chasing people.<br />Start saving together.</h2>
              <p className="dm-sans text-black/70 text-[14px] font-medium max-w-xl mx-auto leading-relaxed">The simplest way to handle group expenses and collaborative savings circles on Celo. Instant payouts, zero awkwardness.</p>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <Link href="/app">
                <Button className="bg-black text-[#00C896] px-[32px] py-[12px] text-[15px] font-bold hover:bg-black/85 hover:scale-105 border-none">
                  Open Split →
                </Button>
              </Link>
              <div className="flex flex-col items-center gap-3">
                 <div className="bg-white p-2 rounded-xl shadow-2xl"><QRCodeSVG value="https://split-five-eta.vercel.app" size={80} /></div>
                 <span className="dm-mono text-[9px] text-black/45 tracking-widest uppercase">Scan to open in MiniPay</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* --- Custom Marquee Animation --- */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          width: fit-content;
          display: flex;
        }
      `}</style>
    </div>
  );
}
