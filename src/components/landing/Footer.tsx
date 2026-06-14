"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "./Navbar";
import { Globe } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-[#242424] py-12 px-8 bg-[#0a0a0a]">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
          <Logo />
          <div className="flex gap-8 text-[13px] text-[#3a3a3a] font-sans">
            <Link href="#" className="hover:text-[#f5f0e8] transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-[#f5f0e8] transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-[#f5f0e8] transition-colors">Built on Celo</Link>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-[#242424]/50 text-[11px] dm-mono text-[#3a3a3a] tracking-wider">
          <p>© 2025 Split · Built on Celo · Open Source</p>
          <p className="flex items-center gap-1.5 uppercase font-bold">Made in Africa <Globe className="w-3.5 h-3.5 text-[#00C896]" /></p>
        </div>
      </div>
    </footer>
  );
};
