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
        {/* Outer Ring */}
        <div className="absolute inset-0 bg-brand/20 rounded-lg rotate-12 group-hover:rotate-45 transition-transform duration-500" />
        
        {/* Inner Core */}
        <div className="relative w-full h-full bg-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/20 overflow-hidden">
          {/* Diagonal Slash Effect */}
          <div className="absolute inset-0 bg-bg/10 -translate-x-1/2 -translate-y-1/2 rotate-45 h-[200%] w-1" />
          <span className="clash-display font-bold text-bg text-xl relative z-10">S</span>
        </div>
      </div>
      
      {showText && (
        <span className="clash-display font-bold text-xl tracking-tight text-text-primary">
          Split<span className="text-brand">.</span>
        </span>
      )}
    </Link>
  );
};
