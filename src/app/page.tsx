"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { QRCodeSVG } from "qrcode.react";
import { 
  Zap, 
  Calculator, 
  Users, 
  ShieldCheck, 
  Smartphone, 
  Globe, 
  ChevronRight, 
  ChevronLeft,
  Settings,
  Plus,
  ArrowRight,
  ClipboardList,
  Brain,
  MessageCircle,
  QrCode,
  Wallet
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// --- Local Components ---

const Logo = () => (
  <Link href="/" className="flex items-center gap-3 group transition-all active:scale-95">
    <div className="relative w-8 h-8">
      {/* Shadow/Back Layer */}
      <div className="absolute inset-0 bg-[#009E78] rounded-[25%] translate-x-[12%] translate-y-[12%] opacity-60" />
      {/* Main Green Layer */}
      <div className="absolute inset-0 bg-[#00C896] rounded-[25%] flex flex-col items-center justify-center gap-[10%] overflow-hidden">
        {/* Receipt Lines */}
        <div className="w-[50%] h-[6%] bg-black/20 rounded-full" />
        <div className="w-[50%] h-[6%] bg-black/20 rounded-full" />
        <div className="w-[50%] h-[6%] bg-black/20 rounded-full" />
        {/* Diagonal Slash */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[140%] h-[10%] bg-white rotate-[-45deg] shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
        </div>
      </div>
    </div>
    <span className="clash-display font-bold text-[24px] tracking-tight text-[#f5f0e8] transition-all relative">
      <span className="relative z-10">split</span>
      <span className="absolute inset-0 text-[#ff0000] mix-blend-screen translate-x-[1px] opacity-70 pointer-events-none select-none blur-[0.4px] group-hover:translate-x-[2.5px] transition-transform">split</span>
      <span className="absolute inset-0 text-[#00ffff] mix-blend-screen translate-x-[-1px] opacity-70 pointer-events-none select-none blur-[0.4px] group-hover:translate-x-[-2.5px] transition-transform">split</span>
    </span>
  </Link>
);

const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
  const baseStyles = "px-6 py-2.5 rounded-md font-semibold text-[15px] transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#00C896] text-[#000] hover:bg-[#009E78] shadow-[0_8px_30px_rgba(0,200,150,0.3)]",
    outline: "bg-transparent border border-[#242424] text-[#7a7a7a] hover:border-[#00C896] hover:text-[#f5f0e8]",
    ghost: "bg-transparent text-[#7a7a7a] hover:text-[#f5f0e8]"
  };

  return (
    <button className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Main Page ---

export default function LandingPage() {
  const navRef = useRef(null);
  const heroRef = useRef(null);
  const hiwWrapperRef = useRef(null);
  const hiwStickyRef = useRef(null);
  const siaWrapperRef = useRef(null);
  const siaStickyRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Navbar scroll behavior
      ScrollTrigger.create({
        start: "top -60px",
        onEnter: () => gsap.to(navRef.current, { 
          backgroundColor: "rgba(10,10,10,0.85)", 
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid #242424",
          duration: 0.3 
        }),
        onLeaveBack: () => gsap.to(navRef.current, { 
          backgroundColor: "transparent",
          backdropFilter: "blur(0px)",
          borderBottom: "1px solid transparent",
          duration: 0.3 
        }),
      });

      // Hero Entrance Animations
      const tl = gsap.timeline();
      tl.from(".hero-overline", { opacity:0, y:20, duration:0.6 })
        .from(".hero-h1 span", { opacity:0, y:40, stagger:0.12, duration:0.7 }, "-=0.3")
        .from(".hero-sub", { opacity:0, y:20, duration:0.5 }, "-=0.2")
        .from(".hero-cta", { opacity:0, y:20, duration:0.5 }, "-=0.2")
        .from(".hero-trust", { opacity:0, duration:0.5 }, "-=0.1")
        .from(".hero-phone", { opacity:0, x:60, rotationY:-15, duration:0.9, ease:"power3.out" }, 0.3);

      // Hero Phone Float
      gsap.to(".hero-phone", {
        y: -14,
        duration: 3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // See It In Action (Sticky Section)
      const siaTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".see-in-action-sticky",
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
    
    // ... rest of the GSAP logic unchanged ...

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

      // Feature cards stagger reveal
      const featureCards = gsap.utils.toArray(".feature-card");
      if (featureCards.length > 0) {
        gsap.fromTo(featureCards, 
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".features-grid",
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-[#0a0a0a] text-[#f5f0e8] font-body selection:bg-[#00C896] selection:text-black overflow-x-hidden">
      {/* --- Global CSS Inject (Clash Display) --- */}
      {/* Fonts are handled in globals.css */}

      {/* --- Navbar --- */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-[100] h-16 transition-all duration-300 flex items-center border-b border-transparent">
        <div className="max-w-[1280px] mx-auto w-full px-12 flex items-center justify-between">
          <Logo />
          
          <div className="hidden md:flex items-center gap-10 text-[14px] font-sans text-[#7a7a7a]">
            {["Features", "How it works", "FAQ"].map((item) => (
              <Link key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="relative group transition-colors hover:text-[#f5f0e8]">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#00c896] transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>

          <Link href="/app">
            <Button className="font-sans font-semibold">Open App →</Button>
          </Link>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col justify-center pt-[125px] pb-10 px-12 max-w-[1280px] mx-auto overflow-hidden">
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
                ✦ Split · Settle · Repeat
              </span>
            </div>

            <h1 className="hero-h1 clash-display font-bold text-[clamp(40px,5.8vw,68px)] leading-[0.95] tracking-[-0.04em] mb-6 flex flex-col">
              <span className="text-[#f5f0e8]">Split bills.</span>
              <span className="text-[#00c896]">Settle instantly.</span>
              <span className="text-4xl md:text-7xl block mt-2">No awkwardness.</span>
            </h1>

            <p className="hero-sub dm-sans text-[#7a7a7a] text-[16px] leading-[1.6] max-w-[460px] mb-8">
              Pay shared expenses with cUSD on Celo. No banks, no waiting. 
              Every settlement is permanent and instant.
            </p>

            <div className="hero-cta flex flex-wrap gap-3">
              <Link href="/app">
                <Button className="px-10 h-14 text-lg font-bold bg-black border border-white/20 text-white rounded-md hover:bg-white/5 shadow-none">Open App →</Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" className="px-10 h-14 text-lg font-bold bg-black border border-white/20 text-white rounded-md hover:bg-white/5">See how it works ↓</Button>
              </Link>
            </div>

            <div className="hero-trust flex items-center gap-4 text-[11px] dm-mono text-[#8A8A8A] tracking-[0.12em] mt-12">
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

      {/* --- Marquee Ticker Bar --- */}
      <section className="relative h-11 bg-[#00c896] flex items-center overflow-hidden z-20">
        <div className="flex gap-12 whitespace-nowrap animate-marquee py-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-12 items-center text-[11px] dm-mono font-semibold text-black tracking-[0.15em] uppercase">
              <span>🍕 RESTAURANTS</span> <span>·</span> <span>🚗 TRANSPORT</span> <span>·</span> <span>🏠 RENT</span> <span>·</span>
              <span>🎉 EVENTS</span> <span>·</span> <span>✈️ TRAVEL</span> <span>·</span> <span>🛒 GROCERIES</span> <span>·</span> <span>💸 UTILITIES</span> <span>·</span>
            </div>
          ))}
        </div>
      </section>



      {/* --- Features Grid --- */}
      <section id="features" className="bg-[#141414] py-32 px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="reveal space-y-4 mb-20">
            <span className="dm-mono text-[11px] text-[#00C896] tracking-[0.2em] font-bold uppercase">Features</span>
            <h2 className="clash-display font-bold text-[clamp(36px,5vw,56px)] text-[#f5f0e8]">Everything you need.</h2>
          </div>

          {/* SVG Filter for background removal without inverting colors */}
          <svg width="0" height="0" className="absolute">
            <filter id="remove-white">
              {/* This matrix turns pixels close to white into transparent pixels */}
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 1 0" />
            </filter>
          </svg>

          <div className="features-grid grid md:grid-cols-3 gap-4 mt-[60px] md:grid-rows-[repeat(2,minmax(220px,auto))]">
             {/* Card 1: Tall - Instant Settlement */}
             <div className="feature-card relative bg-[#111111] rounded-md p-8 md:row-span-2 overflow-hidden transition-all hover:bg-[#161616] group">
               <div className="relative z-10 h-full flex flex-col">
                 <h3 className="clash-display font-bold text-2xl text-[#f5f0e8] mb-3">Instant Settlement</h3>
                 <p className="dm-sans text-[#8A8A8A] text-sm leading-[1.6] max-w-[200px]">Pay with cUSD the moment debts are calculated. No waiting, no banks.</p>
                 
                 <div className="flex-1 flex items-center justify-center py-10">
                   <Zap size={160} strokeWidth={1.5} className="relative text-[#00C896] opacity-30 group-hover:opacity-70 transition-all duration-700" />
                 </div>
               </div>
             </div>

             {/* Card 2: Wide - Smart Debt Engine */}
             <div className="feature-card relative bg-[#161616] rounded-md p-6 md:p-8 md:col-span-2 overflow-hidden transition-all group">
               <div className="relative z-10 max-w-[65%] md:max-w-[55%]">
                 <h3 className="clash-display font-bold text-[17px] md:text-2xl mb-4 whitespace-nowrap">
                   <span className="bg-[#00C896] text-[#0D0D0D] px-2 py-0.5 rounded-sm">Smart Debt Engine</span>
                 </h3>
                 <p className="dm-sans text-[#8A8A8A] text-xs md:text-sm leading-[1.6]">Our proprietary algorithm minimizes the number of transactions needed between group members. More efficiency, lower gas fees.</p>
               </div>
               <div className="absolute -right-4 md:right-12 top-1/2 -translate-y-1/2 w-28 h-28 md:w-44 md:h-44">
                  <img 
                    src="/images/brain.png?v=2" 
                    alt="Brain" 
                    className="w-full h-full object-contain opacity-30 group-hover:opacity-70 transition-all duration-500"
                    style={{ 
                      filter: 'url(#remove-white) invert(66%) sepia(85%) saturate(415%) hue-rotate(93deg) brightness(1.3) contrast(1.1)' 
                    }}
                  />
               </div>
             </div>

             {/* Card 3: Standard - Group Admin */}
             <div className="feature-card relative bg-[#111111] rounded-md p-8 overflow-hidden transition-all hover:bg-[#161616] group">
               <div className="relative z-10">
                 <h3 className="clash-display font-bold text-xl text-[#f5f0e8] mb-2">Group Admin</h3>
                 <p className="dm-sans text-[#8A8A8A] text-xs leading-[1.6]">Create a group in 10 seconds. Share via WhatsApp instantly.</p>
               </div>
               <div className="absolute -bottom-4 -right-4">
                 <Users size={120} strokeWidth={1.5} className="text-[#00C896] opacity-30 group-hover:opacity-70 transition-all duration-700" />
               </div>
             </div>

             {/* Card 4: Standard - On-Chain Proof */}
             <div className="feature-card relative bg-[#111111] rounded-md p-8 overflow-hidden transition-all hover:bg-[#161616] group">
               <div className="relative z-10">
                 <h3 className="clash-display font-bold text-xl text-[#f5f0e8] mb-2">On-Chain Proof</h3>
                 <p className="dm-sans text-[#8A8A8A] text-xs leading-[1.6]">Every payment is a blockchain transaction. Verifiable and permanent.</p>
               </div>
               <div className="absolute -bottom-4 -right-4 w-36 h-36">
                  <img 
                    src="/images/blocks.png?v=2" 
                    alt="Blockchain" 
                    className="w-full h-full object-contain opacity-30 group-hover:opacity-70 transition-all duration-500"
                    style={{ 
                      filter: 'url(#remove-white) hue-rotate(-155deg) saturate(1.8) brightness(2.5) contrast(1.2)' 
                    }}
                  />
               </div>
             </div>

             {/* Card 5: Wide - MiniPay Native */}
             <div className="feature-card relative bg-[#161616] rounded-md p-6 md:p-8 md:col-span-2 overflow-hidden transition-all group">
               <div className="relative z-10 max-w-[65%]">
                 <h3 className="clash-display font-bold text-lg md:text-2xl mb-4 whitespace-nowrap">
                   <span className="bg-[#00C896] text-[#0D0D0D] px-2 py-0.5 rounded-sm">MiniPay Native</span>
                 </h3>
                 <p className="dm-sans text-[#8A8A8A] text-xs md:text-sm leading-[1.6]">Built specifically for MiniPay. No extra apps, no new wallets. Use your existing cUSD balance directly.</p>
               </div>
               <div className="absolute -right-8 md:right-6 top-1/2 -translate-y-1/2 w-44 h-24 md:w-72 md:h-36">
                 <img 
                   src="/images/minipay.png" 
                   alt="MiniPay" 
                   className="w-full h-full object-contain opacity-30 group-hover:opacity-70 transition-all duration-500"
                   style={{ filter: 'url(#remove-white) brightness(1.3) contrast(1.1)' }}
                 />
               </div>
             </div>

             {/* Card 6: Standard - African-First */}
             <div className="feature-card relative bg-[#111111] rounded-md p-8 overflow-hidden transition-all hover:bg-[#161616] group">
               <div className="relative z-10">
                 <h3 className="clash-display font-bold text-xl text-[#f5f0e8] mb-2">African-First</h3>
                 <p className="dm-sans text-[#8A8A8A] text-xs leading-[1.6]">Designed for local needs. Optimized for mobile economies.</p>
               </div>
               <div className="absolute -bottom-6 -right-6 w-44 h-44">
                 <img 
                   src="/images/africa.png" 
                   alt="Africa" 
                   className="w-full h-full object-contain opacity-30 group-hover:opacity-70 transition-all duration-500 rotate-12"
                   style={{ filter: 'url(#remove-white) brightness(1.3) contrast(1.1)' }}
                 />
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- "See It In Action" (Sticky Scroll Section) --- */}
      <section ref={siaWrapperRef} className="see-in-action-wrapper relative bg-[#0a0a0a]">
        <div ref={siaStickyRef} className="see-in-action-sticky w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
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
                      <div className="h-full bg-[#00c896] w-3/4 animate-[shimmer_2s_infinite]" />
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
                  <div className="w-full py-5 bg-[#00c896] text-black font-bold rounded-2xl text-sm shadow-xl shadow-[#00c896]/20 hover:scale-[1.02] transition-transform cursor-pointer">Settle Up Now</div>
                  <p className="dm-mono text-[9px] text-[#3a3a3a]">SECURE ON-CHAIN SETTLEMENT</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- "Simple by Design" (3 Steps) --- */}
      <section id="how-it-works" className="bg-[#0a0a0a] py-32 px-8 max-w-[1280px] mx-auto">
        <div className="text-center mb-24 reveal">
          <h2 className="clash-display font-bold text-[clamp(36px,5vw,56px)] text-[#f5f0e8] mb-4">Simple by design.</h2>
          <p className="dm-sans text-[#7a7a7a] text-[16px] max-w-xl mx-auto">Getting started is easier than sending a WhatsApp message.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-16 relative">
          <div className="hidden md:block absolute top-[110px] left-[15%] w-[70%] border-t border-dashed border-[#242424] z-0" />
          {[
            { num: "01", title: "Create a Group", desc: "Set up in 10 seconds. Share an invite link via WhatsApp or QR code." },
            { num: "02", title: "Log Expenses", desc: "Who paid. Who owes. Auto-calculated shares. No more manual math." },
            { num: "03", title: "Settle with cUSD", desc: "One tap. Instant. Onchain forever. No need for bank transfers." },
          ].map((s, i) => (
            <div key={i} className="reveal relative z-10 flex flex-col items-center text-center">
              <span className="dm-mono text-[72px] md:text-[80px] font-bold text-[#00c896] opacity-[0.1] leading-none mb-6">{s.num}</span>
              <div className="w-14 h-14 rounded-full border border-[#242424] bg-[#0a0a0a] flex items-center justify-center mb-8 relative">
                 <div className="w-2 h-2 rounded-full bg-[#00c896]" />
              </div>
              <h3 className="clash-display font-bold text-[20px] text-[#f5f0e8] mb-4">{s.title}</h3>
              <p className="dm-sans text-[14px] text-[#7a7a7a] leading-[1.6] max-w-[240px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-0 reveal w-full overflow-hidden">
        <div className="w-full bg-[#006E53] p-8 md:p-10 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-black/5 rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <span className="dm-mono text-[10px] font-bold tracking-[0.2em] text-black/60 uppercase">READY TO SPLIT?</span>
            <h2 className="clash-display font-bold text-[clamp(32px,5vw,56px)] text-black leading-[1.1] max-w-2xl mx-auto">Stop chasing people<br />for money.</h2>
            <p className="dm-sans text-black/70 text-[14px] font-medium max-w-xl mx-auto leading-relaxed">The simplest way to handle group expenses. Instant settlements, zero awkward conversations.</p>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-6">
            <Link href="/app"><Button className="bg-black text-[#00C896] px-[32px] py-[12px] text-[15px] font-bold hover:bg-black/85 hover:scale-105 border-none">Open Split →</Button></Link>
            <div className="flex flex-col items-center gap-3">
               <div className="bg-white p-2 rounded-xl shadow-2xl"><QRCodeSVG value="https://split-five-eta.vercel.app" size={80} /></div>
               <span className="dm-mono text-[9px] text-black/45 tracking-widest uppercase">Scan to open in MiniPay</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-[#242424] py-12 px-8 bg-[#0a0a0a]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
            <Logo />
            <div className="flex gap-8 text-[13px] text-[#8A8A8A] font-sans">
              <Link href="#" className="hover:text-[#f5f0e8] transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-[#f5f0e8] transition-colors">GitHub</Link>
              <Link href="#" className="hover:text-[#f5f0e8] transition-colors">Built on Celo</Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-[#242424]/50 text-[11px] dm-mono text-[#8A8A8A] tracking-wider">
            <p>© 2025 Split · Built on Celo · Open Source</p>
            <p className="flex items-center gap-1.5 uppercase font-bold">MADE IN AFRICA 🌍</p>
          </div>
        </div>
      </footer>

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
