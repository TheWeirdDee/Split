"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Zap, Users, PiggyBank } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/**
 * "Features" bento grid. Cards reveal with a staggered GSAP ScrollTrigger
 * animation as the section scrolls into view.
 */
export const Features = () => {
  useEffect(() => {
    const ctx = gsap.context(() => {
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
    <section id="features" className="bg-[#141414] py-32 px-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="reveal space-y-4 mb-20">
          <span className="dm-mono text-[11px] text-[#00C896] tracking-[0.2em] font-bold uppercase">Features</span>
          <h2 className="clash-display font-bold text-[clamp(36px,5vw,56px)] text-[#f5f0e8]">Everything you need.</h2>
        </div>

        {/* SVG Filter for background removal without inverting colors */}
        <svg width="0" height="0" className="absolute">
          <filter id="remove-white">
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
          <div className="feature-card relative bg-[#161616] rounded-md p-8 md:col-span-2 overflow-hidden transition-all group">
            <div className="relative z-10 max-w-[55%]">
              <h3 className="clash-display font-bold text-2xl mb-4">
                <span className="bg-[#00C896] text-[#0D0D0D] px-2 py-0.5 rounded-sm">Smart Debt Engine</span>
              </h3>
              <p className="dm-sans text-[#8A8A8A] text-sm leading-[1.6]">Our proprietary algorithm minimizes the number of transactions needed between group members. More efficiency, lower gas fees.</p>
            </div>
            <div className="absolute right-12 top-1/2 -translate-y-1/2 w-44 h-44">
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

          {/* Card 3: Standard - Savings Circles */}
          <div className="feature-card relative bg-[#111111] rounded-md p-8 overflow-hidden transition-all hover:bg-[#161616] group">
            <div className="relative z-10">
              <h3 className="clash-display font-bold text-xl text-[#f5f0e8] mb-2">Savings Circles</h3>
              <p className="dm-sans text-[#8A8A8A] text-xs leading-[1.6]">Form savings groups (ROSCA) onchain. Save and cash out in turns securely.</p>
            </div>
            <div className="absolute -bottom-4 -right-4">
              <PiggyBank size={120} strokeWidth={1.5} className="text-[#00C896] opacity-30 group-hover:opacity-70 transition-all duration-700" />
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
          <div className="feature-card relative bg-[#161616] rounded-md p-8 md:col-span-2 overflow-hidden transition-all group">
            <div className="relative z-10 max-w-[65%]">
              <h3 className="clash-display font-bold text-2xl mb-4">
                <span className="bg-[#00C896] text-[#0D0D0D] px-2 py-0.5 rounded-sm">MiniPay Native</span>
              </h3>
              <p className="dm-sans text-[#8A8A8A] text-sm leading-[1.6]">Built specifically for MiniPay. No extra apps, no new wallets. Use your existing cUSD balance directly.</p>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-72 h-36">
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
  );
};
