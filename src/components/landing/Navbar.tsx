"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// --- Local Helper Components ---

export const Logo = () => (
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

export const Button = ({ children, variant = "primary", className = "", ...props }: any) => {
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

export const Navbar = () => {
  const navRef = useRef(null);

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
    });

    return () => ctx.revert();
  }, []);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-[100] h-16 transition-all duration-300 flex items-center border-b border-transparent">
      <div className="max-w-[1280px] mx-auto w-full px-12 flex items-center justify-between">
        <Logo />
        
        <div className="hidden md:flex items-center gap-10 text-[14px] font-sans text-[#7a7a7a]">
          {["Features", "How it works", "FAQ"].map((item) => (
            <Link key={item} href={item === "FAQ" ? "/faq" : `#${item.toLowerCase().replace(/ /g, '-')}`} className="relative group transition-colors hover:text-[#f5f0e8]">
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
  );
};
