"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '../common/Button';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] h-20 transition-all duration-300 flex items-center px-6 md:px-12",
      scrolled ? "glass border-b border-border h-16" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12">
            <span className="clash-display font-bold text-bg text-2xl">S</span>
          </div>
          <span className="clash-display font-bold text-2xl tracking-tight text-text-primary">
            Split
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
          <Link href="#features" className="hover:text-brand transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-brand transition-colors">How it works</Link>
          <Link href="#faq" className="hover:text-brand transition-colors">FAQ</Link>
        </div>

        <Link href="/app">
          <Button variant="primary" className="rounded-full px-6 font-semibold">
            Open App →
          </Button>
        </Link>
      </div>
    </nav>
  );
};
