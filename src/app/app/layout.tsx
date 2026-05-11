"use client";

import React from 'react';
import { BottomNav } from '@/components/app/BottomNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg min-h-screen text-text-primary selection:bg-brand selection:text-bg">
      <div className="max-w-[430px] mx-auto min-h-screen border-x border-border flex flex-col relative bg-bg">
        <main className="flex-1 pb-[80px]">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
