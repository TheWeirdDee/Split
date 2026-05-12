import React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className, showText = true }: LogoProps) => {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group transition-all active:scale-95", className)}>
      <div className="relative w-8 h-8 flex items-center justify-center">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Left arrow: chevron pointing LEFT */}
          <path 
            d="M18 8L10 16L18 24" 
            stroke="#00c896" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Right arrow: chevron pointing RIGHT, dimmed */}
          <path 
            d="M14 8L22 16L14 24" 
            stroke="rgba(0, 200, 150, 0.5)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
      {showText && (
        <span className="clash-display font-semibold text-[18px] tracking-[-0.03em] text-[#f5f0e8] group-hover:text-[#00c896] transition-colors lowercase align-middle">
          split
        </span>
      )}
    </Link>
  );
};
