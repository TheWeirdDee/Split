"use client";

import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <span className="clash-display font-bold text-bg text-xl">S</span>
          </div>
          <span className="clash-display font-bold text-xl tracking-tight text-text-primary">
            Split
          </span>
        </div>
        
        <div className="flex gap-8 text-xs font-medium text-text-muted uppercase tracking-widest">
          <Link href="#" className="hover:text-brand transition-colors">Twitter</Link>
          <Link href="#" className="hover:text-brand transition-colors">GitHub</Link>
          <Link href="#" className="hover:text-brand transition-colors">Celo</Link>
        </div>

        <p className="text-[10px] dm-mono text-text-muted text-center md:text-right">
          Split · Built on Celo Mainnet · Season 2 Proof of Ship<br />
          © {new Date().getFullYear()} Split Labs. No rights reserved.
        </p>
      </div>
    </footer>
  );
};
